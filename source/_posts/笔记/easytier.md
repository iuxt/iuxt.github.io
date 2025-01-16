---
date: 2025-01-15 22:46:05
updated: 2025-01-16 15:50:38
---

服务端：

```bash
docker rm -f easytier
docker run --name easytier -d \
    --network host \
    -e TZ=Asia/Shanghai \
    --privileged \
    registry.cn-hangzhou.aliyuncs.com/iuxt/easytier:v2.1.2 \
    --ipv4 10.233.233.1 --network-name iuxt --network-secret 6d062b06-e3bb-40ab-849c-a4e5bc19b7ee --vpn-portal wg://0.0.0.0:11013/10.14.14.0/24

sleep 2
docker logs easytier -f

```

生成 WireGuard 配置文件

```bash
docker exec easytier easytier-cli vpn-portal > wireguard.conf


[Interface]
PrivateKey = h3MxzS7aLWDlX6l1xAJA8wooj58N0lg6UPV+n2q7FkM=
Address = 10.14.14.10/32

[Peer]
PublicKey = Mp7H/sHXZW+NqxrtsPnEtHMWIbFWPYjyxEir3uWY3WA=
AllowedIPs = 10.233.233.0/24,10.14.14.0/24
Endpoint = 119.45.171.27:11013
PersistentKeepalive = 25
```

安装服务：

```bash
easytier-cli.exe service install --ipv4 10.233.233.3 --network-name iuxt --network-secret 6d062b06-e3bb-40ab-849c-a4e5bc19b7ee -n 192.168.22.0/24 -n 192.168.1.0/24 -p tcp://119.45.171.27:11010
```

thinkbook：

```bash
easytier-core.exe --ipv4 10.233.233.2 --network-name iuxt --network-secret 6d062b06-e3bb-40ab-849c-a4e5bc19b7ee -p tcp://119.45.171.27:11010
```

3865u

```bat
easytier-core.exe --ipv4 10.233.233.3 --network-name iuxt --network-secret 6d062b06-e3bb-40ab-849c-a4e5bc19b7ee -n 192.168.22.0/24 -n 192.168.1.0/24 -p tcp://119.45.171.27:11010
```

mechrevo

```bash
easytier-core.exe --ipv4 10.233.233.4 --network-name iuxt --network-secret 6d062b06-e3bb-40ab-849c-a4e5bc19b7ee -p tcp://119.45.171.27:11010
```

群晖
可以加多个 -n 参数指定多个网段。

```bash
docker run --name easytier -d \
    --network host \
    -e TZ=Asia/Shanghai \
    --privileged \
    registry.cn-hangzhou.aliyuncs.com/iuxt/easytier:v2.1.2 \
    --ipv4 10.233.233.11 --network-name iuxt --network-secret 6d062b06-e3bb-40ab-849c-a4e5bc19b7ee -n 192.168.1.0/24 -p tcp://119.45.171.27:11010
```
