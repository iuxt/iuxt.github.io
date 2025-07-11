---
title: Kubernetes中的静态Pod
categories:
  - 容器
tags:
  - Kubernetes
  - kubeadm
  - 部署
abbrlink: sfrqkr
cover: 'https://s3.babudiu.com/iuxt/public/Kubeadm.svg'
date: 2024-06-28 10:22:03
---

## 啥是静态 Pod

静态 pod 就是不通过 Kubernetes 控制器直接运行的 pod，比如下面是一个 nginx 的静态 pod

```yml
apiVersion: v1
kind: Pod
metadata:
  name: static-web
spec:
  containers:
    - name: web
      image: registry.cn-hangzhou.aliyuncs.com/iuxt/nginx:1.27.0
      ports:
        - name: web
          containerPort: 80
          protocol: TCP
```

这种 pod 如果通过 `kubectl delete pod static-web` 来删除， 那么就直接删除了，不会像控制器一样重建 pod。

## kubeadm 集群的组件

### 二进制运行的组件

二进制运行的组件就是不通过容器化，直接在机器上运行的组件，有 3 个组件 `kubeadm` `kubelet` `kubectl` ，其中：

- kubectl 这个是客户端程序，不是必须的，如果需要用到 kubectl 命令，安装一个就行
- kubeadm 这个程序每台机器都需要安装，使用它来管理 master，worker 节点也需要执行 kubeadm 才能加入集群
- kubelet 这个组件每台机器都需要安装， 它负责管理节点上的 Pod 生命周期，也是它负责将节点注册到集群中

`kubelet` 组件在节点上是通过 `systemd` 来管理的。

### 静态 Pod 组件

使用 `kubeadm` 部署的集群中，`etcd`、`kube-apiserver`、`kube-controller-manager`、`kube-scheduler` 这些组件都是通过静态 Pod 来运行的，如图：

![image.png|754](https://s3.babudiu.com/iuxt/images/202406281033638.png)

但是有个奇怪的问题， 把这些静态 Pod 删除后，它会自己重建一个新的，不像静态 pod 一样删除了就没了。

## 查看 kubelet 配置

由于所有的 Pod 都是 `kubelet` 负责启动的，我们看下 `kubelet` 的配置

![image.png|849](https://s3.babudiu.com/iuxt/images/202406281046264.png)

找到配置文件在 `/var/lib/kubelet/config.yaml` , 查看下这个文件的内容：

![image.png](https://s3.babudiu.com/iuxt/images/202406281047136.png)

`staticPodPath` 定义了静态 Pod yaml 文件的位置，可以看到果然都在这里：

![image.png](https://s3.babudiu.com/iuxt/images/202406281049578.png)

## 测试

将上面的 Nginx 静态 Pod 的 yaml 文件复制到这个目录，可以看到 Pod 自动创建出来了

![image.png](https://s3.babudiu.com/iuxt/images/202406281052803.png)

`kubelet` 自动创建的静态 Pod 会在 Pod 名字后面加上 `-<计算机名>`

将 `/etc/kubernetes/manifests` 中的 yaml 文件删除，pod 也会自动销毁。
