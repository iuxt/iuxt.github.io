---
title: 香橙派配置VNC Server
categories:
  - 工具
tags:
  - 香橙派
  - 开发版
abbrlink: sghylv
cover: 'https://static.zahui.fan/images/202407121920445.png'
date: 2024-07-12 14:13:06
---

vnc 大致可以分为两种，一种直接查看 `TTY` 上正在显示的桌面（和插上显示器显示的一致），另一种是创建一个新的桌面（即 可以在一台 linux 上打开若干个桌面供若干用户使用）

这里使用虚拟桌面 VNC，用的是 `tigervncserver`, 全程使用 `orangepi` 用户, 香橙派安装的是 `Ubuntu 22.04` 系统, 如果需要直接转发显示器的内容，请查看 [Ubuntu安装配置VNC直接转发桌面显示](/posts/bd65d26a/)

## 安装依赖包

```bash
sudo apt-get update
sudo apt-get upgrade

sudo apt-get -y install xorg lightdm xfce4 tango-icon-theme gnome-icon-theme dbus-x11
sudo apt-get install xfonts-base tightvncserver
```

## 启动 VNC Server

```bash
vncserver :1
```

display :1 refers to port 5901

## 重启 VNC Server

```bash
vncserver -kill :1
vncserver :1
```

## 开机自启动

`sudo vim /usr/local/bin/tightvncserver`

```bash
#!/bin/bash
PATH="$PATH:/usr/bin/"
DISPLAY="1"
DEPTH="16"
GEOMETRY="1024x768"
OPTIONS="-depth ${DEPTH} -geometry ${GEOMETRY} :${DISPLAY}"

case "$1" in
start)
/usr/bin/vncserver ${OPTIONS}
;;

stop)
/usr/bin/vncserver -kill :${DISPLAY}
;;

restart)
$0 stop
$0 start
;;
esac
exit 0
```

```bash
sudo chmod +x /usr/local/bin/tightvncserver
```

`sudo vim /lib/systemd/system/tightvncserver.service`

```ini
[Unit]
Description=Manage tightVNC Server

[Service]
Type=forking
ExecStart=/usr/local/bin/tightvncserver start
ExecStop=/usr/local/bin/tightvncserver stop
ExecReload=/usr/local/bin/tightvncserver restart
User=orangepi

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable tightvncserver.service 
```