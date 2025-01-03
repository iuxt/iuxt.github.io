---
title: 群晖NAS部署zerotier内网穿透访问
categories:
  - 工具
tags: [nas, 网络]
abbrlink: spi492
date: 2025-01-03 15:17:25
cover: https://static.zahui.fan/images/20250103233736228.png
updated: 2025-01-03 23:40:32
---

## 前言

完成这个教程，你主要需要完成以下流程：

- 在 NAS 上启用 SSH
- 创建一个持久的 TUN
- 安装 Docker
- 设置 Docker

## 创建一个持久的 TUN

{% note info flat %}
如果有 `/dev/net/tun` 就不用再执行了
{% endnote %}

使用 SSH 连接到你的 NAS，切换为 root 身份

创建一个开机自启动脚本: `/usr/local/etc/rc.d/tun.sh`

```bash
# 创建开机自启动脚本
echo -e '#!/bin/sh -e \ninsmod /lib/modules/tun.ko' > /usr/local/etc/rc.d/tun.sh

# 添加可执行权限
chmod a+x /usr/local/etc/rc.d/tun.sh

# 手动执行一下
/usr/local/etc/rc.d/tun.sh

# 查看是否有tun设备
ls /dev/net/tun
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

{% note info flat %}

这三条 iptables 规则用于配置网络地址转换（NAT）和数据包转发；

含义如下：

规则 1： `sudo iptables -t nat -A POSTROUTING -o $PHY_IF -j MASQUERADE`

这条规则在 nat 表的 POSTROUTING 链中添加了一条规则。-o $PHY_IF 表示这条规则适用于所有通过 $PHY_IF 这个网络接口（通常是物理接口）出去的数据包。-j MASQUERADE 指定了 NAT 操作中的伪装（masquerading）。这意味着，当数据包从 $PHY_IF 发送出去时，其源 IP 地址会被替换为 $PHY_IF 的 IP 地址。这通常用于允许内部网络通过一个公共 IP 地址进行外部通信；

规则 2： `sudo iptables -A FORWARD -i $PHY_IF -o $ZT_IF -m state --state RELATED,ESTABLISHED -j ACCEPT`

这条规则在 filter 表的 FORWARD 链中添加了一条规则。-i $PHY_IF 表示适用于从 $PHY_IF 这个接口进入的数据包，-o $ZT_IF 表示这些数据包要转发到 $ZT_IF 这个接口。-m state --state RELATED,ESTABLISHED 指定了只有那些与已有连接相关或已经建立的连接的数据包才被接受（ACCEPT）。这个规则通常用于允许来自外部网络的返回流量进入内部网络，从而支持诸如 HTTP 会话等；

规则 3： `sudo iptables -A FORWARD -i $ZT_IF -o $PHY_IF -j ACCEPT`

这条规则在 filter 表的 FORWARD 链中添加了一条规则。-i $ZT_IF 表示适用于从 $ZT_IF 这个接口进入的数据包，-o $PHY_IF 表示这些数据包要转发到 $PHY_IF 这个接口。-j ACCEPT 表示这些数据包会被接受并转发。这条规则允许来自 $ZT_IF 的流量经过路由器转发到 $PHY_IF，从而实现网络之间的数据传输；

总结：

第一条规则用于设置源地址伪装，允许内部网络设备通过一个公共 IP 地址进行外部通信；
第二条规则允许返回流量和已经建立的连接的数据包从外部网络进入内部网络；
第三条规则允许来自内部网络的数据包被转发到外部网络；
{% endnote %}

网卡设备名参考 在机器上使用命令 `ip a` 查看：

![image.png](https://static.zahui.fan/images/20250103232323506.png)

## 引用与文献

> 本文基于官方原文进行翻译和补充 <https://docs.zerotier.com/synology/#set-up-container>
  iptables 规则转载自：<https://jasonkayzk.github.io/2024/08/21/Zerotier%E9%85%8D%E7%BD%AE%E5%86%85%E7%BD%91%E6%B5%81%E9%87%8F%E8%BD%AC%E5%8F%91/>
