---
title: 在macOS上使用MusicPlayer2听本地音乐
categories:
  - 工具
tags: [macOS, wine]
abbrlink: tat9z4
date: 2026-02-21 21:40:15
cover: ""
updated: 2026-02-21 21:40:57
---

我的环境：
OS：macOS Tahoe & macOS Sequoia
CrossOver 版本：26.0
MusicPlayer2 版本：2.78

在 macOS 上没有找到我想要的本地音乐播放软件，倒是 Windows 上有个开源的播放器很不错: [MusicPlayer2官方地址](https://github.com/zhongyang219/MusicPlayer2)，由于是 Windows 应用程序，想要在 macOS 上使用，我用的是 CrossOver 来运行

## 配置软件

MusicPlayer2 文件我放在了 iCloud Drive 里，这样多个 Mac 电脑可以同步配置、播放记录等。

### 创建容器

我创建的是 Windows 11 容器。

### 安装运行库

按照 MusicPlayer2 的要求，需要安装 Microsoft Visual C++ 运行库到 CrossOver 的容器里，当然也可以将需要的 dll 文件放在软件目录下。

### 创建图标

![image.png|374](https://s3.babudiu.com/iuxt/2026/02/1364fead78c5772ad6a70221e2951430.png)

在这里选择程序路径，然后将指令保存到面板

### 备注：删除图标

CrossOver 设计的有问题，创建图标没给删除的方式，经过研究，删除图标需要到：`~/Applications/CrossOver/` 把对应的文件删除即可。

![image.png|548](https://s3.babudiu.com/iuxt/2026/02/bb24b722c94e4fdd17fd98da8cc833f3.png)

## CrossOver 配置

为了显示最佳化，我做了如下改动：
图形：D3DMetal
开启高分辨率模式

## 窗口大小调整问题

默认情况下不能调整窗口大小，只能最大化和最小化，需要修改 Wine 配置 Graphics ，取消勾选 允许窗口管理器装饰窗口。
![image.png|482](https://s3.babudiu.com/iuxt/2026/02/649aabe17badfc40dbf3ff83940aeb9f.png)

## MusicPlayer2 配置

歌词字体设置 霞鹜文楷 常规
标题栏 自绘标题栏（wine 自带标题栏太难看了）
界面设置为界面 12（这个界面不带系统默认的列表，默认列表搜索有 bug）

最终展示界面
![image.png|564](https://s3.babudiu.com/iuxt/2026/02/dfa52ab45129b871004f06ac37752129.png)
