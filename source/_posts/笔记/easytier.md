---
date: 2025-01-15 22:46:05
updated: 2025-01-16 00:07:33
---

服务端：

```bash
docker rm -f easytier
docker run --name easytier -d \
    --network host \
    -e TZ=Asia/Shanghai \
    -v ./config:/root \
    --privileged \
    registry.cn-hangzhou.aliyuncs.com/iuxt/easytier:v2.1.2 \
    --ipv4 10.233.233.1 --network-name iuxt --network-secret 6d062b06-e3bb-40ab-849c-a4e5bc19b7ee --vpn-portal wg://0.0.0.0:11013/10.14.14.0/24

sleep 2
docker logs easytier -f

```

```bash

```

安装服务：

```bash
easytier-cli.exe service install --ipv4 10.233.233.3 --network-name iuxt --network-secret f0c78fa7-5501-495f-8dcb-ccd205f872e7 -n 192.168.22.0/24 -n 192.168.1.0/24 -p tcp://119.45.171.27:11010
```

thinkbook：

```bash
easytier-core.exe --ipv4 10.233.233.2 --network-name iuxt --network-secret f0c78fa7-5501-495f-8dcb-ccd205f872e7 -p tcp://119.45.171.27:11010
```

3865u

```bat
easytier-core.exe --ipv4 10.233.233.3 --network-name iuxt --network-secret f0c78fa7-5501-495f-8dcb-ccd205f872e7 -n 192.168.22.0/24 -n 192.168.1.0/24 -p tcp://119.45.171.27:11010
```
