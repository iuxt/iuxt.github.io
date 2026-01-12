---
title: 开源组网工具-easytier
categories:
  - 工具
tags: [网络]
abbrlink: sq6bmc
date: 2024-01-16 16:59:00
cover: ""
updated: 2025-08-13 10:02:50
---

这个工具是利用 NAT 打洞实现，需要有一台服务器（可以自建也可以用官方提供的）做中介。经测试打洞成功率很高，速度也不错。打洞成功后，异地的机器就像在同一个内网一样方便，访问 smb、家里的 nas、远程桌面等等，并且支持自动对内网网段进行转发（zerotier 需要配置 iptables 转发）自建服务器后感觉比 zerotier 好用。zerotier 的文档可以看 [群晖NAS部署zerotier内网穿透访问](/posts/spi492/)

附上官方的配置文件生成工具：<https://easytier.cn/web/index.html#/config_generator>

## 自建服务端

这个步骤可以省略，不自建可以用社区提供的免费服务器。一个官方服务器地址：`uri = "tcp://public.easytier.top:11010"`

我安装的是 easytier 的 docker 版本。

### config.toml

```toml
# hostname可以省略，默认是计算机名
hostname = "guanyu"

# 当前节点的虚拟IP，不同节点IP不一样。
ipv4 = "10.233.233.1/24"
dhcp = false
listeners = [
    "tcp://0.0.0.0:11010",
    "udp://0.0.0.0:11010",
    "wg://0.0.0.0:11011",
]
rpc_portal = "0.0.0.0:0"

# 这两个配置相当于账号和密码，用于标识网络，所有节点保持一致才能相互访问。
[network_identity]
network_name = "你的网络名称，同一个网络保持一致"
network_secret = "你自己的网络secret，同一个网络保持一致"

# wireguard配置，iPhone不支持easytier，可以借助wireguard来访问。
[vpn_portal_config]
client_cidr = "10.14.14.0/24"
wireguard_listen = "0.0.0.0:11013"

[flags]
# 虚拟网卡名
dev_name = "easytier"
enable_kcp_proxy = true
```

### 启动命令

```toml
#!/bin/bash
set -euo pipefail

docker rm -f easytier
docker run --name easytier -d \
    --network host \
    -e TZ=Asia/Shanghai \
    --mount type=bind,source=./config.toml,target=/app/config.toml,readonly \
    --privileged \
    --restart=always \
    easytier/easytier:v2.5.0 \
    -c /app/config.toml
```

### 生成 WireGuard 配置文件

```bash
# 在服务器上执行
docker exec easytier easytier-cli vpn-portal > wireguard.conf
```

生成的配置文件需要做如下修改：

```ini
[Interface]
PrivateKey = h3MxzS7aLWDlX6l1xAJA8wooj58N0lg6UPV+n2q7FkM=
Address = 10.14.14.10/32                        # 这里修改成本机的虚拟IP

[Peer]
PublicKey = Mp7H/sHXZW+NqxrtsPnEtHMWIbFWPYjyxEir3uWY3WA=
AllowedIPs = 10.233.233.0/24,10.14.14.0/24      # 这些网段走wireguard转发
Endpoint = <服务器的IP>:11013                   # 服务器的wireguard接口地址
PersistentKeepalive = 25
```

修改完成后，导入客户端即可使用。

## MacBook

### config.toml

```toml
hostname = "MacBook"
ipv4 = "10.233.233.2/24"
dhcp = false
listeners = [
    "tcp://0.0.0.0:11010",
    "udp://0.0.0.0:11010",
    "wg://0.0.0.0:11011",
]
rpc_portal = "0.0.0.0:0"

[network_identity]
network_name = "你的网络名称，同一个网络保持一致"
network_secret = "你自己的网络secret，同一个网络保持一致"

[[peer]]
# 这里是服务器的地址
uri = "tcp://<服务器的IP>:11010"

[flags]
enable_kcp_proxy = true
```

### 启动命令

```bash
sudo easytier-core -c ./config.toml
```

## Windows 电脑

### config.toml

```toml
hostname = "SER6"
ipv4 = "10.233.233.4/24"
dhcp = false
listeners = [
    "tcp://0.0.0.0:11010",
    "udp://0.0.0.0:11010",
    "wg://0.0.0.0:11011",
]
rpc_portal = "0.0.0.0:0"

[network_identity]
network_name = "你的网络名称，同一个网络保持一致"
network_secret = "你自己的网络secret，同一个网络保持一致"

# 这里是需要代理的内网网段，后续可以远程访问这些内网地址。
[[proxy_network]]
cidr = "192.168.6.0/24"

[[proxy_network]]
cidr = "192.168.1.11/32"


[[peer]]
# 这里是服务器的地址
uri = "tcp://<服务器的IP>:11010"

[flags]
enable_kcp_proxy = true
```

### 安装成系统服务

安装成系统服务可以开机自启动，并且不会有执行的命令行界面。

```bash
# 指定参数安装成服务
easytier-cli.exe service install -c C:\app\easytier\config.toml

# 卸载服务
# easytier-cli.exe service uninstall
```

### Windows 防火墙配置

如果发现不能连接记得防火墙放通 easytier 的虚拟网段和 wireguard 网段。

```powershell
New-NetFirewallRule -DisplayName "Allow Subnet 10.233.233.0/24" -Direction Inbound -Action Allow -RemoteAddress 10.233.233.0/24 -Protocol Any -Enabled True
New-NetFirewallRule -DisplayName "Allow Subnet 10.14.14.0/24" -Direction Inbound -Action Allow -RemoteAddress 10.14.14.0/24 -Protocol Any -Enabled True
```

## 群晖 NAS

可以加多个 -n 参数指定多个网段。

```bash
docker run --name easytier -d \
    --network host \
    -e TZ=Asia/Shanghai \
    --privileged \
    registry.cn-hangzhou.aliyuncs.com/iuxt/easytier:v2.1.2 \
    --ipv4 10.233.233.11 --network-name <你的网络名称，同一个网络保持一致> --network-secret <你自己的网络secret，同一个网络保持一致> -n 192.168.1.0/24 -p tcp://<服务器的IP>:11010
```

参数说明：
- -n 这里写了内网的网段，意思是这个网段的 IP 通过这台机器来代理转发，在其他机器上可以直接访问这个网段的任意 IP

## OpenWrt 路由器

我用的是 <https://github.com/EasyTier/luci-app-easytier> 来生成配置文件，先 fork 仓库，然后进入 GitHub Actions 手动构建。

我的路由器 CPU 是 `mediatek/mt7981`，下载 `EasyTier-aarch64_cortex-a53-openwrt-22.03` 这个版本就行，不确定 CPU 架构可以问一下 ChatGPT，不用担心，错了会装不上。

![image.png|648](https://s3.babudiu.com/iuxt/images/20250506225112105.png)

在 VPN 下面，有个 EasyTier，使用配置文件启动即可。
