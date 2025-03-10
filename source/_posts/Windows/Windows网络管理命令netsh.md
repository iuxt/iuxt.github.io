---
title: Windows网络管理命令netsh
abbrlink: f85b3ad3
cover: 'https://static.zahui.fan/public/Windows-old.svg'
categories:
  - Windows
tags: [Windows]
date: 2021-05-13 19:27:17
updated: 2025-03-10 14:04:26
---

> netsh 是 windows 平台网络管理命令

## 防火墙设置

### 开启防火墙

```bat
sc config mpsdrv start= auto
sc config mpssvc start= auto
sc start mpsdrv
sc start mpssvc

netsh advfirewall set allprofiles state on
```

### 规则配置

```bat
:: 拒绝指定IP访问指定端口
netsh advfirewall firewall add rule name=BlockRTX dir=in protocol=tcp localport=8000 action=block enable=yes remoteip=192.168.5.2

:: 开放一个端口
netsh advfirewall firewall add rule name="445" protocol=TCP dir=in localport=445 action=allow

:: windows xp 使用
netsh firewall set portopening TCP 445 ENABLE
```

### 防火墙配置

```bat
:: 关闭防火墙
netsh firewall set opmode mode=disable

:: 防火墙恢复默认配置
netsh firewall reset
```

## 修改网络设置

### 修改 ip、dns 等

```bat
# STATIC
netsh interface ip set address "以太网" static 192.168.8.88 255.255.252.0 192.168.8.3
netsh interface ip set dns "以太网" static 114.114.114.114
netsh interface ip add dns "以太网" 114.114.115.115

# DHCP
netsh interface ip set address "以太网" dhcp
netsh interface ip set dns "以太网" dhcp
```

## 端口转发

```bat
1. 启用端口转发
使用 netsh 将本地 8080 端口的流量转发到 192.168.1.100:80：


netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=80 connectaddress=192.168.1.100
listenport=8080：监听本地 8080 端口
listenaddress=0.0.0.0：监听所有 IP
connectport=80：转发到目标主机的 80 端口
connectaddress=192.168.1.100：目标主机 IP 地址
2. 查看当前端口转发规则
cmd
复制
编辑
netsh interface portproxy show all
3. 删除指定端口转发
如果想删除 8080 端口的转发：

cmd
复制
编辑
netsh interface portproxy delete v4tov4 listenport=8080 listenaddress=0.0.0.0
4. 确保系统支持转发
Windows 需要启用 IP Helper 服务，并打开 IPv4 转发：

4.1 启用 IP Helper 服务
在 CMD 中运行：

cmd
复制
编辑
sc config iphlpsvc start=auto
net start iphlpsvc
4.2 开启 IPv4 转发
在注册表中修改：

cmd
复制
编辑
reg add HKLM\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters /v IPEnableRouter /t REG_DWORD /d 1 /f
然后重启电脑使其生效。

5. 测试转发是否生效
在本机上运行：

c
复制
编辑
netstat -ano | findstr :8080
如果转发成功，可以通过 telnet 或 curl 测试：

cmd
复制
编辑
curl http://127.0.0.1:8080
如果有问题，可以查看 Windows 防火墙规则，确保 8080 端口是允许访问的：

cmd
复制
编辑
netsh advfirewall firewall add rule name="Allow Port 8080" dir=in action=allow protocol=TCP localport=8080

```
