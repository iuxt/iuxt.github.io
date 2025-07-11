---
title: Ubuntu安装配置vncserver
abbrlink: bd65d26a
categories:
  - 基础运维
tags:
  - vnc
  - RemoteControl
  - Ubuntu
cover: 'https://s3.babudiu.com/iuxt/public/Ubuntu.svg'
date: 2022-02-14 10:30:08
---

VNC（Virtual Network Computing）是一种远程桌面协议。

vnc 大致可以分为两种，一种直接查看 `TTY` 上正在显示的桌面（和插上显示器显示的一致），另一种是创建一个新的桌面（即 可以在一台 linux 上打开若干个桌面供若干用户使用）常用的 vnc 服务器有：`x11vnc` `tigervnc` `tightvnc`

我的系统是：`ubuntu22.04`, 如果你不是这个系统，可能需要做一些修改。参考官方文档：<https://help.ubuntu.com/community/VNC/Servers> 本文配置直接转发桌面显示。 直接转发桌面我这里使用的是 `x11vnc` , 创建 vnc 虚拟桌面请看: [香橙派配置VNC Server](/posts/sghylv/)

## 安装服务端

```bash
sudo apt install x11vnc
```

## 创建密码文件

```bash
x11vnc -storepasswd

# 或者使用 vncpasswd 命令来创建，支持非交互式创建
# echo 123456 | vncpasswd -f > ~/.vnc/passwd
```

密码文件创建在： `~/.vnc/passwd`

## 通过 systemd 启动

```bash
sudo tee /lib/systemd/system/x11vnc.service <<-EOF
[Unit]
Description=Start x11vnc at startup.
After=multi-user.target

[Service]
Type=simple
ExecStart=/usr/bin/x11vnc -auth guess -forever -loop -noxdamage -repeat -rfbauth /home/orangepi/.vnc/passwd -rfbport 5900 -shared

[Install]
WantedBy=multi-user.target

EOF


sudo systemctl daemon-reload
sudo systemctl enable --now x11vnc.service
```

## 其他

`x11vnc` 包含一个 `/usr/share/applications/x11vnc.desktop` 桌面文件，你可以在桌面上找到 x11 vnc 的图标，然后通过图形界面来配置。比如：

![image.png|654](https://s3.babudiu.com/iuxt/images/202407151440567.png)