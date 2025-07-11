---
title: Windows网络管理命令netsh
abbrlink: f85b3ad3
cover: 'https://s3.babudiu.com/iuxt/public/Windows-old.svg'
categories:
  - Windows
tags: [Windows]
date: 2021-05-13 19:27:17
updated: 2025-03-10 17:50:21
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

### 启用 IP Helper 服务

```bat
sc config iphlpsvc start=auto
net start iphlpsvc
```

### 开启 IPv4 转发

在注册表中修改：

```bat
reg add HKLM\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters /v IPEnableRouter /t REG_DWORD /d 1 /f
```

然后重启电脑使其生效。

### 转发配置

```bat
使用 netsh 将本地 8080 端口的流量转发到 192.168.1.100:80
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=80 connectaddress=192.168.1.100


查看当前端口转发规则
netsh interface portproxy show all


删除指定端口转发
netsh interface portproxy delete v4tov4 listenport=8080 listenaddress=0.0.0.0


测试转发是否生效
netstat -ano | findstr :8080
```

### 防火墙配置

防火墙要允许端口可以被访问

```bat
netsh advfirewall firewall add rule name="Allow Port 8080" dir=in action=allow protocol=TCP localport=8080
```
