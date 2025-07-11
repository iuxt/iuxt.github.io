---
title: Kubernetes配置镜像仓库认证imagePullSecrets
categories:
  - 容器
tags:
  - 配置记录
abbrlink: sjmzr1
cover: 'https://s3.babudiu.com/iuxt/public/kubernetes.svg'
date: 2024-09-11 15:06:36
---

## 创建 secret

可以在 namespace 里用一个全局的 image pull secret，创建个 secret，如果有特殊字符的，可以用单引号 ' ' 引起来。

```bash
# docker-secret 是 secret 的名字
kubectl create secret docker-registry docker-secret --docker-server=harbor.i.com --docker-username='robot$ali' --docker-password=123456 -n default
```

## 全局配置

给默认的 `serviceaccount` 配置 `imagePullSecrets` ， 这样配置好了之后，就无须在每个 deployment 上配置了。

```bash
kubectl patch serviceaccount default -n default -p '{"imagePullSecrets": [{"name": "docker-secret"}]}'
```

## 在每个服务上单独配置

在每个 deployment 里面引用这个 secret

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app-container
        image: <私有仓库的镜像地址>
      imagePullSecrets:
      - name: docker-secret
```

## 无效排查

如果创建了不生效，可以排查 `secret` 内容是否正确：

```bash
kubectl -n default get secret docker-secret --output="jsonpath={.data.\.dockerconfigjson}" | base64 -d
```

然后看下 `username` 和 `password` 字段是否正确。