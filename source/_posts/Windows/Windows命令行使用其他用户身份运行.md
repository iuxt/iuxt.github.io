---
title: Windows命令行使用其他用户身份运行
categories:
  - Windows
tags:
  - cmd
  - bat
  - 脚本
abbrlink: snagrk
cover: ''
date: 2023-11-21 14:59:44
---

比如说我一个脚本使用管理员权限运行，那么它调用的其他程序默认都是以管理员权限运行的。我想要以普通用户程序来运行，有以下几种方法：

## runas 方式

### 指定权限运行

0x20000 是标准用户权限
0x40000 是管理员权限

```bat
runas /trustlevel:0x20000 "wt.exe"
```

这种方式我测试会造成 wsl 报错“UtilTranslatePathList”

### 指定用户执行

```bat
runas /user:iuxt wt.exe"
```

这种方式会**弹窗让你输入密码**（每次）

## psexec

psexec 是微软官方的一组小工具：<https://learn.microsoft.com/zh-cn/sysinternals/downloads/psexec> 需要用到里面的 `psexec64.exe` 然后调用此工具。

```bat
psexec.exe -u iuxt -p YourPassword C:\Path\To\wt.exe
```

缺点：

1. 需要在命令行指定用户名和密码（有安全隐患）
2. 运行的时候会有个黑框框一闪而过，并且第一次启动会有个窗口，需要点一下 agree