---
title: Kubernetes 1.34 + RHEL10 + Cilium + kube-vip 高可用集群部署
categories:
  - 容器
tags: [部署]
abbrlink: 786c9442
date: 2026-01-10 23:19:23
cover: ""
updated: 2026-01-11 11:54:01
---

> 适用场景：
>
> - 裸机 / 虚拟机环境
> - 无云厂商 LB
> - 追求 eBPF + 原生路由的高性能网络

## 环境介绍

| 主机名     | IP        | 安装组件                                                                            |
| ------- | --------- | ------------------------------------------------------------------------------- |
| master1 | 10.0.0.11 | etcd、apiserver、controller-manager、scheduler、kubelet、containerd、kubeadm、kube-vip |
| master2 | 10.0.0.12 | etcd、apiserver、controller-manager、scheduler、kubelet、containerd、kubeadm、kube-vip |
| master3 | 10.0.0.13 | etcd、apiserver、controller-manager、scheduler、kubelet、containerd、kubeadm、kube-vip |

**基础环境**

- 操作系统：CentOS Stream 10
- Kubernetes：v1.34.3
- 容器运行时：containerd
- CNI：Cilium
- 高可用方式：kube-vip（ARP 模式）

## 准备工作（所有节点）

### 关闭防火墙与 SELinux

```bash
sudo systemctl disable --now firewalld
setenforce 0
sed -i "s/^SELINUX=.*/SELINUX=disabled/g" /etc/selinux/config
```

### 配置主机名

```bash
hostnamectl set-hostname master1
```

### 配置 hosts

```bash
cat >> /etc/hosts <<EOF
10.0.0.11 master1
10.0.0.12 master2
10.0.0.13 master3
EOF
```

### 关闭 Swap

```bash
swapoff -a
sed -ri 's/.*swap.*/#&/' /etc/fstab
```

### 时间同步

```bash
dnf install -y chrony
systemctl enable --now chronyd

# 查看时间状态
timedatectl status
```

### 内核参数与模块

```bash
cat > /etc/modules-load.d/k8s.conf <<EOF
overlay
EOF

modprobe overlay

cat <<EOF | sudo tee /etc/sysctl.d/99-kubernetes-cri.conf
net.bridge.bridge-nf-call-iptables  = 1
net.ipv4.ip_forward                 = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF

sysctl -p
# rhel10 测试要重启
```

### 启用 cgroup v2

CentOS Stream 10 默认已经启用了 cgroup v2

## 安装 Containerd（所有节点）

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

### 启用 SystemdCgroup

```bash
mkdir -p /etc/containerd
containerd config default > /etc/containerd/config.toml
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
systemctl enable --now containerd
systemctl restart containerd
```

## 安装 Kubernetes 组件（所有节点）

### 配置 yum 源

{% tabs TabName %}

<!-- tab 国内源 -->

```bash
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes-new/core/stable/v1.34/rpm/
enabled=1
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/kubernetes-new/core/stable/v1.34/rpm/repodata/repomd.xml.key
exclude=kubelet kubeadm kubectl cri-tools kubernetes-cni
EOF
```

<!-- endtab -->

<!-- tab 官方源 -->

```bash
cat <<EOF | sudo tee /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://pkgs.k8s.io/core:/stable:/v1.34/rpm/
enabled=1
gpgcheck=1
gpgkey=https://pkgs.k8s.io/core:/stable:/v1.34/rpm/repodata/repomd.xml.key
exclude=kubelet kubeadm kubectl cri-tools kubernetes-cni
EOF
```

<!-- endtab -->

{% endtabs %}

### 安装

```bash
# 查看可用的版本
yum list kubelet kubeadm kubectl --showduplicates --disableexcludes=kubernetes

yum install -y kubelet-1.34.3 kubeadm-1.34.3 kubectl-1.34.3 --disableexcludes=kubernetes

systemctl enable --now kubelet
```

### 配置 crictl

```bash
crictl config --set runtime-endpoint=unix:///run/containerd/containerd.sock
```

## 初始化 Kubernetes（首个 Master）

### 创建集群

```bash
# 也可以先拉取镜像
# kubeadm config images pull --kubernetes-version 1.34.3

ip addr add 10.0.0.10/24 dev ens160

sudo kubeadm init \
  --control-plane-endpoint "10.0.0.10:6443" \
  --kubernetes-version 1.34.3 \
  --upload-certs \
  --service-cidr=10.96.0.0/12 \
  --pod-network-cidr=10.244.0.0/16 \
  --skip-phases=addon/kube-proxy
```

### 配置 kubectl

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

## 安装 Cilium（首个 master）

### 安装 cilium-cli

