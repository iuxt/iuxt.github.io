---
title: Windows自动登录
categories:
  - Windows
tags: [安全, 配置记录, 注册表]
abbrlink: t9k27d
date: 2026-01-28 11:40:25
cover: ""
updated: 2026-01-28 12:11:46
---

一般情况下，Windows 开机后会停留在锁屏界面，就算不配置密码，也需要点一下登录按钮才能进入桌面。我有个电脑我需要远程访问，但是它每次开机都不会自动连 Wi-Fi，必须要进入桌面才能自动连上 Wi-Fi，所以我配置一下让电脑开机可以自动进入桌面，忽略开机密码。自动登录只是开机时候可以自动进入桌面，但是锁屏后还是需要输入密码的。

{% note danger flat %}
这么做有安全风险，让开机密码形同虚设！！
{% endnote %}

## 方法一：注册表法（推荐）

保存成 bat 文件，导入这个注册表文件即可

```bat
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon]
"AutoAdminLogon"="1"
"DefaultUserName"="你的Windows用户名"
"DefaultPassword"="你的Windows密码"
```

如果是微软账号，用户名类似于 `example@outlook.com` 这种格式。

## 方法二：netplwiz 配置

Win + R 输入 `netplwiz`， 取消勾选用户必须输入用户名和密码，不过新版本的 Windows 10 和 Windows 11 没有这个选项了。

## 方法三：使用工具 Autologon

Autologon 是微软官方提供的小工具，官方下载地址：<https://learn.microsoft.com/en-us/sysinternals/downloads/autologon>

输入账号密码和对应点的域，点击 Enable 即可开启自动登录。
![PixPin_2026-01-28_12-11-21.png|310](https://s3.babudiu.com/iuxt/2026/01/d01981540ace3a3d5b514614520c6eee.png)
