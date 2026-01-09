---
title: Kubernetes 1.34 + Cilium + kube-vip 高可用集群部署实战
date: 2026-01-09 17:49:43
updated: 2026-01-09 19:11:12
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
cat > /etc/hosts <<EOF
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
$ cat <<EOF > /etc/yum.repos.d/kubernetes.repo
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

---

## 五、初始化 Kubernetes（首个 Master）

```bash
kubeadm init \
  --kubernetes-version=v1.34.3 \
  --service-cidr=10.15.0.0/16 \
  --pod-network-cidr=10.18.0.0/16 \
  --skip-phases=addon/kube-proxy
```

配置 kubectl：

```bash
mkdir -p ~/.kube
cp /etc/kubernetes/admin.conf ~/.kube/config
chown $(id -u):$(id -g) ~/.kube/config
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
  --set ipam.operator.clusterPoolIPv4PodCIDRList=10.18.0.0/16 \
  --set ipam.operator.clusterPoolIPv4MaskSize=24 \
  --set ipv4NativeRoutingCIDR=10.18.0.0/16 \
  --set autoDirectNodeRoutes=true \
  --set bpf.masquerade=true
```

### 3\. VXLAN 模式（云环境兜底方案）

```bash
cilium install \
  --set kubeProxyReplacement=true \
  --set tunnel=vxlan \
  --set ipam.mode=cluster-pool \
  --set ipam.operator.clusterPoolIPv4PodCIDRList=10.18.0.0/16 \
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
​
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
```

---

## 七、部署 kube-vip（控制平面高可用）

```bash
export VIP=10.0.3.10
export INTERFACE=ens33
kubectl apply -f https://kube-vip.io/manifests/rbac.yaml
kube-vip manifest pod \
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
​
controlPlaneEndpoint: 10.0.3.10:6443
​
apiServer:
  certSANs:
    - 10.0.3.10
    - 10.0.0.11
    - 10.0.0.12
    - 10.0.0.13
    - 10.15.0.1
​
networking:
  serviceSubnet: 10.15.0.0/16
  podSubnet: 10.18.0.0/16
​
kubernetesVersion: v1.34.3" > /root/kubeadm-apiserver.yaml
​
kubeadm init phase certs apiserver \
  --config /root/kubeadm-apiserver.yaml
[certs] Generating "apiserver" certificate and key
[certs] apiserver serving cert is signed for DNS names [master1 kubernetes kubernetes.default kubernetes.default.svc kubernetes.default.svc.cluster.local] and IPs [10.15.0.1 10.0.0.11 10.0.3.10 10.0.0.12 10.0.0.13]
​
systemctl restart kubelet
​
kubectl config set-cluster kubernetes \
  --server=https://10.0.3.10:6443
​
kubectl cluster-info
Kubernetes control plane is running at https://10.0.3.10:6443
CoreDNS is running at https://10.0.3.10:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
# ip已经修改为vip则进行下一步
```

---

## 八、其余节点加入集群

修改配置文件：

```bash
kubectl -n kube-system get cm kubeadm-config -o yaml > ~/kubeadm-config.yaml
​
vim ~/kubeadm-config.yaml
在ClusterConfiguration: |下面添加
controlPlaneEndpoint: 10.0.3.10:6443
​
kubectl apply -f ~/kubeadm-config.yaml
```

生成 token：

```bash
kubeadm token create --print-join-command --ttl 30m
kubeadm join 10.0.3.10:6443 --token 8r5e5o.yk3i9ymqqq8cd3pk --discovery-token-ca-cert-hash sha256:41d97ee7e5375bf4895a207c9a484efae7a9ce26e7b160080eddd25876a79ee5
​
kubeadm init phase upload-certs --upload-certs
I0104 21:48:23.698346    5515 version.go:260] remote version is much newer: v1.35.0; falling back to: stable-1.34
[upload-certs] Storing the certificates in Secret "kubeadm-certs" in the "kube-system" Namespace
[upload-certs] Using certificate key:
4d03abde9c000492fd28baa4528afa9d61c3a14ec6539384eb6707e07f2d1307
```

发送 kube-vip 配置文件到其他 Master 节点

