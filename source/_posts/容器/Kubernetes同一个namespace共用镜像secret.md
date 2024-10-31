---
title: Kubernetes同一个namespace共用镜像secret
categories:
  - 容器
tags:
  - k8s
  - Kubernetes
  - secret
abbrlink: sc2yhw
cover: 'https://static.zahui.fan/public/kubernetes.svg'
date: 2024-04-17 17:32:19
---

配置一个全局的镜像拉取密钥， 后续拉镜像就不用每个 deployment 单独配置了。

在每个 `namespace` 下都有一个默认的 `service account`, 假设命名空间是 `test`

使用 `kubectl get sa -n test` 查看
![image.png](https://static.zahui.fan/images/202404171737797.png)

查看 serviceaccount 信息

```bash
kubectl describe sa -n test
```

![image.png](https://static.zahui.fan/images/202404171738437.png)

Image pull secrets 是此 namespace 下拉取镜像的秘钥

1.创建 secret

```bash
kubectl create secret -p docker-registry registrykey --namespace=test --docker-username=<harbor_user> --docker-password=<harbor_password> --docker-server=<harbor_url>
```

2.配置进 service account

```bash
kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "registrykey"}]}' -n test
```

至此在 `test` 下拉取镜像无需配置镜像拉取秘钥了

