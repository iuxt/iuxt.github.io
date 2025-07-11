---
title: 使用kubeasz搭建一套高可用的Kubernetes集群
abbrlink: 6f59afe4
cover: 'https://s3.babudiu.com/iuxt/public/kubeasz.svg'
categories:
  - 容器
tags:
  - Linux
  - Container
  - Kubernetes
  - 配置记录
date: 2022-05-08 09:25:36
---

kubeasz 是基于 ansible 和 shell 制作的工具，可以快速搭建一个高可用的 k8s 集群（二进制部署），不需要额外的负载均衡。项目地址：<https://github.com/easzlab/kubeasz>, kubeasz 每个版本对应了支持的 k8s 版本, 可以到项目主页查看, 这里使用 kubeasz 版本 3.6.3, 部署 `k8s 1.29.0`

> 另见 kubeadm 部署
> [在centos使用kubeadm部署k8s](/posts/b86d9e9f/)
> [在ubuntu使用kubeadm部署k8s](/posts/526ffc9a/)

## 安装准备

准备机器如下：

| 机器          | IP        |
| ------------- | --------- |
| kubeasz 操作机 | 10.0.0.7  |
| master1       | 10.0.0.31 |
| master2       | 10.0.0.32 |
| master3       | 10.0.0.33 |
| worker1       | 10.0.0.41 |

首先确保操作机可以通过 ssh 连接到其他所有机器，最好密钥打通（这是使用 ansible 的必要条件）

## 安装 kubeasz

### 下载 ezdown 部署工具

```bash
export release=3.6.3                     # 设置kubeasz版本
wget https://github.com/easzlab/kubeasz/releases/download/${release}/ezdown
chmod +x ./ezdown
```

### 下载 kubeasz 离线包等

下载的文件位于 `/etc/kubeasz/` 目录中。

```bash
# 下载默认版本
./ezdown -D

# 可以使用-k参数指定需要下载的k8s版本
# ./ezdown -D -k v1.29.0

# 下载Docker容器版ezctl
./ezdown -S
source ~/.bashrc

# 下载flannel组件
./ezdown -X flannel

# 下载离线deb/rpm包
# ./ezdown -P
```

## 部署集群

```bash
cd /etc/kubeasz/
dk ezctl new k8s-cluster
```

根据需求修改配置文件

ansible 主机清单（定义主机 IP）`/etc/kubeasz/clusters/k8s-cluster/hosts`
集群配置文件 `/etc/kubeasz/clusters/k8s-cluster/config.yml`

开始部署

```bash
dk ezctl setup k8s-cluster all
```

## 检查部署结果

查看 kubernetes 集群的组件状态（基本都是通过 systemd 管理的）

### 在 master 节点上查看

```bash
systemctl status etcd
systemctl status kube-apiserver
systemctl status kube-scheduler
systemctl status kube-controller-manager
```

### 在 master 和 node 节点上查看

```bash
systemctl status kubelet 
systemctl status kube-proxy 
systemctl status docker
```

## 清理集群

如果需要执行清理操作:

```bash
dk ezctl destroy k8s-cluster
```

## 节点管理

操作机建议保留， 后期进行扩容等会非常方便。

```bash
# 新增master节点
dk ezctl add-master k8s-cluster 10.0.0.34

# 新增etcd节点
dk ezctl add-etcd k8s-cluster 10.0.0.34

# 新增worker节点
dk ezctl add-node k8s-cluster 10.0.0.41

# 删除etcd节点
dk ezctl del-etcd k8s-cluster 10.0.0.34

# 删除master节点
dk ezctl del-master k8s-cluster 10.0.0.34

# 删除worker节点
dk ezctl del-node k8s-cluster 10.0.0.41
```

### master 允许调度

```bash
kubectl uncordon master-01
kubectl uncordon master-02
kubectl uncordon master-03
```