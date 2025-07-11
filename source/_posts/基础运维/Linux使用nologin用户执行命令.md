---
title: Linux使用nologin用户执行命令
abbrlink: 2c88f7f6
categories:
  - 基础运维
tags:
  - Linux
  - Shell
cover: 'https://s3.babudiu.com/iuxt/public/bash.svg'
date: 2021-06-01 18:02:17
---

> 我们知道可以通过编辑 `/etc/passwd` 给某些用户设置 shell 为 `nologin` 或 `false` 可以阻止这些用户登录
> 但某些时候需要特定的用户来执行命令，可以使用 sudo 或 su 来临时切换用户执行

## 使用 su

`su -s` 是指定 shell，这里 `www` 用户默认 `shell` 是 `nologin` 这里指定使用 `/bin/bash`, `-c` 后面接需要运行的命令

```bash
su www -s /bin/bash -c "mkdir /tmp/111"
```

## 使用 sudo

使用 www 用户来执行 `mkdir /tmp/111`

```bash
sudo -u www mkdir /tmp/111
```
