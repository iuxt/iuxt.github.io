---
title: 给 Ubuntu 加密 Home 目录
categories:
  - 基础运维
tags: ['']
abbrlink: sqln8l
date: 2025-01-24 23:33:56
cover: ''
updated: 2025-01-24 23:33:59
---

Ubuntu 在安装的时候是可以进行全盘加密的，但是全盘加密没法像 Windows 做的那样无感（开机需要输入密码才能进入进入系统，macOS 的 FileVault 也是如此，Windows 的 BitLocker 是可以利用 TPM 进行自动解密，使用体验完全和不加密一样，微软牛逼）在一些需要无人值守的情况下就不太好用，比如使用远程桌面连接机器，然后重启了远程机器，你会发现再也连不上了，因为需要先解密磁盘才能启动操作系统。

## 安装工具

加密 Home 文件夹，需要安装 `eCryptfs`：

```bash
sudo apt install ecryptfs-utils cryptsetup
```

## 开始加密

加密切换到 `root` 用户执行，或者你也可以创建一个管理员账号来执行。

```bash
ecryptfs-migrate-home -u <用户名>
```

过程中需要输入你加密的用户的用户名和密码。加密后会创建临时备份目录，如果可以正常进入桌面，可以把备份目录删除，备份目录在 `/home/` 下。

可以执行以下命令来记录你随机生成的密码：

```bash
ecryptfs-unwrap-passphrase
```

## 加密交换区

加密交换分区可能会妨碍休眠和挂起功能

```bash
ecryptfs-setup-swap
```
