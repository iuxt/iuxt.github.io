---
title: 群晖NAS部署zerotier内网穿透访问
categories:
  - 工具
tags: [nas, 网络]
abbrlink: spi492
date: 2025-01-03 15:17:25
cover: ""
updated: 2025-01-03 23:28:59
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
  -v /var/lib/zerotier-one:/var/lib/zerotier-one \
  registry.cn-hangzhou.aliyuncs.com/iuxt/zerotier-synology:1.14.0
```

> 注：官方镜像：`zerotier/zerotier-synology:latest`

## 使用与配置

查看状态

```bash
docker exec -it zerotier zerotier-cli status
```

添加网络

```bash
docker exec -it zerotier zerotier-cli join <你的网络ID>
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
sudo sysctl -w net.ipv4.ip_forward=1
sudo sysctl -p
```

重启后配置会丢失，要持久化可以写入到 `/etc/sysctl.conf`

### 3. 防火墙设置

```bash
export PHY_IF=ovs_eth0 # 物理网卡设备名
export ZT_IF=ztre4xmo4y # Zerotier虚拟网卡设备名

# 添加转发规则
sudo iptables -t nat -A POSTROUTING -o $PHY_IF -j MASQUERADE
sudo iptables -A FORWARD -i $PHY_IF -o $ZT_IF -m state --state RELATED,ESTABLISHED -j ACCEPT
sudo iptables -A FORWARD -i $ZT_IF -o $PHY_IF -j ACCEPT
```

防火墙规则没保存的话重启后会丢失。

网卡设备名参考 在机器上使用命令 `ip a` 查看：

![image.png](https://static.zahui.fan/images/20250103232323506.png)

## 引用与文献

> 本文基于官方原文进行翻译和补充 <https://docs.zerotier.com/synology/#set-up-container>
