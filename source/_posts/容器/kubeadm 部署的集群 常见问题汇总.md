---
title: kubeadm 部署的集群 常见问题汇总
categories:
  - 容器
tags: [配置记录, 常用操作, Kubernetes, 部署, 搭建, kubeadm]
abbrlink: sepu3k
cover: 'https://s3.babudiu.com/iuxt/public/Kubeadm.svg'
date: 2024-06-07 23:09:19
updated: 2025-11-01 10:12:53
---

## 扩容节点

### 扩容 Worker 节点

> kubeadm init 后会输出在终端上, 有效期 2 小时, 超时后可以重新生成

生成添加命令:

```bash
kubeadm token create --print-join-command
```

### 扩容 Master 节点

#### 生成加入命令

```bash
# 生成证书, 记录 certificate key
kubeadm init phase upload-certs --upload-certs

# 获取加入命令
kubeadm token create --print-join-command

# 将上面的输出结果拼接，这个就是加入 master 的命令，在新的 master 上执行
echo "$(kubeadm token create --print-join-command) --control-plane --certificate-key $(kubeadm init phase upload-certs --upload-certs | tail -1)"
```

#### 修改负载均衡配置

扩容完 master 节点不要忘了将新的节点增加到 Apiserver 的负载均衡上。

#### 证书位置

```bash
# 这里能看到在用哪个 secret
kubectl get secret -n kube-system kubeadm-certs -o yaml

# 查看对应的 secret
kubectl get secret -n kube-system bootstrap-token-277b0n -o yaml
```

## 移除节点

### 移除 worker 节点

```bash
kubectl drain worker2 --ignore-daemonsets
kubectl delete node worker2
```

### 移除 etcd member

如果要移除 master 节点，并且 master 节点上部署了 etcd ，那除了上一步操作，还需要从 etcd 集群中移除这个节点。

```bash
kubectl exec -it -n kube-system etcd-master1 -- /bin/sh

# 查看etcd member list
etcdctl --endpoints 127.0.0.1:2379 --cacert /etc/kubernetes/pki/etcd/ca.crt --cert /etc/kubernetes/pki/etcd/server.crt --key /etc/kubernetes/pki/etcd/server.key member list

# 通过ID来删除etcd member
etcdctl --endpoints 127.0.0.1:2379 --cacert /etc/kubernetes/pki/etcd/ca.crt --cert /etc/kubernetes/pki/etcd/server.crt --key /etc/kubernetes/pki/etcd/server.key member remove 12637f5ec2bd02b8
```

## 升级集群

kubeadm 搭建的集群升级比较方便，总体步骤如下：
1. 升级第一个 master 节点
2. 升级其余的 master 节点
3. 升级 worker 节点
如果集群运行着服务，升级节点前需要先腾空节点 `kubectl drain --ignore-daemonsets <节点名称>` 升级完成后，再恢复调度 `kubectl uncordon <节点名称>
`
官方文档：<https://kubernetes.io/zh-cn/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/>

### 升级第一个 master 节点

上面安装的 `kubelet` `kubeadm` `kubectl` 这 3 个是机器上使用 yum 安装的，所以需要通过 yum 来升级。先升级 `kubeadm` 组件， 新版本每个大版本一个 yum 仓库，需要先修改仓库配置文件，参考：<https://kubernetes.io/zh-cn/docs/tasks/administer-cluster/kubeadm/change-package-repository/>

```bash
# 查看可用的版本
sudo yum list --showduplicates kubeadm --disableexcludes=kubernetes

# 升级kubeadm到指定的版本
sudo yum update kubeadm-1.29.6 --disableexcludes=kubernetes

# 验证kubeadm版本
kubeadm version

# 升级检查，主要检查兼容性以及建议升级到的版本
kubeadm upgrade plan

# 开始升级，升级 `kube-apiserver` `kube-controller-manager` `kube-scheduler` 这些组件在节点上是以静态 Pod 的形式存在的。
kubeadm upgrade apply v1.29.6

# 把其他组件也一块升级了
sudo yum update kubelet-1.29.6 kubectl-1.29.6 cri-tools kubernetes-cni --disableexcludes=kubernetes

# 重启kubelet
sudo systemctl daemon-reload
sudo systemctl restart kubelet
```

### 升级其他 master 节点

```bash
# 升级kubeadm到指定的版本
sudo yum update kubeadm-1.29.6 --disableexcludes=kubernetes

# 验证kubeadm版本
kubeadm version

# 升级节点
kubeadm upgrade node

# 升级其他软件包
sudo yum update kubelet-1.29.6 kubectl-1.29.6 cri-tools kubernetes-cni --disableexcludes=kubernetes

sudo systemctl daemon-reload
sudo systemctl restart kubelet
```

### 升级 worker 节点

```bash
# 升级软件包
sudo yum update kubeadm-1.29.6 kubelet-1.29.6 kubectl-1.29.6 cri-tools kubernetes-cni --disableexcludes=kubernetes

sudo systemctl daemon-reload
sudo systemctl restart kubelet
```

