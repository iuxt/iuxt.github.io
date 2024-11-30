---
title: 在Windows中使用msys来运行linux命令
categories:
  - Windows
tags:
  - ''
abbrlink: snrcqh
date: 2024-11-30 17:51:53
cover: ''
---

## 为什么不用 WSL

主要原因有以下几点：
1. WSL 访问 Windows 的路径和原生 Windows 不一致，需要手动或者 `wslpath` 命令来转换
2. 在 Windows 的命令行运行 wsl 命令的时候，需要通过 `wsl <linux命令>` 这种方式来实现，并不是原生的 Windows 命令写法。
3. WSL 启动耗时问题（倒还好，影响不大。）

## 下载安装

官网地址：<https://www.msys2.org/>
安装直接下一步下一步即可。

> 不同的启动器之间的区别请看：<https://www.msys2.org/docs/environments/>

## 增加环境变量

或者 win + R 输入 `sysdm.cpl` 点击 高级 环境变量 进入环境变量配置界面：

![image.png](https://static.zahui.fan/images/202411302227697.png)

一般来说建议修改用户变量里面的 PATH 即可，添加一个路径：`C:\msys64\usr\bin`

然后就可以正常使用了。

## 常用技巧

包管理使用的是 pacman ，使用文档可以看这里：<https://www.msys2.org/docs/package-management/>

比如安装 vim，可以执行 `pacman -S vim`