---
title: 基于Ubuntu的软路由搭建记录
categories:
  - 工具
tags:
  - ubuntu
  - 软路由
cover: 'https://static.zahui.fan/images/202212192147769.png'
abbrlink: cfedbd03
date: 2022-12-16 16:41:30
---

## 前言

我一直使用的是斐讯 k3 这款万元路由器😂，一直用的是 openwrt，不过 openwrt 信号真心不好，刷回官方 root 系统，感觉重获了新生，然后决定路由器只做 WiFi 共享，其他功能交给软路由。
我的软路由是买的双网口机器，j4125 的 cpu 做软路由绰绰有余了, 东西如图:

![双网口软路由|431](https://static.zahui.fan/images/202212192147769.png)

系统使用的是 ubuntu22.04，以下步骤都以此系统为基础进行，网络拓扑如下：

![网络拓扑](https://static.zahui.fan/images/202212191312730.png)

我自己定义的网段，网段不可以有交叉。

| 设备       | LAN 网段        | WAN 配置              |
| ---------- | -------------- | -------------------- |
| 光猫       | 192.168.1.0/24 | 拨号上网             |
| 软路由     | 192.168.3.0/24 | DHCP 自动获取地址     |
| 斐讯路由器 | 192.168.2.0/24 | 固定 IP，固定网关地址 |

## 定义内外网

| 网卡设备名 | 定义 |
| ---------- | ---- |
| enp1s0     | 外网 |
| enp2s0     | 内网 |

那么 给外网网卡设置 dhcp，从光猫自动获取 ip，也可以手动设置 ip
内网网卡固定个 ip，不用设置网关和 dns，配置文件如下

vim /etc/netplan/00-installer-config.yaml

```yml
network:
  ethernets:
    enp1s0:
      dhcp4: true
      dhcp6: true
    enp2s0:
      addresses: [ 192.168.3.1/24 ]
  version: 2
```

验证：`ip a` 看下两张网卡是否都有了 ip，在软路由里执行 `curl baidu.com` 看看是否可以上网

## 完成路由功能

### 关闭 ufw

```bash
systemctl disable --now ufw
```

### 加载 nf_conntrack 模块

vim /etc/modules-load.d/custom-modules.conf

```conf
# Located in /etc/modules-load.d/custom-modules.conf
nf_conntrack
```

lsmod 查看有没有加载此模块， nf_conntrack 用于跟踪 iptables 规则。

### 修改内核参数

vim /etc/sysctl.d/99-forward.conf

```conf
# Located in /etc/sysctl.d/99-forward.conf
net.ipv4.ip_forward=1
net.ipv4.conf.all.forwarding=1
net.ipv4.conf.default.forwarding=1
net.ipv4.conf.all.route_localnet=1

net.ipv6.conf.all.forwarding=1
net.ipv6.conf.default.forwarding=1
```

### iptables 脚本

```bash
#!/bin/bash
# /data/firewall-set.sh

# 根据你的WAN网卡名称对应修改！！！
WAN_NAME='enp1s0'

# IPv4设置
iptables -t nat -N mt_rtr_4_n_rtr
iptables -t nat -A POSTROUTING -j mt_rtr_4_n_rtr
iptables -t nat -A mt_rtr_4_n_rtr -o ${WAN_NAME} -j MASQUERADE # 添加路由到作为WAN的网卡的自动源地址转换规则

# 添加IPv4转发优化规则
iptables -t mangle -N mt_rtr_4_m_rtr 
iptables -t mangle -A FORWARD -j mt_rtr_4_m_rtr
iptables -t mangle -A mt_rtr_4_m_rtr -o ${WAN_NAME} -p tcp -m tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu # 针对PPPoE链接的优化
iptables -t mangle -A mt_rtr_4_m_rtr -m state --state RELATED,ESTABLISHED -j ACCEPT # 允许已建立连接的数据包直接通过
iptables -t mangle -A mt_rtr_4_m_rtr -m conntrack --ctstate INVALID -j DROP
iptables -t mangle -A mt_rtr_4_m_rtr -p tcp -m tcp ! --tcp-flags FIN,SYN,RST,ACK SYN -m state --state NEW -j DROP
iptables -t mangle -A mt_rtr_4_m_rtr -p tcp -m tcp --tcp-flags FIN,SYN,RST,PSH,ACK,URG FIN,SYN,RST,PSH,ACK,URG -j DROP
iptables -t mangle -A mt_rtr_4_m_rtr -p tcp -m tcp --tcp-flags FIN,SYN,RST,PSH,ACK,URG NONE -j DROP
iptables -t mangle -A mt_rtr_4_m_rtr -i br_lan -o ${WAN_NAME} -j ACCEPT

# IPv6 NAT设置，与IPv4基本一致
ip6tables -t nat -N mt_rtr_6_n_rtr
ip6tables -t nat -A POSTROUTING -j mt_rtr_6_n_rtr
ip6tables -t nat -A mt_rtr_6_n_rtr -o ${WAN_NAME} -j MASQUERADE # 添加路由到作为WAN的网卡的自动源地址转换规则

# 添加IPv6转发优化规则
ip6tables -t mangle -N mt_rtr_6_m_rtr
ip6tables -t mangle -A FORWARD -j mt_rtr_6_m_rtr
ip6tables -t mangle -A mt_rtr_6_m_rtr -o ${WAN_NAME} -p tcp -m tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu
ip6tables -t mangle -A mt_rtr_6_m_rtr -m state --state RELATED,ESTABLISHED -j ACCEPT
ip6tables -t mangle -A mt_rtr_6_m_rtr -m conntrack --ctstate INVALID -j DROP
ip6tables -t mangle -A mt_rtr_6_m_rtr -p tcp -m tcp ! --tcp-flags FIN,SYN,RST,ACK SYN -m state --state NEW -j DROP
ip6tables -t mangle -A mt_rtr_6_m_rtr -p tcp -m tcp --tcp-flags FIN,SYN,RST,PSH,ACK,URG FIN,SYN,RST,PSH,ACK,URG -j DROP
ip6tables -t mangle -A mt_rtr_6_m_rtr -p tcp -m tcp --tcp-flags FIN,SYN,RST,PSH,ACK,URG NONE -j DROP
ip6tables -t mangle -A mt_rtr_6_m_rtr -i br_lan -o ${WAN_NAME} -j ACCEPT
```

以下步骤二选一：
1. 开机执行此脚本
2. 使用 `iptables-persistent` 进行持久化配置: `sudo apt install iptables-persistent` root 身份运行脚本， 然后执行 `netfilter-persistent save`

验证： 连接斐讯路由器， 路由器 WAN 口 IP 配置成 `192.168.3.2`，WAN 口网关配置成 `192.168.3.1`，WAN 口 DNS 配置成 `114.114.114.114`，检查通过斐讯路由器是否可以上网

## 部署 DHCP 服务（可选）

部署 DHCP 服务可以自动分配 IP，省去手动设置 IP 的烦恼，比如上一步的斐讯路由器手动配置 WAN 口 IP，有了 DHCP 后设置 WAN 口 DHCP 获取 IP 即可。另外如果路由器设置成 AP 模式， 可以利用软路由上面的 DHCP 来给客户端分配 IP 地址。

### 安装 DNSMASQ

```bash
sudo apt install dnsmasq
```

### 修改配置文件

dnsmasq 的 dns 服务和 systemd-resolved.service 冲突（都占用 udp53 端口），所以需要关闭 systemd-resolved.service 或者 dnsmasq 的 dns 服务。这里关闭 dnsmasq 的 dns 服务

注意：/etc/dnsmasq.d 里面的其他文件不要有冲突的配置项，同一项配置注意删除只保留一个。

cat /etc/dnsmasq.d/router.conf

```ini
# 监听的网卡
interface=enp2s0

# DHCP分配地址的范围、掩码、租期等
dhcp-range=192.168.3.50,192.168.3.150,255.255.255.0,12h

# 通过MAC地址手动绑定IP
dhcp-host=11:22:33:44:55:66,192.168.3.60

# DHCP分配DNS服务器地址配置
dhcp-option=option:dns-server,192.168.3.1,114.114.114.114

# 关闭DNS解析服务
port=0
```

### 查看租期

```bash
cat /var/lib/misc/dnsmasq.leases
```

## 路由器使用 AP 模式 (可选)

使用 AP 模式就是不使用任何路由器的管理功能， 仅仅当作一个发射 WIFI 的工具，DNS 和 DHCP 都由软路由来提供， 配置上面的 DNSMASQ 来实现。

路由器上如果有 AP 模式选项， 则开启后， 网线插入 LAN 口， 如果没有 AP 模式选项， 则关闭路由器的 DHCP 服务，然后网线插入 LAN 口来使用。

## 优化: 开启 TCP BBR

> BBR 不开启也不影响使用

内核版本大于 4.9 默认都是集成了 BBR 模块的, 直接通过修改内核参数的方式来开启即可.

vim sysctl.d/99-bbr.conf

```conf
net.core.default_qdisc=fq
net.ipv4.tcp_congestion_control=bbr
```

```bash
sysctl -p
```

查看, 如果结果中包含 bbr, 则说明已开启

```bash
sysctl net.ipv4.tcp_available_congestion_control
lsmod | grep bbr
```

## 代理工具配置

透明代理我用的是 v2ray 这个涉及服务端和客户端。

### 服务端

#### v2ray 服务端配置

```json
{
  "inbounds": [
    {
      "port": 2333,
      "protocol": "vmess",
      "settings": {
        "clients": [
          {
            "id": "这里使用uuidgen自动生成",
            "alterId": 64
          }
        ]
      },
      "streamSettings": {
        "network": "ws",
        "wsSettings": {
        "path": "这里自定义一个location, 比如 /xxx "
        }
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom",
      "settings": {}
    }
  ]
}
```

#### nginx 反代配置

```conf
upstream v2ray {
  server v2ray:2333;        # 指向v2ray的端口
}
server {
  listen 80;
  listen [::]:80;
  listen 443 ssl;
  listen [::]:443 ssl;
  server_name 你的域名;
  client_max_body_size 1024m;

  ssl_certificate         ssl/你的证书位置.crt;
  ssl_certificate_key     ssl/你的私钥位置.key;
  ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
  ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;
  ssl_prefer_server_ciphers on;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 10m;
  error_page 497  https://$host$request_uri;

  if ( $scheme = http ){
      rewrite ^(/.*)$ https://$host$1 permanent;
  }

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }


    location /xxx {                   # 和上面的path保持一致
        proxy_pass http://v2ray;
        proxy_redirect off;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $http_host;

    }
}
```

### 客户端

```json
{
  "inbounds": [
    {
      "tag":"transparent",
      "port": 12345,
      "protocol": "dokodemo-door",
      "settings": {
        "network": "tcp,udp",
        "followRedirect": true
      },
      "sniffing": {
        "enabled": true,
        "destOverride": [
          "http",
          "tls"
        ]
      },
      "streamSettings": {
        "sockopt": {
          # "tproxy": "redirect",
          "tproxy": "tproxy", // 透明代理使用 TPROXY 方式
          "mark":255
        }
      }
    },
    {
      "port": 1080,
      "protocol": "socks", // 入口协议为 SOCKS 5
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls"]
      },
      "settings": {
        "auth": "noauth"
      }
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "protocol": "vmess", // 代理服务器
      "settings": {
        "vnext": [
          {
            "address": "aria2.babudiu.com",
            "port": 443,
            "users": [
              {
                "id": "你的服务端的uuid",         // 调整和你服务端相同的uuid
                "alterId": 0,
                "security": "auto"
              }
            ]
          }
        ]
      },
      "streamSettings": {
        "network": "ws",
        "security": "tls",
        "tlsSettings": {
          "allowInsecure": false
        },
        "sockopt": {
          "mark": 255
        },
        "wsSettings": {
          "path": "/xxx"          // 调整和你服务端相同的路径
        }
      },
      "mux": {
        "enabled": true,
        "concurrency": 8
      }
    },
    {
      "tag": "direct",
      "protocol": "freedom",
      "settings": {
        "domainStrategy": "UseIP"
      },
      "streamSettings": {
        "sockopt": {
          "mark": 255
        }
      }
    },
    {
      "tag": "block",
      "protocol": "blackhole",
      "settings": {
        "response": {
          "type": "http"
        }
      }
    },
    {
      "tag": "dns-out",
      "protocol": "dns",
      "streamSettings": {
        "sockopt": {
          "mark": 255
        }
      }
    }
  ],
  "dns": {
    "servers": [
      {
        "address": "223.5.5.5", //中国大陆域名使用阿里的 DNS
        "port": 53,
        "domains": [
          "geosite:cn",
          "ntp.org",   // NTP 服务器
          "a.com" // 此处改为你 VPS 的域名
        ]
      },
      {
        "address": "114.114.114.114", //中国大陆域名使用 114 的 DNS (备用)
        "port": 53,
        "domains": [
          "geosite:cn",
          "ntp.org",   // NTP 服务器
          "a.com" // 此处改为你 VPS 的域名
        ]
      },
      {
        "address": "8.8.8.8", //非中国大陆域名使用 Google 的 DNS
        "port": 53,
        "domains": [
          "geosite:geolocation-!cn"
        ]
      },
      {
        "address": "1.1.1.1", //非中国大陆域名使用 Cloudflare 的 DNS
        "port": 53,
        "domains": [
          "geosite:geolocation-!cn"
        ]
      }
    ]
  },
  "routing": {
    "domainStrategy": "IPOnDemand",
    "rules": [
      { // 劫持 53 端口 UDP 流量，使用 V2Ray 的 DNS
        "type": "field",
        "inboundTag": [
          "transparent"
        ],
        "port": 53,
        "network": "udp",
        "outboundTag": "dns-out"
      },
      { // 直连 123 端口 UDP 流量（NTP 协议）
        "type": "field",
        "inboundTag": [
          "transparent"
        ],
        "port": 123,
        "network": "udp",
        "outboundTag": "direct"
      },
      {
        "type": "field",
        "ip": [
          // 设置 DNS 配置中的国内 DNS 服务器地址直连，以达到 DNS 分流目的
          "223.5.5.5",
          "114.114.114.114"
        ],
        "outboundTag": "direct"
      },
      {
        "type": "field",
        "ip": [
          // 设置 DNS 配置中的国外 DNS 服务器地址走代理，以达到 DNS 分流目的
          "8.8.8.8",
          "1.1.1.1"
        ],
        "outboundTag": "proxy" // 改为你自己代理的出站 tag
      },
      { // 广告拦截
        "type": "field",
        "domain": [
          "geosite:category-ads-all"
        ],
        "outboundTag": "block"
      },
      { // BT 流量直连
        "type": "field",
        "protocol":["bittorrent"],
        "outboundTag": "direct"
      },
      { // 直连中国大陆主流网站 ip 和 保留 ip
        "type": "field",
        "ip": [
          "geoip:private",
          "geoip:cn",
          // 需要把服务器的IP加入直连名单
          "2.2.2.2"
        ],
        "outboundTag": "direct"
      },
      { // 直连中国大陆主流网站域名
        "type": "field",
        "domain": [
          "geosite:cn",
          // 需要把服务器的域名加入直连名单
          "v2ray_server.com"
        ],
        "outboundTag": "direct"
      }
    ]
  }
}
```

对应的启动 `systemd`service 内容为:

```ini
[Unit]
Description=V2Ray Service
Documentation=https://www.v2fly.org/
After=network.target nss-lookup.target

[Service]
User=root
ExecStart=/data/v2ray/v2ray run -config /data/v2ray/config.json
Restart=on-failure
RestartPreventExitStatus=23
LimitNPROC=500
LimitNOFILE=1000000

[Install]
WantedBy=multi-user.target
```

测试： 在软路由上执行 `curl --socks5 localhost:1080 google.com` 如果可以访问，说明配置成功。接下来配置透明代理

### 透明代理

> 参考文章: <https://toutyrater.github.io/app/tproxy.html>

#### 创建 `tproxy.sh` 脚本

```bash
#!/bin/bash

# 设置策略路由
ip rule add fwmark 1 table 100
ip route add local 0.0.0.0/0 dev lo table 100

# 代理局域网设备
iptables -t mangle -N V2RAY
iptables -t mangle -A V2RAY -d 127.0.0.1/32 -j RETURN
iptables -t mangle -A V2RAY -d 224.0.0.0/4 -j RETURN
iptables -t mangle -A V2RAY -d 255.255.255.255/32 -j RETURN
iptables -t mangle -A V2RAY -d 192.168.0.0/16 -p tcp -j RETURN # 直连局域网，避免 V2Ray 无法启动时无法连网关的 SSH，如果你配置的是其他网段（如 10.x.x.x 等），则修改成自己的
iptables -t mangle -A V2RAY -d 192.168.0.0/16 -p udp ! --dport 53 -j RETURN # 直连局域网，53 端口除外（因为要使用 V2Ray 的 DNS)
iptables -t mangle -A V2RAY -j RETURN -m mark --mark 0xff    # 直连 SO_MARK 为 0xff 的流量(0xff 是 16 进制数，数值上等同与上面V2Ray 配置的 255)，此规则目的是解决v2ray占用大量CPU（https://github.com/v2ray/v2ray-core/issues/2621）
iptables -t mangle -A V2RAY -p udp -j TPROXY --on-ip 127.0.0.1 --on-port 12345 --tproxy-mark 1 # 给 UDP 打标记 1，转发至 12345 端口
iptables -t mangle -A V2RAY -p tcp -j TPROXY --on-ip 127.0.0.1 --on-port 12345 --tproxy-mark 1 # 给 TCP 打标记 1，转发至 12345 端口
iptables -t mangle -A PREROUTING -j V2RAY # 应用规则

# 代理网关本机
iptables -t mangle -N V2RAY_MASK
iptables -t mangle -A V2RAY_MASK -d 224.0.0.0/4 -j RETURN
iptables -t mangle -A V2RAY_MASK -d 255.255.255.255/32 -j RETURN
iptables -t mangle -A V2RAY_MASK -d 192.168.0.0/16 -p tcp -j RETURN # 直连局域网
iptables -t mangle -A V2RAY_MASK -d 192.168.0.0/16 -p udp ! --dport 53 -j RETURN # 直连局域网，53 端口除外（因为要使用 V2Ray 的 DNS）
iptables -t mangle -A V2RAY_MASK -j RETURN -m mark --mark 0xff    # 直连 SO_MARK 为 0xff 的流量(0xff 是 16 进制数，数值上等同与上面V2Ray 配置的 255)，此规则目的是避免代理本机(网关)流量出现回环问题
iptables -t mangle -A V2RAY_MASK -p udp -j MARK --set-mark 1   # 给 UDP 打标记，重路由
iptables -t mangle -A V2RAY_MASK -p tcp -j MARK --set-mark 1   # 给 TCP 打标记，重路由
iptables -t mangle -A OUTPUT -j V2RAY_MASK # 应用规则

# 新建 DIVERT 规则，避免已有连接的包二次通过 TPROXY，理论上有一定的性能提升
iptables -t mangle -N DIVERT
iptables -t mangle -A DIVERT -j MARK --set-mark 1
iptables -t mangle -A DIVERT -j ACCEPT
iptables -t mangle -I PREROUTING -p tcp -m socket -j DIVERT
```

#### 创建清理 iptables 脚本 `clean_iptables.sh`

```bash
#!/bin/bash

iptables -t mangle -F
iptables -t mangle -X V2RAY
iptables -t mangle -X V2RAY_MASK
```

执行 `tproxy.sh` 即可开启透明代理

#### 优化一下 systemd

```ini
[Unit]
Description=V2Ray Service
Documentation=https://www.v2fly.org/
After=network.target nss-lookup.target

[Service]
User=root
ExecStartPre=/data/v2ray/tproxy.sh
ExecStart=/data/v2ray/v2ray run -config /data/v2ray/config.json
ExecStopPost=/data/v2ray/clean_iptables.sh
Restart=on-failure
RestartPreventExitStatus=23

[Install]
WantedBy=multi-user.target
```