---
title: 开源组网工具-easytier
categories:
  - 工具
tags: [网络]
abbrlink: sq6bmc
date: 2024-01-16 16:59:00
cover: ""
updated: 2025-03-25 01:42:45
---

这个工具是利用 NAT 打洞实现，需要有一台服务器（可以自建也可以用官方提供的）做中介。经测试打洞成功率很高，速度也不错。打洞成功后，异地的机器就像在同一个内网一样方便，访问 smb、家里的 nas、远程桌面等等，并且支持自动对内网网段进行转发（zerotier 需要配置 iptables 转发）自建服务器后感觉比 zerotier 好用。zerotier 的文档可以看 [群晖NAS部署zerotier内网穿透访问](/posts/spi492/)

## 自建服务端

这个步骤可以省略，不自建可以用社区提供的免费服务器。使用社区服务器指定 `-p` 参数： `-p tcp://public.easytier.top:11010`

我安装的是 easytier 的 docker 版本。

```bash
docker rm -f easytier
docker run --name easytier -d \
    --network host \
    -e TZ=Asia/Shanghai \
    --privileged \
    registry.cn-hangzhou.aliyuncs.com/iuxt/easytier:v2.1.2 \
    --ipv4 10.233.233.1 --network-name iuxt --network-secret 6d062b06-e3bb-40ab-849c-a4e5bc19b7ee --vpn-portal wg://0.0.0.0:11013/10.14.14.0/24
```

参数说明：
- --ipv4 给服务器分配的虚拟 IP
- --network-name 网络名字
- --network-secret 是网络密钥，我这里使用的是生成的 uuid，这个密钥别人知道了也可以加入你的网络内，所以需要保护好。一个服务器可以让加入多个网络。
- --vpn-portal 允许 WireGuard 接入，`0.0.0.0:11013` 是监听地址，`10.14.14.0/24` 是 WireGuard 的网段。

## Windows 机器一

```bash
# -p 参数指定的是服务器的公网IP
easytier-core.exe --ipv4 10.233.233.2 --network-name iuxt --network-secret 6d062b06-e3bb-40ab-849c-a4e5bc19b7ee -p tcp://119.45.171.27:11010
```

## Windows 机器二

```bash
easytier-core.exe --ipv4 10.233.233.3 --network-name iuxt --network-secret 6d062b06-e3bb-40ab-849c-a4e5bc19b7ee -p tcp://119.45.171.27:11010
```

## 群晖 nas 部署

可以加多个 -n 参数指定多个网段。

```bash
docker run --name easytier -d \
    --network host \
    -e TZ=Asia/Shanghai \
    --privileged \
    registry.cn-hangzhou.aliyuncs.com/iuxt/easytier:v2.1.2 \
    --ipv4 10.233.233.11 --network-name iuxt --network-secret 6d062b06-e3bb-40ab-849c-a4e5bc19b7ee -n 192.168.1.0/24 -p tcp://119.45.171.27:11010
```

参数说明：
- -n 这里写了内网的网段，意思是这个网段的 IP 通过这台机器来代理转发，在其他机器上可以直接访问这个网段的任意 IP

## Windows 安装服务

```bash
# 指定参数安装成服务
easytier-cli.exe service install --ipv4 10.233.233.3 --network-name iuxt --network-secret 6d062b06-e3bb-40ab-849c-a4e5bc19b7ee -n 192.168.22.0/24 -n 192.168.1.0/24 -p tcp://119.45.171.27:11010

# 卸载服务
easytier-cli.exe service uninstall
```

## 生成 WireGuard 配置文件

```bash
# 在服务器上执行
docker exec easytier easytier-cli vpn-portal > wireguard.conf
```

```ini
[Interface]
PrivateKey = h3MxzS7aLWDlX6l1xAJA8wooj58N0lg6UPV+n2q7FkM=
Address = 10.14.14.10/32    # 这里修改成本机的虚拟IP

[Peer]
PublicKey = Mp7H/sHXZW+NqxrtsPnEtHMWIbFWPYjyxEir3uWY3WA=
AllowedIPs = 10.233.233.0/24,10.14.14.0/24      # 这些网段走wireguard转发
Endpoint = 119.45.171.27:11013                  # 服务器的wireguard接口地址
PersistentKeepalive = 25
```

## windows 防火墙配置

不能连接记得防火墙放通 easytier 的虚拟网段和 wireguard 网段。

```powershell
New-NetFirewallRule -DisplayName "Allow Subnet 10.233.233.0/24" -Direction Inbound -Action Allow -RemoteAddress 10.233.233.0/24 -Protocol Any -Enabled True
New-NetFirewallRule -DisplayName "Allow Subnet 10.14.14.0/24" -Direction Inbound -Action Allow -RemoteAddress 10.14.14.0/24 -Protocol Any -Enabled True
```
