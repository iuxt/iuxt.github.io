---
title: Hyper-V 自定义内部网络网段和IP地址
abbrlink: 6f952944
categories:
  - Windows
tags:
  - VirtualMachine
  - Windows
  - Command
  - PowerShell
  - Hyper-V
date: 2022-01-12 11:06:59
---

## 开始之前

首先如果是仅仅想要主机和虚拟机进行数据互通，其实不需要固定 IP，直接通过计算机名就可以互相访问。

## Hyper-V 网络模式

外部虚拟网络: 类似于 VMware 的桥接网络模式, 在希望允许虚拟机与外部服务器和管理操作系统（有时称为父分区）进行通信时，可以使用此类型的虚拟网络。此类型的虚拟网络还允许位于同一物理服务器上的虚拟机互相通信。

内部虚拟网络: 类似于 VMware 的 NAT 网络模式, 在希望允许同一物理服务器上的虚拟机与虚拟机和管理操作系统之间进行通信时，可以使用此类型的虚拟网络。内部虚拟网络是一种未绑定到物理网络适配器的虚拟网络。它通常用来构建从管理操作系统连接到虚拟机所需的测试环境。

专用虚拟网络: 在希望只允许同一物理服务器上的虚拟机之间进行通信时，可以使用此类型的虚拟网络。专用虚拟网络是一种无需在管理操作系统中装有虚拟网络适配器的虚拟网络。在希望将虚拟机从管理操作系统以及外部网络中的网络通信中分离出来时，通常会使用专用虚拟网络。

由于 Hyper-V 自带的 Default Switch 在每次电脑重启的时候会自动分配一个未使用的网段, 无法达到固定 IP 的效果, Hyper-V 默认的 Default Switch 同时支持了 NAT 网络以及 DHCP

正常来说想要固定 IP 有以下方式:
1. 创建一个自定义的网段, 固定网段的地址范围, 然后虚拟机使用固定 IP
2. 增加一个新的仅内网网卡, 虚拟机正常访问网络使用 Default Switch 不变, 物理机访问虚拟机使用仅内网网卡
3. 使用外部虚拟网络, 和主机处于同一个内网

## 方案一: 创建自定义 NAT 网段

参考：<https://learn.microsoft.com/zh-cn/virtualization/hyper-v-on-windows/user-guide/setup-nat-network>

### 添加虚拟交换机

{% tabs TabName %}

<!-- tab 使用powershell添加 -->
以管理员身份启动 PowerShell

> Win11 和新一点的 Win10 系统可以通过右键点击开始菜单，选择 `Windows 终端(管理员)` 打开

```powershell
# 创建虚拟交换机，等同于在Hyper-V管理器界面中新建虚拟网络交换机
New-VMSwitch -SwitchName "Internal" -SwitchType Internal
```

<!-- endtab -->

<!-- tab 手动添加 -->
可以到 Hyper V 管理器 虚拟交换机管理器 新建虚拟交换机
类型选择 `内部`

![手动创建虚拟交换机|506](https://static.zahui.fan/images/Snipaste_2022-01-13_09-39-25.png)
<!-- endtab -->

{% endtabs %}

### 设置 ip 地址

{% tabs TabName %}

<!-- tab 使用powershell添加 -->

```powershell
# 获取虚拟交换机的ifindex，并赋值到变量中
$ifindex = Get-NetAdapter -Name "vEthernet (Internal)" | Select-Object -ExpandProperty 'ifIndex'
# 在虚拟交换机上设置固定IP，用于网关IP
New-NetIPAddress -IPAddress 10.0.0.1 -PrefixLength 24 -InterfaceIndex $ifindex
```

<!-- endtab -->

<!-- tab 手动添加 -->

进入 windows 设置，给网卡 `vEthernet (NAT)` 设置固定 ip 和子网掩码

![手动设置|520](https://static.zahui.fan/images/Snipaste_2022-01-13_09-43-03.png)

<!-- endtab -->

{% endtabs %}

### 创建 NAT 网络

```powershell
New-NetNat -Name Internal -InternalIPInterfaceAddressPrefix 10.0.0.0/24
```

### 删除 NAT 网络

```powershell
Get-NetNat                  # NAT网络保持一个就行了，可以删除后重新创建
Remove-NetNat NAT           # 删除nat网络
```

## 方案二: 创建一个仅内网交换机

### 创建一个内部交换机

进入 Hyper-V 虚拟交换机管理器, 创建一个内部虚拟交换机

![image.png|431](https://static.zahui.fan/images/202309141440799.png)

### 修改网卡 IP 信息

在 控制面板 -- 更改适配器设置界面, 给内部虚拟交换机这个网卡设置 IP 地址, 只需要设置 IP 和掩码即可.

![image.png|641](https://static.zahui.fan/images/202309141439136.png)

### 虚拟机增加网卡

在虚拟机设置界面, 增加一个新的网络适配器, 交换机选择内部虚拟交换机

![image.png|478](https://static.zahui.fan/images/202309141440651.png)

### 操作系统网卡配置固定 IP

此时在操作系统中, 会多出来一张网卡, 多出来的网卡配置一下固定 IP 和掩码即可, IP 和交换机在同一个网段, 不要重复.
![image.png|593](https://static.zahui.fan/images/202309141443040.png)

此时主机可以通过 172.16.0.8 这个地址访问虚拟机, 虚拟机也可以通过 172.16.0.1 访问主机

## 方案三: 使用外部网络

创建外部虚拟机交换机, 选择一下桥接的网卡, 这种方式虚拟机也会获得一个 IP 地址, 虚拟机就会像主机一样可以对外提供服务, 常用于服务器

![image.png|429](https://static.zahui.fan/images/202309141444528.png)

操作系统内设置外部虚拟交换机网卡即可.