```bash
dnf install tar -y

CILIUM_CLI_VERSION=$(curl -s https://raw.githubusercontent.com/cilium/cilium-cli/main/stable.txt)
CLI_ARCH=amd64

if [ "$(uname -m)" = "aarch64" ]; then CLI_ARCH=arm64; fi
curl -L --fail --remote-name-all https://github.com/cilium/cilium-cli/releases/download/${CILIUM_CLI_VERSION}/cilium-linux-${CLI_ARCH}.tar.gz{,.sha256sum}
sha256sum --check cilium-linux-${CLI_ARCH}.tar.gz.sha256sum
sudo tar xzvfC cilium-linux-${CLI_ARCH}.tar.gz /usr/local/bin
rm -f cilium-linux-${CLI_ARCH}.tar.gz{,.sha256sum}
```

{% tabs TabName %}

<!-- tab 原生路由模式（适合自建机房） -->

```bash
cilium install \
  --set kubeProxyReplacement=true \
  --set ipam.mode=cluster-pool \
  --set routingMode=native \
  --set ipam.operator.clusterPoolIPv4PodCIDRList=10.244.0.0/16 \
  --set ipam.operator.clusterPoolIPv4MaskSize=24 \
  --set ipv4NativeRoutingCIDR=10.244.0.0/16 \
  --set autoDirectNodeRoutes=true \
  --set bpf.masquerade=true
```

<!-- endtab -->

<!-- tab VXLAN 模式（云环境） -->

```bash
cilium install \
  --set kubeProxyReplacement=true \
  --set tunnel=vxlan \
  --set ipam.mode=cluster-pool \
  --set ipam.operator.clusterPoolIPv4PodCIDRList=10.244.0.0/16 \
  --set ipam.operator.clusterPoolIPv4MaskSize=24 \
  --set bpf.masquerade=true
```

<!-- endtab -->

{% endtabs %}

### 检查状态

```bash
cilium status --wait


    /¯¯\
 /¯¯\__/¯¯\    Cilium:             OK
 \__/¯¯\__/    Operator:           OK
 /¯¯\__/¯¯\    Envoy DaemonSet:    OK
 \__/¯¯\__/    Hubble Relay:       disabled
    \__/       ClusterMesh:        disabled

DaemonSet              cilium                   Desired: 1, Ready: 1/1, Available: 1/1
DaemonSet              cilium-envoy             Desired: 1, Ready: 1/1, Available: 1/1
Deployment             cilium-operator          Desired: 1, Ready: 1/1, Available: 1/1
Containers:            cilium                   Running: 1
                       cilium-envoy             Running: 1
                       cilium-operator          Running: 1
                       clustermesh-apiserver    
                       hubble-relay             
Cluster Pods:          2/2 managed by Cilium
Helm chart version:    1.18.3
Image versions         cilium             quay.io/cilium/cilium:v1.18.3@sha256:5649db451c88d928ea585514746d50d91e6210801b300c897283ea319d68de15: 1
                       cilium-envoy       quay.io/cilium/cilium-envoy:v1.34.10-1761014632-c360e8557eb41011dfb5210f8fb53fed6c0b3222@sha256:ca76eb4e9812d114c7f43215a742c00b8bf41200992af0d21b5561d46156fd15: 1
                       cilium-operator    quay.io/cilium/operator-generic:v1.18.3@sha256:b5a0138e1a38e4437c5215257ff4e35373619501f4877dbaf92c89ecfad81797: 1
```

## 部署 kube-vip（首个 master）

```bash
export VIP=10.0.0.10
export INTERFACE=ens160
kubectl apply -f https://kube-vip.io/manifests/rbac.yaml


ctr image pull docker.io/plndr/kube-vip:v1.0.3
ctr run --rm --net-host docker.io/plndr/kube-vip:v1.0.3 kube-vip /kube-vip manifest pod \
  --interface $INTERFACE \
  --address $VIP \
  --controlplane \
  --services \
  --arp \
  --leaderElection \
  | tee /etc/kubernetes/manifests/kube-vip.yaml
```

## 其余节点加入集群

### 生成 token

```bash
# 这条命令生成加入命令
kubeadm token create --print-join-command --ttl 30m

# 这条命令会生成一个key
kubeadm init phase upload-certs --upload-certs
```

### 增加 Master 节点

```bash
# 发送 kube-vip 配置文件到其他 Master 节点
cd /etc/kubernetes/manifests
scp kube-vip.yaml 10.0.0.12:$PWD
scp kube-vip.yaml 10.0.0.13:$PWD

# 参考上一步的生成token的结果
kubeadm join 10.0.0.10:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash> --control-plane --certificate-key <key>
```

### 增加 Node 节点

```bash
# 参考上面生成token步骤的输出结果
kubeadm join 10.0.0.10:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>
```

## 验证部署

```bash
kubectl create deployment testdp --image=nginx:1.23.2
kubectl expose deployment testdp --port=80 --type=NodePort
kubectl get pods,svc
```

浏览器访问：

```bash
http://10.0.0.11:NodePort
http://10.0.0.12:NodePort
http://10.0.0.13:NodePort
```
