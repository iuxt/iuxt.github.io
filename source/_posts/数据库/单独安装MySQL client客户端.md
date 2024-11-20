---
title: 单独安装MySQL client客户端
categories:
  - 数据库
tags: 
abbrlink: sn8a2y
date: 2022-11-20 10:40:09
cover: ""
---

```bash
# centos
# yum install -y ncurses-libs 这个包centos默认自带了.
curl -OL https://file.babudiu.com/f/KEf4/mysql && chmod +x mysql
```

```bash

sed -i 's@//.*debian.org@//mirrors.ustc.edu.cn@g' /etc/apt/sources.list
sed -i 's@//.*ubuntu.com@//mirrors.ustc.edu.cn@g' /etc/apt/sources.list

apt update && apt install -y libncurses5 mariadb-client

```