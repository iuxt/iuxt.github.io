---
title: Windows将网络修改为专用网络或公用网络
categories:
  - Windows
tags:
  - PowerShell
  - 网络
  - 防火墙
  - 配置记录
abbrlink: seln9g
cover: 'https://static.zahui.fan/public/Windows.svg'
date: 2024-06-05 16:51:16
---

一般来说新增一个网络适配器，会有个提示框， windows 老是改逻辑， 在 windows 7 时代在控制面板里是可以直接修改的， 但是在 Windows 11 已经不能修改了。

![image.png](https://static.zahui.fan/images/202406051653691.png)

## 有什么影响

会影响到防火墙策略， 比如在专用网络下， 局域网内是可以网络发现其他设备的。
![image.png](https://static.zahui.fan/images/202406051656111.png)

比如我用 `zerotier` ，家里的电脑 `zerotier` 的网卡设置成了公用网络，那么就不能 rdp 远程连接家里电脑了。

## 修改方法

需要以管理员身份运行 `PowerShell` 来执行：

```powershell
PS C:\Users\iuxt> Get-NetConnectionProfile


Name                     : CMCC-Captain
InterfaceAlias           : WLAN
InterfaceIndex           : 13
NetworkCategory          : Private
DomainAuthenticationKind : None
IPv4Connectivity         : Internet
IPv6Connectivity         : Internet

Name                     : 网络 3
InterfaceAlias           : ZeroTier One [272f5eae1628958e]
InterfaceIndex           : 20
NetworkCategory          : Public
DomainAuthenticationKind : None
IPv4Connectivity         : LocalNetwork
IPv6Connectivity         : NoTraffic

```

根据 `InterfaceIndex` 来修改（也可以根据 InterfaceAlias ）

```powershell
Set-NetConnectionProfile -InterfaceIndex 20 -NetworkCategory Private
```