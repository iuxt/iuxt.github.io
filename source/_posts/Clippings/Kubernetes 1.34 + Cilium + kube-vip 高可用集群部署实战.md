---
title: Kubernetes 1.34 + Cilium + kube-vip 高可用集群部署实战
date: 2026-01-09 17:49:43
updated: 2026-01-10 18:46:28
---

> 适用场景：
>
> - 裸机 / 虚拟机环境
> - 无云厂商 LB
> - 追求 eBPF + 原生路由的高性能网络

## 一、环境介绍

| 主机名   | IP        | 安装组件                                                                            |
| ----- | --------- | ------------------------------------------------------------------------------- |
| master1 | 10.0.0.11 | etcd、apiserver、controller-manager、scheduler、kubelet、containerd、kubeadm、kube-vip |
| master2 | 10.0.0.12 | etcd、apiserver、controller-manager、scheduler、kubelet、containerd、kubeadm、kube-vip |
| master3 | 10.0.0.13 | etcd、apiserver、controller-manager、scheduler、kubelet、containerd、kubeadm、kube-vip |

**基础环境**

- 操作系统：CentOS Stream 10
- Kubernetes：v1.34.3
- 容器运行时：containerd
- CNI：Cilium
- 高可用方式：kube-vip（ARP 模式）

## 二、准备工作（所有节点）

### 1\. 关闭防火墙与 SELinux

```bash
sudo systemctl disable --now firewalld
setenforce 0
sed -i "s/^SELINUX=.*/SELINUX=disabled/g" /etc/selinux/config
```

### 2\. 配置主机名

```bash
hostnamectl set-hostname master1
```

### 3\. 配置 hosts

```bash
cat >> /etc/hosts <<EOF
10.0.0.11 master1
10.0.0.12 master2
10.0.0.13 master3
EOF
```

### 4\. 关闭 Swap

```bash
swapoff -a
sed -ri 's/.*swap.*/#&/' /etc/fstab
```

### 5\. 时间同步

```bash
dnf install -y chrony
systemctl enable --now chronyd

# 查看时间状态
timedatectl status
```

### 6\. 内核参数与模块

```bash
cat > /etc/modules-load.d/k8s.conf <<EOF
overlay
br_netfilter
EOF
​
modprobe overlay
modprobe br_netfilter
​
cat >> /etc/sysctl.conf <<EOF
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
vm.swappiness = 0
EOF
​
sysctl -p
```

### 7\. 启用 cgroup v2（Cilium 强烈推荐）

CentOS Stream 10 默认已经启用了 cgroup v2

## 三、安装 Containerd（所有节点）

### 1\. 安装 containerd

```bash
wget https://github.com/containerd/containerd/releases/download/v2.2.1/containerd-2.2.1-linux-amd64.tar.gz
tar xvf containerd-2.2.1-linux-amd64.tar.gz -C /usr/local
```

### 2\. 配置 systemd 服务

```bash
wget -O /usr/lib/systemd/system/containerd.service https://raw.githubusercontent.com/containerd/containerd/main/containerd.service
systemctl daemon-reload
systemctl enable --now containerd
```

### 3\. 安装 runc

```bash
wget https://github.com/opencontainers/runc/releases/download/v1.4.0/runc.amd64
install -m 755 runc.amd64 /usr/local/sbin/runc
```

### 4\. 启用 SystemdCgroup

```bash
mkdir -p /etc/containerd
containerd config default > /etc/containerd/config.toml
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
systemctl restart containerd
```

## 四、安装 Kubernetes 组件

配置 yum 源：

```bash
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes-new/core/stable/v1.34/rpm/
enabled=1
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/kubernetes-new/core/stable/v1.34/rpm/repodata/repomd.xml.key
EOF
```

安装：

```bash
dnf install -y kubelet-1.34.3 kubeadm-1.34.3 kubectl-1.34.3
systemctl enable --now kubelet
```

配置 crictl：

```bash
crictl config --set runtime-endpoint=unix:///run/containerd/containerd.sock
```

## 五、初始化 Kubernetes（首个 Master）

