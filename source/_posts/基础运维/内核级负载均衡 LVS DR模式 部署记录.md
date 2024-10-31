---
title: 内核级负载均衡 LVS DR模式 部署记录
abbrlink: 5fdc91d7
categories:
  - 基础运维
tags:
  - LoadBalance
  - 配置记录
  - Network
  - HA
  - keepalived
  - lvs
date: 2021-08-03 10:06:51
---

> DR 模式，Director 和 realserver 都在一个内网里面，他们都绑定上同一个 VIP, 原理是通过 Director Server 修改数据包的 MAC 地址， 所以得让 realserver 不响应 arp，不然肯定会造成内网 IP 冲突

规划：

| 机器          | IP        |
| ------------- | --------- |
| VIP           | 10.0.0.8  |
| director      | 10.0.0.41 |
| realserver1   | 10.0.0.42 |
| realserver2   | 10.0.0.43 |
| 网卡 interface | eth0      |

## RealServer 设置

### 创建虚拟网卡

个人习惯，可选，可以绑定在任何网卡上面

```bash
ip link add ipvs0 type dummy
```

### 配置不响应 ARP 请求

{% tabs ignore_arp %}
<!-- tab 方法1: 调整内核参数 -->

```bash
# 不响应ARP请求, 修改内核参数
echo "1" > /proc/sys/net/ipv4/conf/ipvs0/arp_ignore
echo "1" > /proc/sys/net/ipv4/conf/all/arp_ignore
echo "2" > /proc/sys/net/ipv4/conf/ipvs0/arp_announce
echo "2" > /proc/sys/net/ipv4/conf/all/arp_announce
```

<!-- endtab -->

<!-- tab 方法2: 采用arptables -->

```bash
arptables -A IN -d <virtual_ip> -j DROP
arptables-A OUT -s <virtual_ip> -j mangle --mangle-ip-s <real_ip>
```

> 上面的意思是：进来的 ARP，如果目的 IP 是 VIP 的，丢弃; 发出去的 ARP 包，如果源 IP 是 VIP 的，改成 realserver 的 IP。与内核 ARP 参数 arp_ignore=1,arp_announce=2 的作用是一样的。

```bash
# Disable arp requests on virtual_ip
arptables -I INPUT -j DROP -d 10.0.0.8
arptables -I OUTPUT -j mangle -s 10.0.0.8 --mangle-ip-s 10.0.0.42
```

> 特别注意：arptables 只是过虑了 ARP 广播包，如果手动绑定 IP 和 MAC，或者存在正确的 MAC 缓存，也是可以和主机通信的

<!-- endtab -->
{% endtabs %}

### 绑定 VIP

```bash
ip addr add 10.0.0.8/32 dev ipvs0
```

## Director 设置

### 添加 VIP

```bash
ip address add 10.0.0.8/24 dev eth0
```

### 配置 ipvs 规则

rr 是轮询

```bash
ipvsadm -A -t 10.0.0.8:80 -s rr
ipvsadm -a -t 10.0.0.8:80 -r 10.0.0.42:80 -g
ipvsadm -a -t 10.0.0.8:80 -r 10.0.0.43:80 -g
ipvsadm
```

## 使用脚本完成以上操作

### start_lvs_realserver.sh

```bash
VIP=10.0.0.8
REALIP=10.0.0.42

# Disable arp requests on virtual_ip
arptables -I INPUT -j DROP -d $VIP
arptables -I OUTPUT -j mangle -s $VIP --mangle-ip-s $REALIP

# Add vip after arptables is initialized
ip link add ipvs0 type dummy
ip addr add $VIP/32 brd + dev ipvs0
```

### stop_lvs_realserver.sh

```bash
VIP=10.0.0.8
REALIP=10.0.0.42

# stop realserver
ip addr del $VIP/32 brd + dev ipvs0
ip link del ipvs0
arptables -D INPUT -j DROP -d $VIP
arptables -D OUTPUT -j mangle -s $VIP --mangle-ip-s $REALIP
```

### start_lvs_directserver.sh

```bash
ip addr add 10.0.0.8 dev eth0
ipvsadm -A -t 10.0.0.8:80 -s rr
ipvsadm -a -t 10.0.0.8:80 -r 10.0.0.42:80 -g
ipvsadm -a -t 10.0.0.8:80 -r 10.0.0.43:80 -g
```

### stop_lvs_directserver.sh

```bash
ip addr del 10.0.0.8 dev eth0
ipvsadm -C
```

## 高可用方案

[使用keepalived完成LVS高可用](/posts/675d47a9)
