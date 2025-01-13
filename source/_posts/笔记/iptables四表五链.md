---
date: 2025-01-09 17:49:27
updated: 2025-01-13 16:15:01
---

![image.png](https://static.zahui.fan/images/20250109175012013.png)

<https://www.cnblogs.com/zhujingzhi/p/9706664.html>

```bash
## ip映射

eth0 外网
eth1 内网


ip addr add 10.0.0.100/24 dev eth0

# 首先，对防火墙接收到的目的ip为202.110.123.100和202.110.123.200的所有数据包进行目的NAT(DNAT):
iptables -t nat -A PREROUTING -i eth0 -d 10.0.0.100 -j DNAT --to 192.168.10.3

# 其次，对防火墙接收到的源ip地址为192.168.1.100和192.168.1.200的数据包进行源NAT(SNAT):
iptables -t nat -A POSTROUTING -o eth0 -s 192.168.10.3 -j SNAT --to 10.0.0.100

```
