---
title: 正在运行的Docker容器增加端口映射
categories:
  - 容器
tags: [容器, Docker, iptables, 网络]
abbrlink: t37flu
date: 2025-09-27 00:39:30
cover: ""
updated: 2025-09-27 01:43:16
---

## 为什么有这个需求

比如说一个服务运行在 Docker 中，通过 Docker 网络和其他容器连接，比如一个容器会通过 docker 网络访问数据库容器，这个数据库也没有做端口映射。现在我想用 Navicat 连接到这个数据库。

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

## 一个更简单的方法

这个方法性能不如上面的 `iptables` 规则，比如可以用 `nginx` 的 `stream` 四层代理，或者用 `socat` 一条命令搞定。

```bash
# 安装 socat
sudo apt-get install socat  # Ubuntu/Debian

# 创建端口转发
socat TCP-LISTEN:5432,fork TCP:172.18.0.2:5432

```

## 另一种传统的方式

```bash
#!/bin/bash

IP=10.0.0.21
PORT=8000
CONTAINER_IP=172.17.0.2
CONTAINER_PORT=80

# 这个是DNAT，到本机的流量，重写目的地址为容器
iptables -t nat -A PREROUTING -4 -p tcp -d ${IP} --dport ${PORT} -j DNAT --to-destination ${CONTAINER_IP}:${CONTAINER_PORT}

# 这个是为了本机也可以通过访问自己的IP和端口来访问
iptables -t nat -A OUTPUT -4 -p tcp -d ${IP} --dport ${PORT} -j DNAT --to-destination ${CONTAINER_IP}:${CONTAINER_PORT}

# 注意这两条，需要将规则插到最上面，或者加入到DOCKER-USER链，配合下面的图理解
iptables -I FORWARD -p tcp -d ${CONTAINER_IP} --dport ${CONTAINER_PORT} -j ACCEPT
iptables -I FORWARD -p tcp -s ${CONTAINER_IP} --sport ${CONTAINER_PORT} -j ACCEPT

# 这个是SNAT规则，数据包回包
iptables -t nat -A POSTROUTING -4 -p tcp -d ${CONTAINER_IP} --dport ${CONTAINER_PORT} -j SNAT --to-source ${IP}

```

如果规则不加，或加在了 DOCKER-USER 的下面，会兜兜转转，最后匹配到了 DROP

![image.png](https://s3.babudiu.com/iuxt/2025/09/415b32397c6d32a942372431287b7280.png)

知道了原理后，那么还有一种方法：删除这个 DROP（不要这么做）

```bash
# iptables -D DOCKER ! -i docker0 -o docker0 -j DROP
```
