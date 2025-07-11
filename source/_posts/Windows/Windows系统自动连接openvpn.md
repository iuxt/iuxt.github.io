---
title: Windows系统自动连接openvpn
abbrlink: a6a8f287
categories:
  - Windows
tags:
  - Windows
cover: 'https://s3.babudiu.com/iuxt/public/vpn.svg'
date: 2021-03-10 20:08:12
---

> 在公司想连接线上服务器步骤：打开 openvpn 软件，输入静态密码，掏出手机，解锁，打开 totp 软件，输入 totp 软件的开启密码，记下 6 位数动态密码，输入到电脑里，完成连接，锁定手机。非常麻烦
> 而且因为时间同步问题，可能还有 10 秒就刷新动态密码了，还需要等待刷新后再输入新的密码，更麻烦的是 openvpn 会修改系统的路由，导致有些公司内部网站上不了，就会出现连接 vpn--- 做 A 事情，断开 vpn 做 B 事情。

这里提供一个脚本，一键连接 openvpn，适用于 windows

## 1. 安装 openvpn 软件

软件安装到默认位置，需要安装 tap driver
打开一次软件（为了生成配置文件目录），以后就可以不用启动

## 脚本内容

start.py

```python
import pyotp
import subprocess

totp = pyotp.TOTP('<TOTP seed>')  # 这里要填写的totp的seed，一般解析一下二维码就能获得
password = "<你的固定密码>" + totp.now()         # 固定密码


with open(r"C:\Users\iuxt\OpenVPN\config\password.txt", "w") as f:   # 这里是password.txt文件位置
    f.write("<这里写你的用户名>\n%s" % password)
    
subprocess.run([r"C:\Program Files\OpenVPN\bin\openvpn.exe", r"C:\Users\iuxt\OpenVPN\config\win.ovpn"])  # vpn可执行位置和vpn配置文件位置

```

start.bat

```bat
@echo off
%1 mshta vbscript:CreateObject("Shell.Application").ShellExecute("cmd.exe","/c %~s0 ::","","runas",1)(window.close)&&exit
cd /d "%~dp0"
rem 上面这段是获取管理员权限👆

python start.py
```

## 2. 脚本拷贝到配置文件目录

将 `start.py` `start.bat` `win.ovpn` 拷贝到配置文件目录 `C:\Users\iuxt\OpenVPN\config`

`start.py` 需要修改一下注释位置

`win.ovpn` 需要修改 `auth-user-pass C:\\Users\\iuxt\\OpenVPN\\config\\password.txt` 需要和 `start.py` 里面路径保持一致

## 3. 启动和关闭

双击 `start.bat` 即可自动连接

ctrl + c 即可关闭

如果有隐藏 cmd 窗口的需求，可以看看这篇 [隐藏cmd窗口](/3b6d9935/)
