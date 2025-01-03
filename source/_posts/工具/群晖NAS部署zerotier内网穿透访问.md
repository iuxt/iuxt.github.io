---
title: 群晖NAS部署zerotier内网穿透访问
categories:
  - 工具
tags:
  - nas
  - 网络
abbrlink: spi492
date: 2025-01-03 15:17:25
cover: ""
updated: 2025-01-03 15:17:57
---

## 前言

完成这个教程，你主要需要完成以下流程：

- 在 NAS 上启用 SSH
- 创建一个持久的 TUN
- 安装 Docker
- 设置 Docker

## 创建一个持久的 TUN

使用 SSH 连接到你的 NAS，比如使用 Putty 工具连接。

切换为 root 身份

如果有就不用再执行了

使用 vi 工具编写脚本到路径: `/usr/local/etc/rc.d/tun.sh` 这将使得 `/dev/net/tun` 在启动时调用

```bash
echo -e '#!/bin/sh -e \ninsmod /lib/modules/tun.ko' > /usr/local/etc/rc.d/tun.sh

chmod a+x /usr/local/etc/rc.d/tun.sh

/usr/local/etc/rc.d/tun.sh

ls /dev/net/tun
/dev/net/tun
```

## 安装 Docker 到你的 NAS 上

直接到套件中心去安装。

```bash
mkdir /var/lib/zerotier-one
```

创建一个容器，这里将它命名为 zerotier，这里会自动下载最新版的 zerotier

要在 ssh 里创建，不要在群晖控制台创建。创建完成后可以在控制台进行管理。

```bash
docker run -d           \
  --name zerotier       \
  --restart=always      \
  --device=/dev/net/tun \
  --net=host            \
  --cap-add=NET_ADMIN   \
  --cap-add=SYS_ADMIN   \
  -v /var/lib/zerotier-one:/var/lib/zerotier-one zerotier/zerotier-synology:latest
```

## 使用与配置

查看状态

```bash
docker exec -it zerotier zerotier-cli status
```

添加网络

```bash
docker exec -it zerotier zerotier-cli join e5cd7a9e1cae134f
```

在 zerotier 后台授权当前设备，然后查看状态：

```bash
docker exec -it zerotier zerotier-cli listnetworks
```

## 使局域网网段可以访问

### 1. 添加路由

假设家里的机器：zerotier 地址是：172.28.135.11，内网 IP 地址是 192.168.1.11

在 zerotier 网站的 networks 里面的 Managed Routes 下配置路由表,增加如下内容

![image.png](https://static.zahui.fan/images/20250103135337663.png)

加过路由后，可以访问这台 zerotier 节点的内网 ip（192.168.1.11） 了，但是不能访问内网的其他 ip，还需要做一下转发。

### 2. 开启内核转发

```bash
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
sysctl -p
```

### 3. 防火墙设置

```bash
iptables -I FORWARD -i ztyqbub6jp -j ACCEPT
iptables -I FORWARD -o ztyqbub6jp -j ACCEPT
iptables -t nat -I POSTROUTING -o ztyqbub6jp -j MASQUERADE
```

其中的 ztyqbub6jp 在不同的机器中不一样，你可以在路由器 ssh 环境中用 zerotier-cli listnetworks 或者 ifconfig 查询 zt 开头的网卡名
iptables-save 保存配置到文件,否则重启规则会丢失。

## 引用与文献

> 本文基于官方原文进行翻译和补充 <https://docs.zerotier.com/synology/#set-up-container>
