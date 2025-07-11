---
title: CentOS 7 停止维护后如何使用
categories:
  - 基础运维
tags: [配置记录]
abbrlink: si78gg
cover: 'https://s3.babudiu.com/iuxt/public/CentOS.svg'
date: 2024-08-14 16:19:28
updated: 2025-01-03 16:11:23
---

CentOS 7 停止维护后，很多源都失效了，使用 yum 的时候报错 404，需要修改源才能继续使用。

老版本 CentOS 源被更改成 vault 源，需要更换成 vault 源才能继续使用 yum。

## 一、修改成官方源

```bash
sudo sed -i.bak \
  -e 's|^mirrorlist=|#mirrorlist=|g' \
  -e 's|^#baseurl=http://mirror.centos.org/centos|baseurl=https://vault.centos.org/centos|g' \
  /etc/yum.repos.d/CentOS-Base.repo
```

## 二、换成阿里云源

```bash
curl -o /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
```

## 三、更换成中科大的源

```bash
cat > /etc/yum.repos.d/CentOS-Base.repo <<-'EOF'
[base]
name=CentOS-$releasever - Base
#mirrorlist=http://mirrorlist.centos.org/?release=$releasever&arch=$basearch&repo=os&infra=$infra
baseurl=https://mirrors.ustc.edu.cn/centos-vault/centos/$releasever/os/$basearch/
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-7

#released updates
[updates]
name=CentOS-$releasever - Updates
#mirrorlist=http://mirrorlist.centos.org/?release=$releasever&arch=$basearch&repo=updates&infra=$infra
baseurl=https://mirrors.ustc.edu.cn/centos-vault/centos/$releasever/updates/$basearch/
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-7

#additional packages that may be useful
[extras]
name=CentOS-$releasever - Extras
#mirrorlist=http://mirrorlist.centos.org/?release=$releasever&arch=$basearch&repo=extras&infra=$infra
baseurl=https://mirrors.ustc.edu.cn/centos-vault/centos/$releasever/extras/$basearch/
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-7

#additional packages that extend functionality of existing packages
[centosplus]
name=CentOS-$releasever - Plus
#mirrorlist=http://mirrorlist.centos.org/?release=$releasever&arch=$basearch&repo=centosplus&infra=$infra
baseurl=https://mirrors.ustc.edu.cn/centos-vault/centos/$releasever/centosplus/$basearch/
gpgcheck=1
enabled=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-7
EOF
```

## EPEL 源

```bash
curl -o /etc/yum.repos.d/epel.repo https://mirrors.aliyun.com/repo/epel-7.repo
```

## 使用 ISO 做为离线仓库

iso 选择 everything 版本镜像

2.创建 ISO 存放目录以及挂载目录

```bash
mkdir /mnt/cdrom
```

4.挂载 ISO 镜像到挂载目录

```bash
mount -o loop /mnt/iso/*.iso /mnt/cdrom 
```

1. 检查挂载是否成功
`df -h`
2.备份 `/etc/yum.repos.d` 目录里的原始 repo 文件

```bash
cd /etc/yum.repos.d
mkdir bak
mv *.repo bak/
```

 4.写入信息至 local.repo

```bash
cat > /etc/yum.repos.d/local.repo <-'EOF'
[local]
name=local
#挂载地址：/mnt/cdrom
baseurl=file:///mnt/cdrom    
enabled=1                    
gpgcheck=0
#cd /mnt/cdrom/可以看到KEY
gpgkey=file:///mnt/cdrom/RPM-GPG-KEY-CentOS-7
EOF
```

 yum 安装

```bash
yum clean all
yum install ntp
```

取消挂载

```bash
umount /mnt/cdrom
```
