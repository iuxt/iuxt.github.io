---
title: 获取Kubernetes的token
categories:
  - 容器
tags:
  - Kubernetes
  - 记录
  - 配置记录
abbrlink: lr0clio1
cover: 'https://static.zahui.fan/public/kubernetes.svg'
date: 2024-01-05 16:02:08
---

## 获取 admin 的 token

如果有这个 secret, 可以直接查看 token

```bash
kubectl -n kube-system get secret admin-token-nwphb -o jsonpath={.data.token} | base64 -d
```

## 新版 k8s 命令为

选择一个现有的 serviceaccount

```bash
kubectl get serviceaccount
```

使用这个 serviceaccount 创建一个 token(并设置有效期)

```bash
kubectl create token default --duration 10m
```

## 新建一个用户获取 token

如果考虑到权限没有合适的,或者没有相关的 secret,可以通过创建一个新的用户来获取 token

```bash
kubectl create serviceaccount admin-sa

kubectl create clusterrolebinding admin-sa-binding --clusterrole=cluster-admin --serviceaccount=default:admin-sa

kubectl create token admin-sa --duration 10m
```