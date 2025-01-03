---
title: 最小化安装的Linux安装图形界面
categories:
  - 基础运维
tags: ['']
abbrlink: spi6z2
date: 2025-01-03 16:16:13
cover: ''
updated: 2025-01-03 16:17:09
---

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
