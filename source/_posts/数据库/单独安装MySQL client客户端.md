---
title: 单独安装MySQL client客户端
categories:
  - 数据库
tags: 
abbrlink: sn8a2y
date: 2022-11-20 10:40:09
cover: ""
---

## 方法一、直接下载二进制文件

{% tabs TabName %}

<!-- tab CentOS -->

```bash
yum install -y ncurses-libs # 这个包centos默认自带了
curl -OL https://file.babudiu.com/f/w0ty/mysql && chmod +x mysql
```

<!-- endtab -->

<!-- tab Debian/Ubuntu -->

```bash
apt install -y libncurses5
curl -OL https://file.babudiu.com/f/w0ty/mysql && chmod +x mysql
```

<!-- endtab -->

{% endtabs %}

## 方法二、使用源安装

{% tabs TabName %}

<!-- tab CentOS -->

```bash
yum install -y ncurses-libs mariadb-client
```

<!-- endtab -->

<!-- tab Debian/Ubuntu -->

```bash
sed -i 's@//.*debian.org@//mirrors.ustc.edu.cn@g' /etc/apt/sources.list
sed -i 's@//.*ubuntu.com@//mirrors.ustc.edu.cn@g' /etc/apt/sources.list

apt update && apt install -y libncurses5 mariadb-client
```

<!-- endtab -->

{% endtabs %}