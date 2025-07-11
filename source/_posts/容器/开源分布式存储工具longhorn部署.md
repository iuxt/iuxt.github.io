---
title: 开源分布式存储工具longhorn部署
categories:
  - 容器
tags:
  - 存储
  - kubectl
  - Kubernetes
  - k8s
abbrlink: scx23m
cover: 'https://s3.babudiu.com/iuxt/public/longhorn.svg'
date: 2024-05-03 23:38:10
---

k8s 如果需要用到存储，对于云产品一般都是采用云厂商提供的存储驱动，自建机房简单一点的会采用 nfs，nfs 有以下问题：
- 高可用性问题，一般都是单台机器在跑，高可用完全依靠物理机器的 RAID，非常不云原生
- 性能问题，NFS 本身性能不算好，外加一个集群都在使用，网卡速度是个瓶颈
longhorn 是个开源的存储引擎，简单来说就是它把 k8s 每个节点的磁盘空间搜集起来，组成一个大池子，然后分配个各个 pod 使用。并通过多副本的方式做高可用。longhorn 好像是 openSUSE 家的吧，和 rancher 一个公司。

![](https://s3.babudiu.com/iuxt/images/202405231106850.svg)

## 官方文档

官方安装说明：
https://longhorn.io/docs/1.6.1/deploy/install/install-with-kubectl/

官方安装要求：
https://longhorn.io/docs/1.6.1/deploy/install/#installation-requirements

官方的检查依赖项脚本：

```bash
curl -fsSL https://raw.githubusercontent.com/longhorn/longhorn/v1.6.1/scripts/environment_check.sh | bash
```

## 安装依赖

```bash
# CentOS 7
yum install -y jq mktemp sort printf
yum install -y iscsi-initiator-utils
systemctl enable --now iscsid.service

yum install -y nfs-utils
yum install -y cryptsetup
```

## 使用 kubectl 安装 longhorn

```bash
kubectl apply -f https://raw.githubusercontent.com/longhorn/longhorn/v1.6.1/deploy/longhorn.yaml
```