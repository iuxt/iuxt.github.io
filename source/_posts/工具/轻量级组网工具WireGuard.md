---
title: 轻量级组网工具WireGuard
categories:
  - 工具
tags: [网络, VPN]
abbrlink: t22j7t
date: 2025-09-04 22:35:52
cover: ""
updated: 2025-09-05 23:03:45
---

要先打开服务器的内核转发：`net.ipv4.ip_forward = 1`
假设 WireGuard 自身的虚拟网段是 `10.8.0.0/24`, 给服务器分配的 IP 是：`10.8.0.1`，服务器的公网 IP 是：`124.221.31.148`

## 服务器基础配置

```bash
# Ubuntu安装 WireGuard
sudo apt-get install -y wireguard

# CentOS 安装 WireGuard
sudo yum install -y wireguard-tools

# 开启内核转发
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
sysctl -p

# 配置目录创建
mkdir -p /etc/wireguard
cd /etc/wireguard
umask 077
```

## 生成公私钥对

先生成一些公私钥对，服务器需要 1 个，每个客户端 1 个。

```bash
# 生成服务器公私钥
wg genkey > server_privatekey
wg pubkey < server_privatekey > server_publickey

# Client1 的公私钥和预共享密钥
wg genkey > client1_privatekey
wg pubkey < client1_privatekey > client1_publickey
wg genpsk > client1_preSharedKey

# Client2 的公私钥和预共享密钥
wg genkey > client2_privatekey
wg pubkey < client2_privatekey > client2_publickey
wg genpsk > client2_preSharedKey
```

那么服务器的配置文件 `wg0.conf`:

```bash
echo "
# Server
[Interface]
PrivateKey = $(cat server_privatekey)
Address = 10.8.0.1/24
ListenPort = 51820
MTU = 1420
PreUp =
PostUp = iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE
PostUp = iptables -A INPUT -p udp -m udp --dport 51820 -j ACCEPT
PostUp = iptables -A FORWARD -i %i -j ACCEPT
PostUp = iptables -A FORWARD -o %i -j ACCEPT
PreDown =
PostDown = iptables -t nat -D POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE
PostDown = iptables -D INPUT -p udp -m udp --dport 51820 -j ACCEPT
PostDown = iptables -D FORWARD -i %i -j ACCEPT
PostDown = iptables -D FORWARD -o %i -j ACCEPT

# Client 1
[Peer]
PublicKey = $(cat client1_publickey)
PresharedKey = $(cat client1_preSharedKey)
AllowedIPs = 10.8.0.2/32, 192.168.1.0/24

# Client 2
[Peer]
PublicKey = $(cat client2_publickey)
PresharedKey = $(cat client2_preSharedKey)
AllowedIPs = 10.8.0.3/32" > wg0.conf
```

- AllowedIPs 表示这些 IP/段，发送到这个 Peer 上。

设置开机自启动：

```bash
systemctl enable --now wg-quick@wg0
```

## Client 1 配置

```bash
echo "
[Interface]
PrivateKey = $(cat client1_privatekey)
Address = 10.8.0.2/24
DNS = 1.1.1.1
MTU = 1420

[Peer]
PublicKey = $(cat server_publickey)
PresharedKey = $(cat client1_preSharedKey)
AllowedIPs = 10.8.0.0/24
PersistentKeepalive = 0
Endpoint = 124.221.31.148:51820 " > client1.conf
```

- AllowedIPs 表示这些 IP/段，发送到这个 Peer 上。
- Endpoint 是这个 Peer 的入口，这里配置的就是服务器的端口。

## Client 2 配置

```bash
echo "
[Interface]
PrivateKey = $(cat client2_privatekey)
Address = 10.8.0.3/24
DNS = 1.1.1.1
MTU = 1420

[Peer]
PublicKey = $(cat server_publickey)
PresharedKey = $(cat client2_preSharedKey)
AllowedIPs = 10.8.0.0/24
PersistentKeepalive = 0
Endpoint = 124.221.31.148:51820 " > client2.conf
```

## 常用操作

```bash
# 启动WireGuard
wg-quick up wg0

# 停止WireGuard
wg-quick down wg0

# 查看状态
wg

# 重启WireGuard
wg-quick down wg0 && wg-quick up wg0 && wg
```

wg-quick 可以自动创建网卡

## 实际案例

从 client1 可以直接访问 client2 的虚拟 IP：根据 AllowIPs 配置，client1 的所有流量都会转发给 server，server 接收到请求 10.8.0.3 的流量，根据 server 的 AllowIPs 配置，转发给了 client2，回包同理。
![image.png|776](https://s3.babudiu.com/iuxt/2025/09/9218825ab5b76337fa0bbae5a24e3c8c.png)

如果想打通两个内网，需要将对方的内网 IP 段添加到 AllowIPs 列表里。并且在内网机器上添加路由。

| 名称     | 说明          |
| ------ | ----------- |
| 机器 A IP | 10.0.1.3/24 |
| 机器 B IP | 10.0.2.3/24 |

### 机器 A

```conf
# /etc/wireguard/wg0.conf on Server A
[Interface]
Address = 10.200.200.1/24
ListenPort = 51820
PrivateKey = <Server_A_Private_Key>
# Enable IP forwarding
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
# Server B
PublicKey = <Server_B_Public_Key>
AllowedIPs = 10.200.200.2/32, 10.0.2.0/24 # 关键：包含对端内网网段
Endpoint = 10.0.2.3:51820
PersistentKeepalive = 25
```

如果机器 A 是内网的网关，那么它就已经是默认路由了。否则机器 A 局域网内的其他机器需要手动添加一条路由规则：

```bash
# Linux
sudo ip route add 10.0.2.0/24 via 10.0.2.3

# Windows (以管理员身份运行 PowerShell)
route add 10.0.2.0 mask 255.255.255.0 10.0.2.3
```

### 机器 B

和 A 同理。
