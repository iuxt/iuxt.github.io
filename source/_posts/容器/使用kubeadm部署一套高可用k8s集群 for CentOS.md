---
title: 使用kubeadm部署一套高可用k8s集群 for CentOS
abbrlink: b86d9e9f
cover: 'https://s3.babudiu.com/iuxt/public/Kubeadm.svg'
categories:
  - 容器
tags:
  - Linux
  - Container
  - Kubernetes
  - 配置记录
  - Docker
  - kubeadm
date: 2022-05-07 11:22:50
---

> 基于 centos 使用 kubeadm 搭建集群， [ubuntu部署文档](/posts/526ffc9a/), 有疑问的地方可以看 [官方文档](https://kubernetes.io/zh/docs/setup/production-environment/tools/kubeadm/)

## 准备机器

> 我的机器详情如下, 配置至少为 4C4G

| hostname | IP        | 作用                                  |
| -------- | --------- | ------------------------------------- |
| public   | 10.0.0.3  | ingress 和 apiserver 的负载均衡，nfs 存储 |
| master1  | 10.0.0.11 | k8s master 节点                        |
| master2  | 10.0.0.12 | k8s master 节点                        |
| master3  | 10.0.0.13 | k8s master 节点                        |
| worker1  | 10.0.0.21 | k8s worker 节点                        |
| worker2  | 10.0.0.22 | k8s worker 节点                        |

每台机器都做域名解析，或者绑定 hosts(可选但建议)

```bash
vim /etc/hosts

10.0.0.3  public kube-apiserver
10.0.0.11 master1
10.0.0.12 master2
10.0.0.13 master3
```

每台机器都关闭防火墙和 SELinux

> 负载均衡机器必须要关闭,因为 6443 不是 nginx 的标准端口,会被 selinux 拦截, 防火墙也需要放行 6443 端口, 可以考虑直接关闭

```bash
sudo systemctl disable --now firewalld
setenforce 0
sed -i "s/^SELINUX=.*/SELINUX=disabled/g" /etc/selinux/config
```

## 基础环境配置

> 基础环境是不管 master 还是 worker 都需要的环境

1. 禁用 swap
2. 确保每个节点上 MAC 地址和 product_uuid 的唯一性 `sudo cat /sys/class/dmi/id/product_uuid`
3. 修改 hostname
4. 允许 iptables 检查桥接流量

```bash
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

{% tabs runtime %}

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
sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo

# 安装containerd
sudo yum install containerd.io -y
```

#### 配置

生成默认配置

```bash
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml
```

结合 runc 使用 systemd cgroup 驱动，在 `/etc/containerd/config.toml` 中设置

```toml
[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
...
[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
   SystemdCgroup = true
```

```bash
sudo systemctl enable containerd
sudo systemctl restart containerd
```

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

```bash
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

{% tabs TabName %}

<!-- tab 使用官方仓库 -->

```bash
cat <<EOF | sudo tee /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://packages.cloud.google.com/yum/repos/kubernetes-el7-\$basearch
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
exclude=kubelet kubeadm kubectl
EOF


sudo yum install -y kubelet-1.21.10-0 kubeadm-1.21.10-0 kubectl-1.21.10-0 --disableexcludes=kubernetes

sudo systemctl enable --now kubelet
```

<!-- endtab -->

<!-- tab 使用阿里云镜像仓库 -->

```bash
# 创建仓库文件
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF


# 安装指定版本的kubeadm
yum install -y --nogpgcheck kubelet-1.21.10-0 kubeadm-1.21.10-0 kubectl-1.21.10-0

# 启动kubelet
systemctl enable --now kubelet
```

<!-- endtab -->
{% endtabs %}

## 准备高可用方案

[Kubernetes之master高可用方案](/posts/10cef768/)

## 创建集群

### kubeadm init

{% tabs TabName %}

<!-- tab 官方镜像源 -->

在 init 之前先将镜像拉取到本地（可选步骤）

```bash
kubeadm config images pull --kubernetes-version 1.21.10
```

在 k8s-master0 上执行

```bash
sudo kubeadm init \
--kubernetes-version 1.21.10 \
--control-plane-endpoint "kube-apiserver:6443" \
--upload-certs \
--service-cidr=10.96.0.0/12 \
--pod-network-cidr=10.244.0.0/16
```

<!-- endtab -->

<!-- tab 国内阿里云镜像源 -->

在 init 之前先将镜像拉取到本地（可选步骤）

```bash
kubeadm config images pull --kubernetes-version 1.21.10 --image-repository registry.cn-hangzhou.aliyuncs.com/google_containers
```

在 k8s-master0 上执行

```bash
sudo kubeadm init \
--kubernetes-version 1.21.10 \
--control-plane-endpoint "kube-apiserver:6443" \
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

{% tabs TabName %}

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
