---
title: 使用kubeadm部署一套高可用k8s集群1.34 for Ubuntu
abbrlink: t4ve3m
categories:
  - 容器
cover: ""
tags: [Linux, Container, Kubernetes, 配置记录, Docker, keepalived, kubeadm]
date: 2025-10-29 09:42:58
updated: 2025-10-29 14:16:16
---

> 基于 ubuntu 使用 kubeadm 搭建集群， [centos部署文档](/posts/b86d9e9f/), 有疑问的地方可以看 [官方文档](https://kubernetes.io/zh/docs/setup/production-environment/tools/kubeadm/)

## 准备机器

> 我的机器详情如下, 配置至少为 4C4G

| hostname | IP        | 作用                            |
| -------- | --------- | ----------------------------- |
| master1  | 10.0.0.11 | k8s master 节点                 |
| master2  | 10.0.0.12 | k8s master 节点                 |
| master3  | 10.0.0.13 | k8s master 节点                 |
| worker1  | 10.0.0.21 | k8s worker 节点                 |
| worker2  | 10.0.0.22 | k8s worker 节点                 |

每台机器都做域名解析，或者绑定 hosts(可选但建议)

```bash
vim /etc/hosts

10.0.0.11 master1
10.0.0.12 master2
10.0.0.13 master3
```

## 基础环境配置

> 基础环境是不管 master 还是 worker 都需要的环境

1. 禁用 swap
2. 确保每个节点上 MAC 地址和 product_uuid 的唯一性 `sudo cat /sys/class/dmi/id/product_uuid`
3. 修改 hostname
4. 允许 iptables 检查桥接流量
5. 关闭防火墙

```bash
sudo systemctl disable --now ufw

cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
br_netfilter
EOF

cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
sudo sysctl --system
```

### 安装 runtime

{% tabs TabName %}

<!-- tab Containerd -->

#### 先决条件

```bash
cat <<EOF | sudo tee /etc/modules-load.d/containerd.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

# 设置必需的 sysctl 参数，这些参数在重新启动后仍然存在。
cat <<EOF | sudo tee /etc/sysctl.d/99-kubernetes-cri.conf
net.bridge.bridge-nf-call-iptables  = 1
net.ipv4.ip_forward                 = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF

# 应用 sysctl 参数而无需重新启动
sudo sysctl --system
```

#### 安装

```bash
# 安装依赖
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# 信任密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加仓库
echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
$(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装containerd
sudo apt update
sudo apt install -y containerd.io
```

#### 配置

生成默认配置

```bash
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml
```

结合 runc 使用 systemd cgroup 驱动，在 `/etc/containerd/config.toml` 中设置

```bash
# 结合 runc 使用 systemd cgroup 驱动，在 `/etc/containerd/config.toml` 中设置
sed -i 's#SystemdCgroup = .*#SystemdCgroup = true#g' /etc/containerd/config.toml

# 修改 pause容器 镜像，不能拉取官方镜像的可以使用阿里云镜像源
# sed -i 's#sandbox_image = .*#sandbox_image = "registry.aliyuncs.com/google_containers/pause:3.9"#g' /etc/containerd/config.toml
sed -i 's#sandbox_image = .*#sandbox_image = "registry.k8s.io/pause:3.10.1"#g' /etc/containerd/config.toml
```

`sudo systemctl restart containerd`

#### crictl 配置

之前使用 docker 的时候，docker 给我们做了很多好用的工具，现在用了 containerd，管理容器我们用 cri 管理工具 crictl，创建配置文件

vim /etc/crictl.yaml

```yaml
runtime-endpoint: unix:///run/containerd/containerd.sock
debug: false
```

<!-- endtab -->

<!-- tab Docker -->

#### 安装 Docker

```bash
curl -fsSL get.docker.com | bash
```

#### 配置 Doker

```json
sudo mkdir /etc/docker
cat <<EOF | sudo tee /etc/docker/daemon.json
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  },
  "storage-driver": "overlay2"
}
EOF

sudo systemctl enable --now docker
```

<!-- endtab -->
{% endtabs %}

### 安装 kubeadm、kubelet 和 kubectl

> 这一步需要科学上网, 不能科学上网的可以看看国内的源。

更新 apt 包索引并安装使用 Kubernetes apt 仓库所需要的包：

```bash
sudo apt update
sudo apt-get install -y apt-transport-https ca-certificates curl gpg
```

下载 Google Cloud 公开签名秘钥与添加 Kubernetes apt 仓库：

官方版本变更较快，详情查看官方文档<https://kubernetes.io/zh-cn/docs/setup/production-environment/tools/kubeadm/install-kubeadm/>

更新 apt 包索引，安装 kubelet、kubeadm 和 kubectl，并锁定其版本：

```bash
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.34/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.34/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt update

# 查看可用的版本号
sudo apt-cache madison kubeadm
sudo apt install -y kubeadm=1.34.1-1.1 kubelet=1.34.1-1.1 kubectl=1.34.1-1.1

# 锁定版本，不随 apt upgrade 更新
sudo apt-mark hold kubelet kubeadm kubectl
sudo systemctl enable --now kubelet

```

## 准备高可用方案

高可用方案有很多种，其他方案请参考 [Kubernetes之master高可用方案](/posts/10cef768/)

这里使用**每台**节点部署 nginx 反代来实现高可用，这种方式需要**所有**节点都安装负载均衡 (包括 master 和 worker )

```bash
mkdir -p /etc/kube-lb/{conf,logs,sbin}

curl -L -C - https://s3.babudiu.com/src/linux/bin/kube-lb -o /etc/kube-lb/sbin/kube-lb
chmod +x /etc/kube-lb/sbin/kube-lb


cat > /etc/kube-lb/conf/kube-lb.conf <<'EOF'
user root;
worker_processes 1;

error_log  /etc/kube-lb/logs/error.log warn;

events {
    worker_connections  3000;
}

stream {
    upstream backend {
        server 10.0.0.11:6443    max_fails=2 fail_timeout=3s;
        server 10.0.0.12:6443    max_fails=2 fail_timeout=3s;
        server 10.0.0.13:6443    max_fails=2 fail_timeout=3s;
    }

    server {
        listen 127.0.0.1:8443;
        proxy_connect_timeout 1s;
        proxy_pass backend;
    }
}
EOF

cat > /etc/systemd/system/kube-lb.service <<'EOF'
[Unit]
Description=l4 nginx proxy for kube-apiservers
After=network.target
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
ExecStartPre=/etc/kube-lb/sbin/kube-lb -c /etc/kube-lb/conf/kube-lb.conf -p /etc/kube-lb -t
ExecStart=/etc/kube-lb/sbin/kube-lb -c /etc/kube-lb/conf/kube-lb.conf -p /etc/kube-lb
ExecReload=/etc/kube-lb/sbin/kube-lb -c /etc/kube-lb/conf/kube-lb.conf -p /etc/kube-lb -s reload
PrivateTmp=true
Restart=always
RestartSec=15
StartLimitInterval=0
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF


# 启动服务
systemctl enable --now kube-lb
```

{% note default flat %}
kube-lb 其实就是自己编译的 Nginx，精简了 http 模块，只开启了 stream 模块用作 4 层转发，详细参数如下：

```plaintext
nginx version: nginx/1.24.0
built by gcc 4.8.5 20150623 (Red Hat 4.8.5-44) (GCC)
configure arguments: --with-stream --without-http --without-http_uwsgi_module --without-http_scgi_module --without-http_fastcgi_module
```

{% endnote %}

## 创建集群

### kubeadm init

{% tabs TabName %}

<!-- tab 官方镜像源 -->

在 init 之前先将镜像拉取到本地（可选步骤）

```bash
kubeadm config images pull --kubernetes-version 1.34.1
```

其中会拉下来一个 pause 镜像，尽量再修改一下 containerd 里面配置的 pause 镜像，版本保持一致。

在 k8s-master0 上执行

```bash
sudo kubeadm init \
--kubernetes-version 1.34.1 \
--control-plane-endpoint "127.0.0.1:8443" \
--upload-certs \
--service-cidr=10.96.0.0/12 \
--pod-network-cidr=10.244.0.0/16
```

<!-- endtab -->

<!-- tab 国内阿里云镜像源 -->

在 init 之前先将镜像拉取到本地（可选步骤）

```bash
kubeadm config images pull --kubernetes-version 1.34.1 --image-repository registry.cn-hangzhou.aliyuncs.com/google_containers
```

在 k8s-master0 上执行

```bash
sudo kubeadm init \
--kubernetes-version 1.34.1 \
--control-plane-endpoint "127.0.0.1:8443" \
--image-repository registry.cn-hangzhou.aliyuncs.com/google_containers \
--upload-certs \
--service-cidr=10.96.0.0/12 \
--pod-network-cidr=10.244.0.0/16
```

<!-- endtab -->
{% endtabs %}

> 也可以用 `kubeadm config print init-defaults > init.yaml` 生成 kubeadm 的配置，并用
> `kubeadm init --config=init.yaml` 来创建集群。

### 安装网络插件

{% tabs 网络插件 %}

<!-- tab 安装flannel插件 -->

```bash
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

<!-- endtab -->

<!-- tab 安装calico插件 -->

```bash
待补充
```

<!-- endtab -->
{% endtabs %}

## 常见问题

[kubeadm 部署的集群 常见问题汇总](/posts/sepu3k/)
