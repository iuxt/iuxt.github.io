---
title: 使用tailscale打通内网
categories:
  - 工具
tags:
  - 网络
abbrlink: loz4xrye
cover: 'https://s3.babudiu.com/iuxt/images/202311151021732.png'
date: 2023-11-15 10:20:32
---

家里有一台群晖 nas, 通过 quickconnect 连接太慢了, 并且有些操作不能通过 quickconnect, 比如直接 smb 挂载目录

## 群晖 nas 安装

群晖国内应用商店已经下架了这个 APP, 你可以尝试着在应用中心搜索 tailscale, 如果可以搜索到, 就直接安装即可. 搜索不到的话, 可以使用离线安装的方式:
![image.png](https://s3.babudiu.com/iuxt/images/202311151015762.png)

到官网下载离线 SPK 包:
https://pkgs.tailscale.com/stable/#spks
根据你的系统架构来下载包, intel cpu 下载 x86_64 架构的包. 然后进入群晖软件中心, 点击手动安装, 上传 spk 包安装

第一次打开 tailscale 需要登录, 登录页面不支持 quickconnect 远程连接, 所以建议在家配置好 tailscale

## windows 安装

安装成功后， 右键任务栏图标，点击 login 登录 tailscale 账号

![image.png](https://s3.babudiu.com/iuxt/images/202311141320528.png)

登录成功后，可以在官网<https://login.tailscale.com/admin/machines> 查看到所有的设备和 IP 地址等信息。

## 访问方式

tailscale 可以使用 ip 地址来访问，或者使用 tailscale 的 dns 域名，比如
![image.png](https://s3.babudiu.com/iuxt/images/202311141324348.png)

建议给常用设备设置 `Disable key expiry` 防止登录过期.

我可以使用 mac-mini 来访问我的其中一台机而不用记住 IP 地址。

![image.png](https://s3.babudiu.com/iuxt/images/202311141324477.png)

## 查看是否打洞成功

```bash
tailscale ping zhanglikundemac-mini.tailff0c6.ts.net
pong from zhanglikundemac-mini (100.107.120.45) via DERP(tok) in 208ms
pong from zhanglikundemac-mini (100.107.120.45) via DERP(sfo) in 172ms
pong from zhanglikundemac-mini (100.107.120.45) via DERP(tok) in 1.71s
```

结果显示 DERP 就是走的中继，比较慢