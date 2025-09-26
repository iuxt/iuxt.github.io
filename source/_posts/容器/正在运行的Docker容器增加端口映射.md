---
title: 正在运行的Docker容器增加端口映射
categories:
  - 容器
tags: [容器, Docker, iptables, 网络]
abbrlink: t37flu
date: 2025-09-27 00:39:30
cover: ""
updated: 2025-09-27 00:59:17
---

## 获取基本信息

### 获取容器的 IP 地址

```bash
docker inspect postgres
```

 在结果中找到 `NetworkSettings` -> `Networks` -> `<你的网络名称>` -> `IPAddress`

### 查看 docker 的虚拟网卡

docker 的一个 bridge 网卡就对应了 linux 机器上的一个网卡，要新增端口映射，需要知道你的容器连接的虚拟网卡是什么。

比如我想让 Postgres 的 5432 端口映射到外网，先查看 Postgres 的容器信息。

```bash
docker inspect postgres
```

在结果中找到 `NetworkSettings` -> `Networks` -> `<你的网络名称>` -> `Gateway` ，记录一下网关的 IP

```bash
ip addr
```

![image.png|511](https://s3.babudiu.com/iuxt/2025/09/32b6758667d0085e2bc258757097522b.png)

可以知道网卡的名称是 `br-342eceae259f`

## 增加转发

比如我的容器 IP：172.18.0.2
Docker 虚拟网卡：br-342eceae259f
要映射的端口：5432

```bash
iptables -A DOCKER-USER -o br-342eceae259f ! -i br-342eceae259f -d 172.18.0.2/32 -m tcp -p tcp --dport 5432 -j ACCEPT
iptables -t nat -A DOCKER ! -i br-342eceae259f -p tcp -m tcp --dport 5432 -j DNAT --to-destination 172.18.0.2:5432
```

不需要做 SNAT，因为 Docker 默认已经做了 SNAT 了。
![image.png|705](https://s3.babudiu.com/iuxt/2025/09/7c09d3c4ce37d93f4a75f3a645d45d2f.png)

## 我是怎么发现这个的？

docker-proxy 会维护 docker 需要的 iptables 规则，那么我们创建一个一样的规则是不是就能实现映射端口的功能了？执行 `iptables-save` 把规则打印出来 (iptables-save 并不会真的 save，想保存 iptables 规则还需要额外的操作)，照葫芦画瓢，新增一个端口，发现确实可以使用。