```bash
cd /etc/kubernetes/manifests
scp kube-vip.yaml 10.0.0.12:$PWD
scp kube-vip.yaml 10.0.0.13:$PWD
```

Master 节点：

```bash
kubeadm join 10.0.3.10:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash> --control-plane --certificate-key <key>
```

Node 节点：

```bash
kubeadm join 10.0.3.10:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>
```

修改配置文件:

master01 上：

```bash
vi /etc/kubernetes/manifests/etcd.yaml
​
将--initial-cluster=master01=https://10.0.1.201:2380 改为 --initial-cluster=master01=https://10.0.1.201:2380,master02=https://10.0.1.202:2380,master03=https://10.0.1.203:2380
```

master02 上：

```bash
$ vi /etc/kubernetes/manifests/etcd.yaml
​
将--initial-cluster=master01=https://10.0.1.201:2380,master02=https://10.0.1.202:2380改为 --initial-cluster=master01=https://10.0.1.201:2380,master02=https://10.0.1.202:2380,master03=https://10.0.1.203:2380
```

master03 不用修改

再次检查 cilium 状态：

```bash
[root@master1 ~]# cilium status
    /¯¯\
 /¯¯\__/¯¯\    Cilium:             OK
 \__/¯¯\__/    Operator:           OK
 /¯¯\__/¯¯\    Envoy DaemonSet:    OK
 \__/¯¯\__/    Hubble Relay:       disabled
    \__/       ClusterMesh:        disabled
​
DaemonSet              cilium                   Desired: 3, Ready: 3/3, Available: 3/3
DaemonSet              cilium-envoy             Desired: 3, Ready: 3/3, Available: 3/3
Deployment             cilium-operator          Desired: 1, Ready: 1/1, Available: 1/1
Containers:            cilium                   Running: 3
                       cilium-envoy             Running: 3
                       cilium-operator          Running: 1
                       clustermesh-apiserver    
                       hubble-relay             
Cluster Pods:          2/2 managed by Cilium
Helm chart version:    1.18.3
```

---

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

---

## 十、总结

- kube-vip 提供稳定控制平面 VIP
- Cilium 替代 kube-proxy，eBPF 数据面更高效
- 原生路由模式适合裸机 / 内网
- VXLAN 适合复杂网络或云环境

> 至此，一个 **Kubernetes 1.34 + Cilium + kube-vip 的生产级高可用集群** 搭建完成。

**声明：** 本站所有文章，如无特殊说明或标注，均为本站原创发布。任何个人或组织，在未征得本站同意时，禁止复制、盗用、采集、发布本站内容到任何网站、书籍等各类媒体平台。如若本站内容侵犯了原著者的合法权益，可联系我们进行处理。

× ![](https://file.zhoumx.net/wp-content/2025/04/cropped-logo.png)

![](https://file.zhoumx.net/wp-content/2025/04/cropped-logo.png) ×

搜索一下可能来得更快

 ×

×

￥undefined

请打开手机使用 微信 扫码支付

「」

×

## ....支付确认中....

「」

×

支付金额

*￥*

undefined

×

积分支付

您当前的积分为 0

检测到您未绑定微信账户，请先绑定微信

立刻绑定

[确定](https://zhoumx.net/)

×

## 举报

### 请选择举报类型\*

政治有害

不友善

垃圾广告

违法违规

色情低俗

涉嫌侵权

网络暴力

涉未成年

自杀自残

不实信息

引人不适

抄袭

扰乱社区秩序

请输入举报内容 \*

举报提交后，我们会以邮件的形式向您反馈处理结果。

![](https://file.zhoumx.net/wp-content/2025/04/cropped-logo.png) ×

打开微信扫一扫

扫码并「关注我们的公众号」安全快捷登录

×

为了确保您的账户安全
请您设置一个 **登录用户名** 和密码

×

下载海报：

[

解锁会员权限

](<https://zhoumx.net/vips>)

开通会员

解锁海量优质 VIP 资源

个人中心

购物车

优惠劵

今日签到

私信列表

搜索

文章目录

[← Index](https://zhoumx.net/#)

[![本站支持IPv6访问](https://static.ipw.cn/icon/ipv6-s1.svg)](https://ipw.cn/ipv6webcheck/?site=zhoumx.net "本站支持IPv6访问")
