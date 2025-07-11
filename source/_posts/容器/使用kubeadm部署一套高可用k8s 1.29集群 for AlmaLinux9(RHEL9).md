---
title: 使用kubeadm部署一套高可用k8s 1.29集群 for AlmaLinux9(RHEL9)
abbrlink: lq0y87n5
cover: 'https://s3.babudiu.com/iuxt/public/Kubeadm.svg'
categories:
  - 容器
tags:
  - Linux
  - Container
  - Kubernetes
  - 配置记录
  - kubeadm
date: 2023-12-11 21:44:33
---

> 基于 AlmaLinux9 使用 kubeadm 搭建集群， [ubuntu部署文档](/posts/526ffc9a/), 有疑问的地方可以看 [官方文档](https://kubernetes.io/zh/docs/setup/production-environment/tools/kubeadm/), 本教程需要能访问 **国际互联网** 。不能的话，需要解决镜像拉取问题、yum 安装组件的问题。

## 准备机器

> 我的机器详情如下, 配置至少为 4C4G

| hostname | IP        | 作用                 |
| -------- | --------- | ------------------ |
| master1  | 10.0.0.11 | k8s master 节点      |
| master2  | 10.0.0.12 | k8s master 节点      |
| master3  | 10.0.0.13 | k8s master 节点      |
| worker1  | 10.0.0.21 | k8s worker 节点      |
| worker2  | 10.0.0.22 | k8s worker 节点      |

每台机器都做域名解析，或者绑定 hosts（直接使用 ip 地址会有警告）

```bash
vim /etc/hosts

10.0.0.10  public kube-apiserver
10.0.0.11 master1
10.0.0.12 master2
10.0.0.13 master3
```

每台机器都关闭防火墙和 SELinux

> 负载均衡机器必须要关闭,因为 6443 不是 nginx 的标准端口,会被 selinux 拦截, 防火墙也需要放行 6443 端口, 可以考虑直接关闭防火墙

```bash
sudo systemctl disable --now firewalld
setenforce 0
sed -i "s/^SELINUX=.*/SELINUX=disabled/g" /etc/selinux/config

# RHEL9系列完全关闭selinux需要修改内核启动参数，/etc/selinux/config 文件里面有说明
```

## 基础环境配置

> 基础环境是不管 master 还是 worker 都需要的环境

1. 禁用 swap
2. 确保每个节点上 MAC 地址和 product_uuid 的唯一性 `sudo cat /sys/class/dmi/id/product_uuid`
3. 修改 hostname

### 安装 runtime

#### 设置内核参数

```bash
# 设置必需的 sysctl 参数，这些参数在重新启动后仍然存在。
cat <<EOF | sudo tee /etc/sysctl.d/99-kubernetes-cri.conf
net.bridge.bridge-nf-call-iptables  = 1
net.ipv4.ip_forward                 = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF

# 应用 sysctl 参数而无需重新启动
sudo sysctl --system
```

#### 启用内核模块

```bash
cat <<EOF | sudo tee /etc/modules-load.d/containerd.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter
```

#### 安装

```bash
# 卸载旧版本Docker
sudo yum remove docker \
              docker-client \
              docker-client-latest \
              docker-common \
              docker-latest \
              docker-latest-logrotate \
              docker-logrotate \
              docker-engine

# 安装docker仓库
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装containerd
sudo yum install containerd.io -y
```

#### 配置

从 yum 源安装的 containerd 默认禁用了 cri，可以使用命令重新生成默认配置

```bash
# 软件包中自带的配置文件不全，使用命令生成。
containerd config default | sudo tee /etc/containerd/config.toml

# 结合 runc 使用 systemd cgroup 驱动，在 `/etc/containerd/config.toml` 中设置
sed -i 's#SystemdCgroup = .*#SystemdCgroup = true#g' /etc/containerd/config.toml

# 修改 pause容器 镜像，不能拉取官方镜像的可以使用阿里云镜像源
# sed -i 's#sandbox_image = .*#sandbox_image = "registry.aliyuncs.com/google_containers/pause:3.9"#g' /etc/containerd/config.toml
sed -i 's#sandbox_image = .*#sandbox_image = "registry.k8s.io/pause:3.9"#g' /etc/containerd/config.toml

# 设置开机自启动
sudo systemctl enable containerd
sudo systemctl restart containerd
```

#### crictl 配置

之前使用 docker 的时候，docker 给我们做了很多好用的工具，现在用了 containerd，管理容器我们用 cri 管理工具 crictl，创建配置文件

```bash
cat > /etc/crictl.yaml <<-'EOF'
runtime-endpoint: unix:///run/containerd/containerd.sock
debug: false
EOF
```

### 安装 kubeadm、kubelet 和 kubectl

```bash
cat <<EOF | sudo tee /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://pkgs.k8s.io/core:/stable:/v1.29/rpm/
enabled=1
gpgcheck=1
gpgkey=https://pkgs.k8s.io/core:/stable:/v1.29/rpm/repodata/repomd.xml.key
exclude=kubelet kubeadm kubectl cri-tools kubernetes-cni
EOF

# 查看可用的版本
yum list kubelet kubeadm kubectl  --showduplicates --disableexcludes=kubernetes

sudo yum install -y kubelet-1.29.5 kubeadm-1.29.5 kubectl-1.29.5 --disableexcludes=kubernetes
sudo systemctl enable --now kubelet
```

## kube-apiserver 高可用方案

高可用方案有很多种，其他方案请参考 [Kubernetes之master高可用方案](/posts/10cef768/)

这里使用**每台**节点部署 nginx 反代来实现高可用，这种方式需要**所有**节点都安装负载均衡 (包括 master 和 worker )

```bash
mkdir -p /etc/kube-lb/{conf,logs,sbin}

curl -L -C - https://file.babudiu.com/f/qjhX/kube-lb -o /etc/kube-lb/sbin/kube-lb
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

### 提前拉镜像（可选）

```bash
kubeadm config images pull \
--kubernetes-version 1.29.5 \
--image-repository registry.aliyuncs.com/google_containers
```

### kubeadm init

在 master1 上执行

```bash
sudo kubeadm init \
--control-plane-endpoint "127.0.0.1:8443" \
--kubernetes-version 1.29.5 \
--upload-certs \
--service-cidr=10.96.0.0/12 \
--pod-network-cidr=10.244.0.0/16
```

- 也可以用 `kubeadm config print init-defaults > init.yaml` 生成 kubeadm 的配置，并用 `kubeadm init --config=init.yaml` 来创建集群。
- 如果负载均衡没有准备好，也可以临时添加 VIP `ip addr add 10.0.0.10 dev eth0`
- 如果不能拉官方镜像，增加参数使用阿里云镜像源 `--image-repository registry.aliyuncs.com/google_containers`

### 安装网络插件

{% tabs TabName %}

<!-- tab 安装flannel插件 -->

```bash
# 如果修改了 pod-network-cidr 这个yml文件也需要修改
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
