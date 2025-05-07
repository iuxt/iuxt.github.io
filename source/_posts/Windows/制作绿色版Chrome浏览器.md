---
title: 制作绿色版Chrome浏览器
abbrlink: 8d9e31b7
categories:
  - Windows
tags: [浏览器, 绿色软件]
cover: 'https://static.zahui.fan/public/Chrome.svg'
date: 2022-10-10 21:50:55
updated: 2025-05-07 10:25:55
---

绿色版程序只需要将安装后的文件夹拷贝一份即可实现绿色化，不过浏览器生成的数据包括缓存、书签、历史记录等都是存储在操作系统默认位置的，完全随身携带，还需要将数据目录固定在程序文件夹下。

在 chrome 安装目录创建一个 bat 脚本

```bat
start chrome.exe --user-data-dir="User Data"
```

以后使用这个 bat 脚本来启动浏览器，数据文件就全部存放在当前目录下的 User Data 目录下

附上 chrome 离线版下载连接：

```plaintext
Windows 64
https://www.google.cn/intl/zh-CN/chrome/?standalone=1&platform=win64

Windows 32
https://www.google.cn/intl/zh-CN/chrome/?standalone=1&platform=win

Mac
https://www.google.cn/intl/zh-CN/chrome/?standalone=1&platform=mac

Linux
https://www.google.cn/intl/zh-CN/chrome/?standalone=1&platform=linux
```
