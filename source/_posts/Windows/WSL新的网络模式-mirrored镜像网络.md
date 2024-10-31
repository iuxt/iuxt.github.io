---
title: WSL新的网络模式-mirrored镜像网络
categories:
  - Windows
tags:
  - wsl2
  - 网络
  - 效率工具
  - 命令行工具
abbrlink: luam6g8o
cover: 'https://static.zahui.fan/public/wsl.svg'
date: 2024-03-28 10:27:10
---

刚开始我用 [Hyper-V 自定义内部网络网段和IP地址](/posts/6f952944) 配置 Hyper-V 并创建了几台虚拟机， 但是和 WSL 的网络不通， 解决方案可以是将 Hyper-V 虚拟机只接使用 WSL 的网络适配器。不过 2023 年 9 月的 WSL 更新添加了一些新的实验性功能，其中包括一些关于新的网络模式“镜像”。镜像网络带来了一些实用的特性，例如将 WSL 中的服务开放到局域网（之前是 NAT 网络，只有主机可以通过 localhost 访问）。
更新日志中提到，镜像网络带来的新特性如下：

- IPv6 支持
- 在 Linux 中通过 `127.0.0.1` 访问 Windows 服务
- 通过局域网直接连接 WSL
- 对 VPN 更好的兼容性
- 多播支持

## 安装使用

首先，这项特性需要 `22621.2359` 及以上版本的 `Windows 11` 以及 `2.0` 以上版本的 WSL。使用 `wsl --version` 命令可以检查是否符合需求，`wsl --update` 命令可以更新 WSL。

```bat
C:\Users\iuxt>wsl --version
WSL 版本： 2.1.5.0
内核版本： 5.15.146.1-2
WSLg 版本： 1.0.60
MSRDC 版本： 1.2.5105
Direct3D 版本： 1.611.1-81528511
DXCore 版本： 10.0.25131.1002-220531-1700.rs-onecore-base2-hyp
Windows 版本： 10.0.22631.3296
```

确认满足版本需求后， 在 windows 的个人文件夹下创建 `.wslconfig` 文件，内容如下：

```ini
[wsl2]
autoProxy=false             # 是否强制 WSL2/WSLg 子系统使用 Windows 代理设置（请根据实际需要启用）
dnsTunneling=true           # WSL2/WSLg DNS 代理隧道，以便由 Windows 代理转发 DNS 请求（请根据实际需要启用）
firewall=true               # WSL2/WSLg 子系统的 Windows 防火墙集成，以便 Hyper-V 或者 WPF 能过滤子系统流量（请根据实际需要启用）
guiApplications=true        # 启用 WSLg GUI 图形化程序支持
ipv6=true                   # 启用 IPv6 网络支持
localhostForwarding=true    # 启用 localhost 网络转发支持
memory=4GB                  # 限制 WSL2/WSLg 子系统的最大内存占用
nestedVirtualization=true   # 启用 WSL2/WSLg 子系统嵌套虚拟化功能支持
networkingMode=mirrored     # 启用镜像网络特性支持
# pageReporting=true          # 启用 WSL2/WSLg 子系统页面文件通报，以便 Windows 回收已分配但未使用的内存
processors=8                # 设置 WSL2/WSLg 子系统的逻辑 CPU 核心数为 8（最大肯定没法超过硬件的物理逻辑核心数）
vmIdleTimeout=-1            # WSL2 VM 实例空闲超时关闭时间，-1 为永不关闭，根据参数说明，目前似乎仅适用于 Win11+

[experimental]                  # 实验性功能（按照过往经验，若后续转正，则是配置在上面的 [wsl2] 选节）
autoMemoryReclaim=gradual       # 启用空闲内存自动缓慢回收，其它选项：dropcache / disabled（立即/禁用）
hostAddressLoopback=true        # 启用 WSL2/WSLg 子系统和 Windows 宿主之间的本地回环互通支持
sparseVhd=true                  # 启用 WSL2/WSLg 子系统虚拟硬盘空间自动回收
useWindowsDnsCache=false        # 和 dnsTunneling 配合使用，决定是否使用 Windows DNS 缓存池

```

`sparseVhd=true` 生效需要稀疏 `vhdx`， 转换命令 `wsl --manage 'Ubuntu-24.04' --set-sparse true`

详细配置说明：<https://learn.microsoft.com/zh-cn/windows/wsl/wsl-config>

然后重启 WSL

```bat
wsl --shutdown
wsl
```

## WSL 网卡变化

![image.png](https://static.zahui.fan/images/202403281045337.png)

## 参考文档

[在WSL2中访问Windows服务的另一种选择——mirrored镜像网络](https://zhuanlan.zhihu.com/p/668181689)
[Windows Subsystem for Linux September 2023 update](https://devblogs.microsoft.com/commandline/windows-subsystem-for-linux-september-2023-update/)
[Advanced settings configuration in WSL](https://learn.microsoft.com/en-us/windows/wsl/wsl-config#wslconfig)

## 遇到的问题

### 无法访问 docker 容器端口

我的 `.wslconfig` 配置：

```conf
[wsl2]
autoProxy=false             # 是否强制 WSL2/WSLg 子系统使用 Windows 代理设置（请根据实际需要启用）
dnsTunneling=true           # WSL2/WSLg DNS 代理隧道，以便由 Windows 代理转发 DNS 请求（请根据实际需要启用）
firewall=true               # WSL2/WSLg 子系统的 Windows 防火墙集成，以便 Hyper-V 或者 WPF 能过滤子系统流量（请根据实际需要启用）
guiApplications=true        # 启用 WSLg GUI 图形化程序支持
ipv6=true                   # 启用 IPv6 网络支持
nestedVirtualization=true   # 启用 WSL2/WSLg 子系统嵌套虚拟化功能支持
networkingMode=mirrored     # 启用镜像网络特性支持
vmIdleTimeout=-1            # WSL2 VM 实例空闲超时关闭时间，-1 为永不关闭，根据参数说明，目前似乎仅适用于 Win11+

[experimental]
autoMemoryReclaim=gradual       # 启用空闲内存自动缓慢回收，其它选项：dropcache / disabled（立即/禁用）
hostAddressLoopback=true        # 启用 WSL2/WSLg 子系统和 Windows 宿主之间的本地回环互通支持
sparseVhd=true                  # 启用 WSL2/WSLg 子系统虚拟硬盘空间自动回收
useWindowsDnsCache=false        # 和 dnsTunneling 配合使用，决定是否使用 Windows DNS 缓存池
```

```bash
# ubuntu系统关闭防火墙
sudo systemctl disable --now ufw
```

修改 Docker 配置文件 `/etc/docker/daemon.json`

```json
{
  "iptables": false
}
```