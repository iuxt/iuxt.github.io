---
title: mRemoteNG 如何显示保存的密码
categories:
  - 工具
tags:
  - rdp
abbrlink: sm0nds
cover: 'https://static.zahui.fan/images/202410272127464.png'
date: 2024-10-27 21:13:04
---

mRemoteNG 是一款比较好用的 Windows 平台的连接 RDP 的管理工具，非常好用，支持选项卡，配置文件管理，账号密码管理等。虽然现在 xshell 8 也支持连接 rdp 了，但是没有这个好用。mRemoteNG 也支持连接 vnc 和 ssh，但是不好用，我只用它来连 rdp

![image.png](https://static.zahui.fan/images/202410272116148.png)

不过添加好的配置文件，密码是加密的，导出配置文件也看不到原密码，如果我添加了配置，过了一段时间忘记了密码，可以通过这种方法来找回密码。

配置 外部工具 新增一个外部工具，配置如下：

![image.png](https://static.zahui.fan/images/202410272122994.png)

| 名称   | 配置                 |
| ---- | ------------------ |
| 显示名称 | 显示密码               |
| 文件名  | cmd                |
| 参数   | /k echo %password% |
| 选项   | 看上图                |

使用方法：
在连接上面右键，选择工具 -- 显示密码
![image.png](https://static.zahui.fan/images/202410272125763.png)

在弹出的 cmd 窗口中会显示出密码明文
![image.png](https://static.zahui.fan/images/202410272126009.png)
