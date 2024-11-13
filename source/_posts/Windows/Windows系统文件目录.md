---
title: Windows系统文件目录
abbrlink: deff9f9f
cover: 'https://static.zahui.fan/public/Windows-old.svg'
categories:
  - Windows
tags:
  - Windows
date: 2021-03-10 18:17:34
---

## 常用系统目录

如果卸载软件，需要注意这些目录有没有残留。

| 目录                                               | 变量或短路径           | 说明                        |
| ------------------------------------------------ | ---------------- | ------------------------- |
| C:\Windows\System32\config\systemprofile\AppData |                  | SYSTEM 用户目录（首次访问需要授权）     |
| C:\Program Files                                 |                  | 64 位程序安装目录（需要管理员权限）       |
| C:\Program Files (x86)                           |                  | 32 位程序安装目录（需要管理员权限）       |
| C:\Users\用户名                                     | `%userprofile%`  | 用户的 Home 目录               |
| C:\Users\用户名\AppData\Roaming                     | `%appdata%`      |                           |
| C:\Users\用户名\AppData\Local                       | `%localappdata%` | 数据目录，以及一些软件安装目录（不需要管理员权限） |
| C:\Users\iuxt\AppData\Local\Temp                 | `%tmp%`          | 临时目录，一般不需管理               |
| C:\ProgramData                                   | `%programdata%`  | 应用数据（这个目录是个隐藏目录）          |

## 开始菜单

全局位置：`C:\ProgramData\Microsoft\Windows\Start Menu`
个人位置：`C:\Users\Administrator\AppData\Roaming\Microsoft\Windows\Start Menu`

## windows update 更新缓存

`C:\Windows\SoftwareDistribution\Download`

## 服务目录

windows 的服务存储的文件, 如果没有指定用户, 就会使用系统用户 (SYSTEM) 来运行, home 目录为:

`C:\Windows\System32\config\systemprofile\`

比如我的 syncthing 数据就被保存到了 `C:\Windows\System32\config\systemprofile\AppData\Local\Syncthing` , 指定了当前用户的话是在 `C:\Users\iuxt\AppData\Local\Syncthing`

