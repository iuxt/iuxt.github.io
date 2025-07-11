---
title: 在ubuntu22.04或LinuxMint21上安装深信服Easyconnect
cover: 'https://s3.babudiu.com/iuxt/public/vpn.svg'
categories:
  - 工具
tags:
  - 深信服
  - ubuntu
  - linuxmint
abbrlink: 6f69bd6
date: 2023-06-28 19:01:53
---

正常在 ubuntu22.04 或者 linuxmint21 上安装 Easyconnect, 可以安装, 但是无法启动.

是因为 pango 这个库版本较高导致. 需要手动将低版本的动态链接库放到 easyconnect 程序目录下.

## 查看链接库

```bash
cd /usr/share/sangfor/EasyConnect
ldd EasyConnect | grep pango
```

![](https://s3.babudiu.com/iuxt/images/202306281905022.png)

## 下载对应的 deb 包

下载地址: <http://kr.archive.ubuntu.com/ubuntu/pool/main/p/pango1.0/>

amd64 架构需要下载如下几个文件

```bash
libpangocairo-1.0-0_1.40.14-1_amd64.deb
libpangoft2-1.0-0_1.40.14-1_amd64.deb
libpango-1.0-0_1.40.14-1_amd64.deb
```

## 解压 deb 包

这 3 个 deb 包不需要安装, 解压把相关文件放到 easyconnect 安装目录即可

```bash
ar -vx libpangocairo-1.0-0_1.40.14-1_amd64.deb && tar xf data.tar.xz
ar -vx libpangoft2-1.0-0_1.40.14-1_amd64.deb && tar xf data.tar.xz
ar -vx libpango-1.0-0_1.40.14-1_amd64.deb && tar xf data.tar.xz
```

将解压后的 `usr/lib/x86_64-linux-gnu` 里面的所有文件复制到 `/usr/share/sangfor/EasyConnect`

```bash
sudo cp usr/lib/x86_64-linux-gnu/* /usr/share/sangfor/EasyConnect/
```

## 检查

再次检查链接库, 发现已经指向安装目录了

![](https://s3.babudiu.com/iuxt/images/202306281923022.png)
