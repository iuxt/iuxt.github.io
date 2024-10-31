---
title: Debian常用配置
categories:
  - 基础运维
tags:
  - 配置记录
abbrlink: 8c4ff9d2
cover: 'https://static.zahui.fan/public/debian.svg'
date: 2023-04-17 18:08:56
---

这里以 Debian12 为例

## 修改国内源

```bash
sed -i 's@//.*debian.org@//mirrors.ustc.edu.cn@g' /etc/apt/sources.list
```

## 配置网络

vim /etc/network/interfaces

### 固定 ip 配置

```conf
auto enp0s3
iface enp0s3 inet static
    address 192.168.1.240/24
    network 192.168.1.0
    broadcast 192.168.1.255
    gateway 192.168.1.1
    dns-nameservers 8.8.8.8
# 其中 network\broadcast 可以省略不写
```

### DHCP 配置

```bash
iface enp0s3 inet dhcp
```

### 重启网络服务

```bash
sudo systemctl restart networking.service
```