```bash
kubeadm init \
  --kubernetes-version=v1.34.3 \
  --service-cidr=10.96.0.0/12 \
  --pod-network-cidr=10.244.0.0/16 \
  --skip-phases=addon/kube-proxy
```

配置 kubectl：

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

## 六、安装 Cilium（kube-proxy-free）

### 1\. 安装 cilium-cli

```bash
CILIUM_CLI_VERSION=$(curl -s https://raw.githubusercontent.com/cilium/cilium-cli/main/stable.txt)
CLI_ARCH=amd64
if [ "$(uname -m)" = "aarch64" ]; then CLI_ARCH=arm64; fi
curl -L --fail --remote-name-all https://github.com/cilium/cilium-cli/releases/download/${CILIUM_CLI_VERSION}/cilium-linux-${CLI_ARCH}.tar.gz{,.sha256sum}
sha256sum --check cilium-linux-${CLI_ARCH}.tar.gz.sha256sum
sudo tar xzvfC cilium-linux-${CLI_ARCH}.tar.gz /usr/local/bin
rm -f cilium-linux-${CLI_ARCH}.tar.gz{,.sha256sum}
```

### 2\. 原生路由模式（推荐裸机）

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

### 3\. VXLAN 模式（云环境兜底方案）

```bash
cilium install \
  --set kubeProxyReplacement=true \
  --set tunnel=vxlan \
  --set ipam.mode=cluster-pool \
  --set ipam.operator.clusterPoolIPv4PodCIDRList=10.244.0.0/16 \
  --set ipam.operator.clusterPoolIPv4MaskSize=24 \
  --set bpf.masquerade=true
```

### 4\. 检查状态

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

## 七、部署 kube-vip（控制平面高可用）

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

重新生成 apiserver 证书

```bash
cd /etc/kubernetes/pki
mkdir -p backup-$(date +%F)
cp apiserver.* backup-$(date +%F)/
mv apiserver.crt apiserver.crt.bak
mv apiserver.key apiserver.key.bak
systemctl stop kubelet
echo "apiVersion: kubeadm.k8s.io/v1beta4
kind: ClusterConfiguration
clusterName: kubernetes
controlPlaneEndpoint: 10.0.0.10:6443
apiServer:
  certSANs:
    - 10.0.0.10
    - 10.0.0.11
    - 10.0.0.12
    - 10.0.0.13
    - 10.96.0.1
networking:
  serviceSubnet: 10.96.0.0/12
  podSubnet: 10.244.0.0/16
kubernetesVersion: v1.34.3" > /root/kubeadm-apiserver.yaml
​
kubeadm init phase certs apiserver \
  --config /root/kubeadm-apiserver.yaml

systemctl restart kubelet
​
kubectl config set-cluster kubernetes \
  --server=https://10.0.0.10:6443
​
kubectl cluster-info
```

## 八、其余节点加入集群

修改配置文件：

```bash
kubectl -n kube-system get cm kubeadm-config -o yaml > ~/kubeadm-config.yaml
​
vim ~/kubeadm-config.yaml
在ClusterConfiguration: |下面添加
controlPlaneEndpoint: 10.0.0.10:6443
​
kubectl apply -f ~/kubeadm-config.yaml
```

生成 token：

```bash
kubeadm token create --print-join-command --ttl 30m
kubeadm init phase upload-certs --upload-certs
```

发送 kube-vip 配置文件到其他 Master 节点

```bash
cd /etc/kubernetes/manifests
scp kube-vip.yaml 10.0.0.12:$PWD
scp kube-vip.yaml 10.0.0.13:$PWD
```

Master 节点：

```bash
kubeadm join 10.0.0.10:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash> --control-plane --certificate-key <key>
```

Node 节点：

```bash
kubeadm join 10.0.0.10:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>
```

## 九、验证部署

```bash
kubectl create deployment testdp --image=nginx:1.23.2
kubectl expose deployment testdp --port=80 --type=NodePort
kubectl get pods,svc
```

浏览器访问：

```bash
http://<任意节点IP>:NodePort
```
