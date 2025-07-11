---
title: 使用 PowerShell 修改 Windows 防火墙规则
categories:
  - Windows
tags: [PowerShell, 网络, 防火墙, 配置记录]
abbrlink: seln9g
cover: https://s3.babudiu.com/iuxt/public/Windows.svg
date: 2024-06-05 16:51:16
updated: 2025-03-27 22:57:12
---

## 修改网络位置（专用网络或共用网络）

在 windows 7 时代在控制面板里是可以直接修改的， 但是在 Windows 11 已经不能修改了。

![image.png](https://s3.babudiu.com/iuxt/images/202406051653691.png)

使用公用网络会影响到防火墙策略， 比如在专用网络下， 局域网内是可以网络发现其他设备的。

![image.png](https://s3.babudiu.com/iuxt/images/202406051656111.png)

比如我用 `zerotier` 这个软件会给电脑安装一个虚拟网卡，家里的电脑 `zerotier` 的网卡设置成了公用网络，那么就不能 rdp 远程连接家里电脑了。

### 修改方法

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

## 放通某个网卡

```powershell
# 使用 Get-NetAdapter 或 Get-NetConnectionProfile 获取网卡的ID

# 根据ID放行
New-NetFirewallRule -DisplayName "允许zerotier网卡" -ID 23 -Direction Inbound -Action Allow

# 根据名字放行
New-NetFirewallRule -DisplayName "允许NAT网卡" -InterfaceAlias "vEthernet (NAT)" -Direction Inbound -Action Allow
```

## 禁止某个程序联网

```powershell
New-NetFirewallRule -DisplayName "Block-adobe-out" -Direction Outbound -Program "C:\Program Files\Adobe\Adobe Photoshop 2025\Photoshop.exe" -Action Block

New-NetFirewallRule -DisplayName "Block-adobe-in" -Direction Inbound -Program "C:\Program Files\Adobe\Adobe Photoshop 2025\Photoshop.exe" -Action Block
```

## 允许某个网段

```powershell
New-NetFirewallRule -DisplayName "Allow Subnet 10.233.233.0/24" -Direction Inbound -Action Allow -RemoteAddress 10.233.233.0/24 -Protocol Any -Enabled True
```
