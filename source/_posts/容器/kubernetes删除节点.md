---
title: kubernetes删除节点
categories:
  - 容器
tags:
  - k8s
abbrlink: b1a2141c
cover: 'https://s3.babudiu.com/iuxt/public/kubernetes.svg'
date: 2022-11-07 11:52:11
---

## 删除 worker 节点

设置节点不可调度，即不会有新的 pod 在该节点上创建

```bash
kubectl cordon 172.16.21.26
kubectl drain 172.16.21.26 --delete-local-data --ignore-daemonsets --force
```

> –delete-local-data: 即使 pod 使用了 emptyDir 也删除
> –ignore-daemonsets: 忽略 deamonset 控制器的 pod，如果不忽略，deamonset 控制器控制的 pod 被删除后可能马上又在此节点上启动起来,会成为死循环；
> –force: 不加 force 参数只会删除该 NODE 上由 ReplicationController, ReplicaSet, DaemonSet,StatefulSet or Job 创建的 Pod，加了后还会删除’裸奔的 pod’(没有绑定到任何 replication controller)

kubectl delete node 172.16.21.26

## 删除 master 节点

未完待续
