---
title: 最小化安装的Linux安装图形界面
categories:
  - 基础运维
tags: [Linux, 配置记录]
abbrlink: spi6z2
date: 2020-01-03 16:16:13
cover: ""
updated: 2025-01-24 23:17:05
---

针对于 CentOS 系列的发行版。

```bash
yum groups list 

yum groupinstall "Server with GUI"

systemctl get-default
systemctl set-default graphical.target

```

重启即可生效

如果不想重启，可以执行

```bash
nohup startx &
```
