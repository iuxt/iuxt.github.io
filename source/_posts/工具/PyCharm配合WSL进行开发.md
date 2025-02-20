---
title: PyCharm配合WSL进行开发
categories:
  - 工具
tags: [开发工具配置]
abbrlink: sik0ul
cover: 'https://static.zahui.fan/images/202408211408782.png'
date: 2024-08-21 14:03:57
updated: 2025-02-20 18:46:48
---

本文使用 WSL2，WSL2 里面安装了 Docker， PyCharm 支持的配合 wsl 进行使用的方法有很多种，这里提供几个思路

方法 1: WSL 远程开发（目前 BETA 版）
方法 2: 代码放在 Windows 上，Python 解释器在 WSL 里
方法 3: 代码放在 WSL 里，Python 解释器在 WSL 里
方法 4: 代码放在 WSL 里，Python 解释器在 WSL 里的 Docker 里
方法 5: 代码放在 Windows 上，Python 解释器放在 WSL 里的 Docker 里
方法 6: 直接在 WSL 里安装 Linux 版的 PyCharm（WSL 支持 GUI 程序运行）
方法 7: 使用 devcontainer（不好用）

我最推荐的： 将代码放在 WSL 中，将 Python 解释器放在 WSL 中。

## 代码放在 WSL 里，Python 解释器在 WSL 里

首选，这个时候执行的就是 wsl 里的程序，比如 git 调用的就是 wsl 里的 git 程序。

使用方法：
1. 进入 WSL 终端拉取代码（PyCharm 目前不支持拉代码到 WSL 里）
2. 在 PyCharm 里打开项目，项目路径如图：
![image.png](https://static.zahui.fan/images/202408161038687.png)

打开 PyCharm 终端会自动进入 WSL 环境。但需要手动 source 才能进入虚拟环境。

## 远程开发

备选方案

远程开发需要在 WSL 里安装一个 PyCharm 服务版（使用远程开发会自动安装），并用 Windows 的 PyCharm 连接上它，使用方式和直接用 Linux 版的相似，缺点是每次更新 PyCharm 后，在 WSL 里也需要更新一下。还有一个缺点：不能直接启动，必须从 Windows 的 PyCharm 点击远程开发，然后会再运行一个 PyCharm。
![image.png](https://static.zahui.fan/images/202408161023064.png)

花里胡哨的终端会乱码
![image.png](https://static.zahui.fan/images/202408161030953.png)

毕竟走网络通信，远程开发会有一点延迟。
![image.png](https://static.zahui.fan/images/202408161032027.png)

远程开发优势： 可以直接使用 Linux 本地解释器，路径也都是 Linux 路径

## 使用 WSL 里的 Python 解释器

缺点： PyCharm 自带的终端需要配置，不然默认打开的是 PowerShell，需要先执行 WSL 命令进入 WSL，然后执行 `source ~/.virtualenvs/auppus-drf/bin/activate` 才能加载虚拟环境。调用的 GIT 等程序，用的是 Windows 上的。

## 使用 WSL 运行图形版 PyCharm

不稳定，不推荐了。想要输入中文，输入法需要用 WSL 里的输入法，很麻烦还不稳定。

## 依赖 Docker 的方法

所有使用 Docker 的方法都不好用，慢不说还不方便，使用 Docker 看起来很美好，但是真的不好用。包括 devcontainer，如果你觉得好用，那你是对的，是我用的姿势不对。
