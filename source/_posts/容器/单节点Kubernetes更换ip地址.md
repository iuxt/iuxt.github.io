---
title: 单节点Kubernetes更换ip地址
categories:
  - 容器
tags:
  - Kubernetes
  - 记录
  - k8s
  - kubeadm
abbrlink: scpj14
cover: 'https://static.zahui.fan/public/kubernetes.svg'
date: 2024-04-29 22:03:03
---

如果是个多节点的集群，更换一台 master 节点的 ip 有个更简单的办法，那就是先把这台机器下线，然后再扩容一台新的 master，安全无副作用，如果是单节点更换 ip 地址（如果旧 ip 不用回收，那么可以直接在网卡上再绑定一个 ip 地址，不用对 k8s 进行修改）

和 [kubeadm之单节点master升级高可用master](/posts/34d8fad0/) 有点类似

## 首先更换操作系统 ip 地址

略

## 准备

```bash
# 备份配置文件
cp -r /etc/kubernetes{,-bak}

# 查看证书绑定的ip或域名
for i in $(find /etc/kubernetes/pki -type f -name "*.crt");do echo ${i} && openssl x509 -in ${i} -text | grep 'DNS:';done

# 删除需要重新生成的证书
rm -rf /etc/kubernetes/pki/{apiserver*,front-proxy-client*}
rm -rf /etc/kubernetes/pki/etcd/{healthcheck*,peer*,server*}
```

## 重新签发证书

```bash
# 这里需要修改证书绑定的ip
kubeadm init phase certs all \
    --apiserver-advertise-address 192.168.163.10 \
    --apiserver-cert-extra-sans "192.168.163.10,192.168.163.11,192.168.163.12" \
    --cert-dir "/etc/kubernetes/pki"
```

## 更新配置文件里的 ip 地址

```bash
grep -R 10.0.0.10 /etc/kubernetes/*

vim ~/.kube/config
```

## 这个时候 kubectl 可用了，修改 configmap

```bash
kubectl edit cm -n kube-system kubeadm-config
kubectl edit cm -n kube-system kube-proxy
```

## 然后删除 pod 重建

```bash
kubectl -n kube-system delete pod kube-apiserver-k8s kube-controller-manager-k8s kube-proxy-nhqvg kube-scheduler-k8s etcd-k8s coredns-558bd4d5db-c4xbw
kubectl -n kube-flannel delete pod kube-flannel-ds-8s6cn
```