---
title: 运维使用的Windows软件分享
categories:
  - 工具
tags: 
abbrlink: spc5z0
date: 2021-12-31 10:09:00
cover: ""
updated: 2025-02-10 19:06:23
---

## 终端工具

### xshell 全家桶

Xmanager Power Suite 8 支持 rdp 协议连接 windows，包含四大金刚组件（xshell xftp xmanager xlpd）附上 7 和 6 版本备用。不过 xshell 的缺点是使用 rz 和 sz 上传下载文件的时候容易乱码（文件传输失败并且终端上会刷很多乱码文本）

| 软件名                         | 包含组件                                                 | 下载地址                                                                                              |
| --------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| xshell plus 7               | 包含 xshell 和 xftp ，解压即用，不用执行 bat，不写注册表，不弹窗。           | [github](https://github.com/iuxt/src/releases/download/ops/XshellPlus_v7.0.0023r.7z)              |
| Xmanager Power Suite 6      | 包含 xshell xftp xmanager xlpd，需要执行 bat 脚本，不弹窗。        | [github](https://github.com/iuxt/src/releases/download/ops/Xmanager.Power.Suite.6.0.0029.zip)     |
| Xmanager Power Suite 8      | 包含 xshell xftp xmanager xlpd，不用执行 bat 脚本，不弹窗。        | [github](https://github.com/iuxt/src/releases/download/xmanager/Xmanager.Power.Suite.8.zip)       |

### mobaxterm

待完善

### securecrt

待完善

### tssh

tssh 是纯命令行软件，可以在 `Windows Terminal` 中运行，看起来更极客一点。tssh 可以兼容 lrzsz 使用 rz 和 sz 上传下载文件，并且自测没有发生过乱码。

tssh 可以直接使用 windows 版本的，也可以在 WSL 中运行 Linux 版本的。具体使用方法可以看：[trzsz 使用记录](/posts/shqeci)

## 连接数据库工具

### Navicat

| 软件名                         | 下载地址                                                 | 是否推荐                                                                                              |
| --------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Navicat Premium 17          | 中文 解压即用版，可以联网更新。                                     | [github](https://github.com/iuxt/src/releases/download/navicat17/Navicat.Premium.17.zip)          |
| Navicat Premium 17 Portable | 中文 便携版，配置文件存储在软件目录。注意：此版本会造成其他非便携版保存的链接丢失，不要和正常版本共用。 | [github](https://github.com/iuxt/src/releases/download/navicat17/Navicat.Premium.17.Portable.zip) |
| Navicat 16.3.7              | 中文 解压即用版，可以联网更新。                                     | [github](https://github.com/iuxt/src/releases/download/ops/Navicat.Premium.16.3.7.zip)            |
| Navicat 16.0.6              | 中文 解压即用版，不可更新。                                       | [github](https://github.com/iuxt/src/releases/download/ops/Navicat_16.0.6.7z)                     |
| Navicat 12                  | 中文 解压即用版，不可更新。                                       | [github](https://github.com/iuxt/src/releases/download/ops/Navicat.Premium.12.zip)                |

### sqlyog

有社区版和收费版，体积小巧，还不错。

### HeidiSQL

是个免费软件，官网在：<https://www.heidisql.com/>

### DBeaver

Java 写的客户端，又重又不好用。不过是开源软件，跨平台。

## Redis 管理工具

新版 Navicat 就支持管理 Redis 了。

## 剪切板工具

打杂的运维需要经常复制粘贴，所以一个好用的剪切板软件必不可少。

### Windows 自带

按下 `⊞ Win` + `v` 即可显示

![image.png](https://static.zahui.fan/images/20241231101650495.png)

### ditto

在微软商店即可下载，免费软件。

### clipboard fusion

这个软件挺好用的，不过有可能有一些小问题，比如有时候复制了上面不显示，它支持将常用的固定在一个单独的页面上，方便直接粘贴。并且支持触发器，比如删除换行符，删除空格等。基本功能免费，高级功能收费。

![image.png|357](https://static.zahui.fan/images/20241231101754204.png)

## 截图工具

### Snipaste

基本功能免费，专业功能收费。挺不错的软件。

### pixpin

也是基本功能免费，专业功能收费，支持录 GIF，长截图等。
