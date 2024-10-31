---
title: alpine常用配置
abbrlink: c43764dd
cover: 'https://static.zahui.fan/public/linux.svg'
categories:
  - 基础运维
tags:
  - Linux
  - 配置记录
  - Alpine
date: 2021-04-27 23:03:34
---

## 包管理 apk

### 安装包

```bash
apk add busybox-extras busybox vim python3 git

# 不缓存，打容器镜像常用
apk add --no-cache busybox
```

### 查看安装的包

```bash
# 列出所有已安装的包：
apk info

# 查看特定包的详细信息：
apk info <package_name>

# 查看所有已安装包的版本号：
apk info -v

# 按字母顺序列出已安装的包：
apk info -vv
```

### 更换源

```bash
sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories
```

### 卸载包

```bash
apk del git
```

## 终端

alpine 默认的是 ash shell

```bash
vim ~/.profile
```

## alpine 服务管理工具

```bash
# 查看所有服务
rc-service --list

# 添加开机自启动
rc-update add {service-name}
```

## 网络配置

```bash
# dns
/etc/resolv.conf


# 网卡配置文件 /etc/network/interface
iface eth0 inet static
    address 192.168.1.150
    netmask 255.255.255.0
    gateway 192.168.1.1


或者iface eth0 inet dhcp
```
