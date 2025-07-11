---
title: Kubernetes回滚应用之kubectl rollout
abbrlink: 8d88b8c4
cover: 'https://s3.babudiu.com/iuxt/public/kubernetes.svg'
categories:
  - 容器
tags: [kubectl, Kubernetes, k8s]
date: 2022-05-20 23:52:58
updated: 2025-02-14 18:12:16
---

kubernetes 每次更新资源会记录资源的历史版本， 方便我们进行回滚操作。真的 k8s 解决了很多运维的痛点问题, 想起来以前没有用 k8s 的时候,用 jenkins 和 ansible 来做的发布和回滚...

## 查看历史版本

```bash
kubectl rollout history deployment nfs-client-provisioner

deployment.apps/nfs-client-provisioner
REVISION  CHANGE-CAUSE
1         <none>
2         <none>
4         <none>
5         <none>
```

> 这里列出的就是版本， 为什么没有 3， 因为从版本 4 回滚到了版本 3， 则版本 3 就变成了版本 5

## 查看指定版本详情

```bash
kubectl rollout history deployment nfs-client-provisioner --revision=4
```

## 回滚到指定版本

```bash
kubectl rollout undo deployment nfs-client-provisioner --to-revision=4
```

> 回滚到上一个版本可以不用增加 `--to-revision=4` 参数, 默认就是回滚上一个版本

## 记录版本变化

### 执行命令记录变化

在第一步查看历史版本, CHANGE-CAUSE 显示的是 none, 如果需要记录 kubectl 执行的命令,则执行命令的时候需要添加参数

```bash
kubectl set image deployment/nginx-deployment nginx=nginx:1.16.1 --record=true
```

这样就会把当前的命令记录到版本的 CHANGE-CAUSE 这一栏

### 设置历史版本数量

在 yml 文件里面可以设置历史版本的数量, 比如:

```yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  revisionHistoryLimit: 5
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx
        ports:
        - containerPort: 80
```

## 查看历史版本

如果只是更新了镜像，可以通过命令查看历史的镜像版本：

```bash
#!/bin/bash
# 检查参数是否正确
if [ $# -lt 1 ] || [ $# -gt 2 ]; then
    echo "用法: $0 <deployment名称> [命名空间]"
    exit 1
fi

DEPLOYMENT_NAME=$1
NAMESPACE=${2:-default}  # 如果未指定命名空间则使用 default

VER=$(kubectl rollout history deployment -n $NAMESPACE $DEPLOYMENT_NAME | awk 'NR > 2 {print $1}' | sort -nr)


for i in $VER;do
    kubectl rollout history deployment -n $NAMESPACE $DEPLOYMENT_NAME --revision=$i | grep Image:
done
```
