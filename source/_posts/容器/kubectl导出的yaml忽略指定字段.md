---
title: kubectl导出的yaml忽略指定字段
categories:
  - 容器
abbrlink: sj8cec
cover: 'https://s3.babudiu.com/iuxt/public/kubernetes.svg'
date: 2024-09-03 17:15:48
tags: []
updated: 2025-07-23 18:45:37
---

kubectl 指定 -o yaml 输出的 yaml 文件包含一些默认字段，这些字段我们是不需要的，可以使用 yq 来进行去除这些字段，生成的 yaml 文件可以用于迁移/部署服务等。

## 安装 yq

```bash
curl -L https://s3.babudiu.com/src/linux/bin/yq_linux_amd64 -o /bin/yq
chmod +x /bin/yq
```

## 导出 deployment

```bash
kubectl get deployment nginx -o yaml | yq eval '
  del(
    .metadata.annotations,
    .metadata.creationTimestamp,
    .metadata.generation,
    .metadata.resourceVersion,
    .metadata.selfLink,
    .metadata.uid, 
    .spec.progressDeadlineSeconds,
    .spec.revisionHistoryLimit,
    .spec.template.metadata.creationTimestamp,
    .status
    )
'
```

## 导出 service

```bash
kubectl get svc nginx -o yaml | yq eval '
  del(
    .metadata.annotations,
    .metadata.creationTimestamp,
    .metadata.resourceVersion,
    .metadata.selfLink,
    .metadata.uid, 
    .spec.clusterIP,
    .spec.externalTrafficPolicy,
    .status
    )
'
```

## 导出 Configmap

```bash
kubectl get configmap nginx -o yaml | yq eval '
  del(
    .metadata.annotations,
    .metadata.creationTimestamp,
    .metadata.resourceVersion,
    .metadata.selfLink,
    .metadata.uid
    )
'
```

如果导出的 configmap 格式错乱，换行符变成 `\n` ，可以使用 yq 再次进行格式化

```bash
cat prometheus_config.yaml | yq -r '.data."prometheus.yml"'
```

## 导出 secret

```bash
kubectl get configmap nginx -o yaml | yq eval '
  del(
    .metadata.creationTimestamp,
    .metadata.resourceVersion,
    .metadata.selfLink,
    .metadata.uid
    )
'
```

## 导出 ingress

```bash
kubectl get ingress example.com -o yaml | yq eval '
  del(
    .metadata.annotations."kubectl.kubernetes.io/last-applied-configuration",
    .metadata.creationTimestamp,
    .metadata.finalizers,
    .metadata.generation,
    .metadata.resourceVersion,
    .metadata.selfLink,
    .metadata.uid,
    .status
    )
'
```
