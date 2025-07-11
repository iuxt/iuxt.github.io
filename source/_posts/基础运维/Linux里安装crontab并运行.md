---
title: Linux里安装crontab并运行
categories:
  - 基础运维
tags:
  - Crontab
  - Linux
  - 配置记录
abbrlink: lnmt2t0q
cover: 'https://s3.babudiu.com/iuxt/public/linux.svg'
date: 2023-10-12 14:35:35
---

常见的 linux 发行版都自带了 crontab 服务, 但是我们常用的容器镜像是没有的, 不要问我为什么要在容器里运行 crontab...
[Linux定时执行任务crontab](/posts/2de1df7e/)
[Linux的crontab无法执行的一些问题](/posts/63d10d9c/)

## CentOS/RedHat 系列

### 安装

```bash
yum install -y cronie
```

### 配置文件位置

后面的 root 是用户名

```bash
/var/spool/cron/root
```

### 启动命令

```bash
# 后台运行
crond

# 前台运行
crond -f 
```

## Ubuntu/Debian 系列

### 安装

```bash
sudo apt-get install -y cron
```

### 配置文件位置

后面的 root 是用户名

```bash
/var/spool/cron/crontabs/root
```

### 启动命令

```bash
# 后台运行
cron

# 前台运行
cron -f
```

## Alpine

### 安装

官方镜像自带了

### 配置文件位置

后面的 root 是用户名

```bash
/etc/crontabs/root
```

### 启动命令

```bash
# 前台运行
crond -f

# 后台运行
crond
```