---
title: k8s解除NodePort端口限制
categories:
  - 容器
tags: [k8s, Kubernetes]
abbrlink: lmri345s
cover: https://s3.babudiu.com/iuxt/public/kubernetes.svg
date: 2023-09-20 16:47:02
updated: 2025-11-01 10:06:02
---

我自己写了一个 svc 的 yaml 文件，部署的时候报错，不在默认的范围内，默认范围是: `30000-32767`

`kubectl apply -f nginx-src.yaml`

报错:

```bash
The Service "nginx" is invalid: spec.ports[0].nodePort: Invalid value: 80: provided port is not in the valid range. The range of valid ports is 30000-32767
```

如果是 kubeadm 部署
修改配置文件 `vim /etc/kubernetes/manifests/kube-apiserver.yaml`

在启动参数里面添加如下一行

```yml
- --service-node-port-range=1-65535
```

重启 kube-apiserver

```bash
kubectl delete pod -n kube-system kube-apiserver-xxx
```
