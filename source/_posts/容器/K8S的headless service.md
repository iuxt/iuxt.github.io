---
title: K8S的headless service
categories:
  - 容器
tags:
  - Kubernetes
  - Service
abbrlink: sfo7gw
cover: 'https://static.zahui.fan/public/kubernetes.svg'
date: 2024-06-26 12:36:32
---

## 什么是 headless service

headless service 是配合 statefulset 控制器使用的，就是一个没有 ip 地址的普通 service

## yml 配置

```yml
apiVersion: v1
kind: Service
metadata:
  name: zk-hs
  labels:
    app: zookeeper
spec:
  ports:
    - name: tcp-client
      protocol: TCP
      port: 2181
      targetPort: 2181
    - name: tcp-follower
      port: 2888
      targetPort: 2888
    - name: tcp-election
      port: 3888
      targetPort: 3888
  selector:
    app: zookeeper
  clusterIP: None
  type: ClusterIP
```

在 statefulset 里指定 service 名字：

> 如果这里不设置 `serviceName` 的话，service 还是可以通的，但是 pod 就没有固定的域名了。

```yml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: zookeeper
  labels:
    app: zookeeper
spec:
  replicas: 3
  selector:
    matchLabels:
      app: zookeeper
  serviceName: zk-hs
  template:
    metadata:
      name: zookeeper
      labels:
        app: zookeeper
```

## 用处

比如说一个 statefulset 控制器运行的 zookeeper 集群，就可以在配置文件中配置：

```yml
          env:
            - name: ZOO_ENABLE_AUTH
              value: "no"
            - name: ALLOW_ANONYMOUS_LOGIN
              value: "yes"
            - name: ZOO_SERVERS
              value: >
                zookeeper-0.zk-hs.default.svc.cluster.local:2888:3888
                zookeeper-1.zk-hs.default.svc.cluster.local:2888:3888
                zookeeper-2.zk-hs.default.svc.cluster.local:2888:3888
```

其中，这 3 个 pod 的域名是不会变的。

## 一些测试

### ping 的效果

![image.png|745](https://static.zahui.fan/images/202406261238205.png)

10.1.0.119、10.1.0.137、10.1.0.124 对应的正好是 Pod IP

### 使用 dig 来解析

![image.png|738](https://static.zahui.fan/images/202406261308981.png)

### 反向解析 pod ip

`headless service` 的 `pod ip` 可以反向解析，并且解析到的域名是个固定值（不会随着 pod 销毁重建而变化）

![image.png|740](https://static.zahui.fan/images/202406261309782.png)

看看另一个服务，创建了两个 Service，一个普通的 service，一个 headless service，那么这个 pod 的域名是什么：

![image.png|737](https://static.zahui.fan/images/202406261313057.png)