## 测试集群是否正常

创建一个 nginx 的 pod 资源

```bash
kubectl create deployment nginx --image=nginx
kubectl expose deployment nginx --port=80 --type=NodePort
kubectl get deploy,svc,pod
```

访问 nodeport，检查能否访问到 nginx 服务

## 查看 ETCD 状态

```bash
kubectl exec -n kube-system etcd-master1 -- etcdctl --endpoints="10.0.0.13:2379,10.0.0.12:2379,10.0.0.11:2379" --cacert /etc/kubernetes/pki/etcd/ca.crt --cert /etc/kubernetes/pki/etcd/server.crt --key /etc/kubernetes/pki/etcd/server.key endpoint status --write-out=table
```

## pause 镜像版本问题

使用 `kubeadm image pull` 事先把镜像拉取下来，但是后面 `kubeadm init` 还是报错：

```bash
> journalctl -xeu kubelet -f

Jul 22 08:35:49 master1 kubelet[2079]: E0722 08:35:49.169395    2079 pod_workers.go:190] "Error syncing pod, skipping" err="failed to \"CreatePodSandbox\" for \"etcd-master1_kube-system(642dcd53ce8660a2287cd7eaabcd5fdc)\" with CreatePodSandboxError: \"Failed to create sandbox for pod \\\"etcd-master1_kube-system(642dcd53ce8660a2287cd7eaabcd5fdc)\\\": rpc error: code = Unknown desc = failed to get sandbox image \\\"k8s.gcr.io/pause:3.6\\\": failed to pull image \\\"k8s.gcr.io/pause:3.6\\\": failed to pull and unpack image \\\"k8s.gcr.io/pause:3.6\\\": failed to resolve reference \\\"k8s.gcr.io/pause:3.6\\\": failed to do request: Head \\\"https://k8s.gcr.io/v2/pause/manifests/3.6\\\": dial tcp 142.250.157.82:443: connect: connection refused\"" pod="kube-system/etcd-master1" podUID=642dcd53ce8660a2287cd7eaabcd5fdc
```

这里我们已经提前拉取了镜像在本地了， 但是 init 的时候还是会从 `k8s.gcr.io` 拉取镜像，造成 init 失败，如果你的网络可以访问 `k8s.gcr.io` 的情况下则可以完成初始化, 你会发现这里拉取失败的镜像 tag 和 `kubeadm config images pull` 拉下来的版本不一致。

问题原因：containerd 的配置文件里面指定了 pause 的镜像，这里会拉取这个版本的镜像，和 `kubeadm` 不一致。所以两个镜像都需要，或者修改下 containerd 的配置。

![image.png|522](https://s3.babudiu.com/iuxt/images/202405052245258.png)

## 修改 NodePort 端口范围

在 master 节点上修改:

vim /etc/kubernetes/manifests/kube-apiserver.yaml

```yml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    kubeadm.kubernetes.io/kube-apiserver.advertise-address.endpoint: 10.0.0.22:6443
  creationTimestamp: null
  labels:
    component: kube-apiserver
    tier: control-plane
  name: kube-apiserver
  namespace: kube-system
spec:
  containers:
  - command:
    - kube-apiserver
    - --advertise-address=10.0.0.22
    - --allow-privileged=true
    ...
    # 增加了这一行
    - --service-node-port-range=1-65535
    image: registry.k8s.io/kube-apiserver:v1.27.3
    imagePullPolicy: IfNotPresent
    livenessProbe:
      failureThreshold: 8
      httpGet:
        host: 10.0.0.22
        path: /livez
```

修改完成后保存, apiserver 会自动重启.

## master 节点允许调度

```bash
# 老版本Kubernetes执行这个，我测试1.21是这污点
# kubectl taint node --all node-role.kubernetes.io/master:NoSchedule-

# 1.28版本 去掉master上的这个污点即可
kubectl taint nodes --all node-role.kubernetes.io/control-plane-
```

## 手动证书更新

[使用kubeadm部署的集群证书过期后处理](/posts/ltckjzor/)

## 修改 kube-proxy 代理模式

相比 iptables，使用 ipvs 可以提供更好的性能

```bash
kubectl -n kube-system edit configmap kube-proxy
```

mode 参数修改成 ipvs

![image.png](https://s3.babudiu.com/iuxt/images/202312112232082.png)

```bash
kubectl -n kube-system rollout restart daemonset kube-proxy
```

查看 kube-proxy 日志，出现 Using ipvs Proxier 说明修改成功。
![image.png](https://s3.babudiu.com/iuxt/images/202312112236807.png)

## 自动补全功能

{% tabs TabName %}
<!-- tab CentOS -->

```bash
yum -y install bash-completion
```

<!-- endtab -->

<!-- tab Ubuntu -->

```bash
apt install -y bash-completion
```

<!-- endtab -->
{% endtabs %}

```bash

cat >> ~/.bashrc <<'EOF'
source /usr/share/bash-completion/bash_completion
source <(kubectl completion bash)
EOF
```
