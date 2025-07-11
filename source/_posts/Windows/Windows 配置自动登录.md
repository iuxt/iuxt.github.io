---
title: Windows 配置自动登录
categories:
  - Windows
tags:
  - 配置记录
  - 注册表
  - Windows
abbrlink: sewhsk
cover: 'https://s3.babudiu.com/iuxt/public/Windows.svg'
date: 2024-06-11 13:26:43
---

windows 中有部分应用程序需要登录当前账户才可以自动启动，或者嫌输密码麻烦，都可以设置自动登录，不用删除开机密码（删除开机密码也要鼠标点一下登录才可以登录）

## 修改注册表

旧版本 windows 10 或者 windows 7 可以直接设置，但是新版本 windows 没有了这个选项，需要修改注册表配置

将下面文本保存成 reg 文件，双击导入。

```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\PasswordLess\Device]
"DevicePasswordLessBuildVersion"=dword:00000000
```

## netplwiz 配置

win + R 输入 netplwiz 打开用户管理界面。

![image.png](https://s3.babudiu.com/iuxt/images/202406111331601.png)

取消勾选 要使用本计算机，用户必须输入用户名和密码 选项， 在弹出的框中输入当前用户密码。

![image.png](https://s3.babudiu.com/iuxt/images/202406111331636.png)
