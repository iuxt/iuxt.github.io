---
title: trzsz 使用记录
categories:
  - 工具
tags:
  - ''
abbrlink: shqeci
cover: ''
date: 2024-08-05 14:07:29
---

官方介绍：trzsz ( trz / tsz ) 是一款优秀的文件传输工具，和 lrzsz ( rz / sz ) 类似的、兼容 tmux 的文件传输工具。其实就是一个利用终端来传输文件的工具，可以用来取代 lrzsz，更多详情看官方文档：<https://trzsz.github.io/cn/> 和 GitHub：<https://github.com/trzsz/trzsz-ssh/blob/main/README.cn.md>

## macOS 下使用配置

trzsz-ssh 是内置支持 trzsz 的 ssh 客户端， 可以替代 openssh，并且不依赖终端的支持。

### 安装

```bash
brew install trzsz-ssh
```

### 简单用法

使用 `tssh` 替代 `ssh` 命令

## 支持 zmodem（可用于取代 lrzsz）

### 配置

新版 trzsz 内置支持 lrzsz 的功能，使用方法：

```bash
tssh --zmodem root@x.x.x.x -p 22
```

或者在 `~/.ssh/config` 里面配置

```conf
Host *
  # 如果配置在 ~/.ssh/config 中，可以加上 `#!!` 前缀，以兼容标准 ssh
  EnableZmodem Yes
```

### 使用

然后在终端里就可以执行 rz 和 sz 命令了 (**不需要**修改终端的配置，比如 iTerm2 配置 triggers)，并且支持上传速度和上传大小显示。

![image.png](https://static.zahui.fan/images/202408051427004.png)

## 配置 openssh config

除了使用 `tssh` 命令的方法外，还可以将服务器信息配置到 `~/.ssh/config`（类似于 openssh），为了兼容 `openssh`，可以将 `tssh` 独有的配置前加上 `#!!`

```conf
# 使用 ssh-key 免密连接
Host orange-pi
  Hostname 1.1.1.1
  HostKeyAlgorithms +ssh-rsa
  PubkeyAcceptedKeyTypes +ssh-rsa
  User orangepi
  Port 22
  IdentityFile ~/.ssh/id_rsa
  IdentitiesOnly yes

# 使用密码连接
Host ubuntu
  Hostname 1.1.1.1
  User root
  Port 22
  #!! encPassword fe7219e2eb0c10aa6a0ea3c35307334e9810fd0cb042a05804dcd34b52125e088d3af3
```

> 上面的 `encPassword` 可以通过 `tssh --enc-secret` 来生成，也可以使用 `Password 明文密码`

### 使用方法

直接执行 tssh 就会有一个终端组成的图形界面
![image.png](https://static.zahui.fan/images/202408051438414.png)

上面也可以使用 `tssh test-ubuntu` 来快速连接

## tssh 的其他参数

### 自动在服务器上安装 lrzsz

```bash
tssh --install-trzsz root@x.x.x.x
```

### 交互式添加机器

```bash
tssh --new-host
```

### 指定用户名

ssh 用户名带 `@` 符号的时候，使用 tssh 会解析错误（ssh 无问题）此时可以指定用户名的方式来使用。

```bash
tssh --zmodem -l 'a@qq.com' 1.1.1.1 -p 2222
```
