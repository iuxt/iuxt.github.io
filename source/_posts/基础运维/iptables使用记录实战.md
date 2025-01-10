---
title: iptables使用记录实战
abbrlink: 5e8ed38b
categories:
  - 基础运维
tags: [iptables, 网络]
date: 2022-07-19 17:32:38
updated: 2025-01-10 16:37:48
---

## iptables 四表五链

四表五链：
链就是位置：共有五个 进路由 (PREROUTING)、进系统 (INPUT) 、转发 (FORWARD)、出系统 (OUTPUT)、出路由 (POSTROUTING)；
表就是存储的规则；数据包到了该链处，会去对应表中查询设置的规则，然后决定是否放行、丢弃、转发还是修改等等操作。

### 具体的四表

| 表      | 说明                            |
| ------ | ----------------------------- |
| filter | 过滤数据包                         |
| Nat    | 用于网络地址转换（IP、端口）               |
| Mangle | 修改数据包的服务类型、TTL、并且可以配置路由实现 QOS |
| Raw    | 决定数据包是否被状态跟踪机制处理              |

### 具体的五链

| 链           | 说明                                      |
| ----------- | --------------------------------------- |
| INPUT       | 进来的数据包应用此规则链中的策略                        |
| OUTPUT      | 外出的数据包应用此规则链中的策略                        |
| FORWARD     | 转发数据包时应用此规则链中的策略                        |
| PREROUTING  | 对数据包作路由选择前应用此链中的规则（所有的数据包进来的时侯都先由这个链处理） |
| POSTROUTING | 对数据包作路由选择后应用此链中的规则（所有的数据包出来的时侯都先由这个链处理） |

## 开启内核转发功能

{% tabs TabName %}

<!-- tab 临时开启 -->

```bash
sudo sysctl -w net.ipv4.ip_forward=1
```

或者

```bash
echo "1" > /proc/sys/net/ipv4/ip_forward
```

<!-- endtab -->

<!-- tab 永久开启 -->

```bash
sudo vim /etc/sysctl.conf

# 保证是这个配置
net.ipv4.ip_forward=1

# 立即生效
sudo sysctl -p
```

<!-- endtab -->
{% endtabs %}

## 使用案例

### 本地端口转发到本地端口

![image.png|631](https://static.zahui.fan/images/20250110160536647.png)

```bash
# 访问服务器的 2222 端口，转发到服务器的 22 端口
iptables -t nat -A PREROUTING -p tcp --dport 2222 -j REDIRECT --to-port 22
```

### 转发请求到其他主机

这是通过本主机做一个跳转，比如访问 `10.0.0.102` 的 80 端口转发到 `10.0.0.103` 的 8000 端口

![image.png|740](https://static.zahui.fan/images/20250110162930990.png)

```bash
# 在10.0.0.102（Server A）上执行

# 这个是进来的数据包（不包含自身发出的数据包，如果是自身发出，使用OUTPUT链），目的地址是 10.0.0.102 且端口是80 的数据包转发到 10.0.0.103:8000
iptables -t nat -A PREROUTING -4 -p tcp -d 10.0.0.102 --dport 80 -j DNAT --to-destination 10.0.0.103:8000

# 转发出去的数据包 目的地址是 10.0.0.103 端口是 8000 的数据包进行伪装（就是把数据包来源地址换成本机的ip，这样另一台机器回包才会回给自己）
iptables -t nat -A POSTROUTING -4 -p tcp -d 10.0.0.103 --dport 8000 -j MASQUERADE
```

上面操作完成后，可以使用从 client 请求 `10.0.0.102:80` , 但是 `Server A` 这台机器请求 `10.0.0.102:80` 不通，如果要实现 `Server A` 也可以访问 `10.0.0.102:80` 需要额外执行一下：

```bash
# 在10.0.0.102（Server A）上执行
iptables -t nat -A OUTPUT -4 -p tcp -d 10.0.0.102 --dport 80 -j DNAT --to-destination 10.0.0.103:8000
```

## 其他操作

| 操作        | 命令                          |
| --------- | --------------------------- |
| 查看 nat 表    | sudo iptables -t nat -L     |
| 清空 nat 表配置  | sudo iptables -t nat -F<br> |
| 查看 filter 表 | sudo iptables -L            |
| 清空 filter 表 | sudo iptables -F            |

### iptables 持久化

请看 [iptables进行持久化配置，重启不丢失](/posts/d8f4121a)
