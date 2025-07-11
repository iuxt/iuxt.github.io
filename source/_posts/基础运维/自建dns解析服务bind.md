---
title: 自建dns解析服务bind9
categories:
  - 基础运维
tags:
  - 配置记录
  - 开源软件
  - DNS
abbrlink: sf0bjv
cover: 'https://s3.babudiu.com/iuxt/images/202406131712673.png'
date: 2023-06-13 15:02:18
---

## 安装

```bash
yum install bind
```

我是 `AlmaLinux 9` 安装的是 `9.16.23` 版本

## 修改主配置文件

### 修改监听地址

默认监听地址为 `127.0.0.1` 需要对外提供服务，修改监听地址，可以改成本机内网 ip，也可以直接修改成 any， 表示任意接口都监听。

`vim /etc/named.conf`

```conf
listen-on port 53 { any; };
...
allow-query     { any; };
```

### 去掉默认配置

`vim /etc/named.conf`

下面这几行配置我是直接注释掉的

```conf
/*
zone "." IN {
      type hint;
      file "named.ca";
};

include "/etc/named.rfc1912.zones";
include "/etc/named.root.key";
*/
```

### 增加 zone 配置

放在 `/etc/named.conf` 文件最后面

```conf
/* 设置默认上游DNS，本地解析不了的域名从上游获取 */
zone "." {
    type forward;
    forwarders { 114.114.114.114; 119.29.29.29; };
};

/* 正向查找 i.com 从 i.com 这个文件里查找 */
zone "i.com" IN {
	type master;
    file "i.com";
};

/* 反向查找 ip地址 10 开头的 从 i.loopback 里查找 */
zone "10.IN-ADDR.ARPA" {
    type master;
    file "i.loopback";
};

```

## zone 配置

`vim /var/named/i.com`

```conf
$ORIGIN i.com.
$TTL 4h

i.com.    IN      SOA     ns1.i.com. admin.i.com. (
                                2022021101  ; serial number YYMMDDNN
                                1d          ; Slave Refresh
                                1h          ; Slave Retry Time in case of a problem
                                4w          ; Slave Expire Time
                                2h          ; Maximum Caching Time in case of failed lookups
)

@                  IN  NS      ns1.i.com.
@                  IN  NS      ns2.i.com.
ns1                IN  A       10.0.0.10
ns2                IN  A       10.0.0.20

a                  IN  A       9.9.9.9
```

说明：
- TTL 生存周期
- IN SOA 授权信息开始
- ns1.i.com. dns 区域的地址
- admin.i.com. 域名管理员邮箱（不要用@符号）
- 10.0.0.30 10.0.0.35 这时两个 dns 服务器的 ip 地址
- a 表示 a.i.com 解析到 9.9.9.9

## 反向解析配置

`vim /var/named/i.loopback`

```conf
$ORIGIN 10.IN-ADDR.ARPA.
$TTL 4h
@       IN      SOA     ns1.i.com. admin.i.com. (
                            2022021001  ; serial number YYMMDDNN
                            1d          ; Slave Refresh
                            1h          ; Slave Retry Time in case of a problem
                            4w          ; Slave Expire Time
                            2h          ; Maximum Caching Time in case of failed lookups
)


@       IN      NS      ns1.i.com.
@       IN      NS      ns2.i.com.

; PTR RR maps an IPv4 address to a host name
2.0.0   IN      PTR     shanghai.i.com.
3.0.0   IN      PTR     beijing.i.com.
```

说明：
反向解析 记录 ip 也是反写的， 2.0.0 表示 0.0.2 ，完整的 ip 就是 10.0.0.2

在 `/etc/named.conf` 中， `zone "10.IN-ADDR.ARPA" {` 也可以改成 `"0.0.10.IN-ADDR.ARPA" {` 表示匹配 10.0.0 开头的 ip 反查，那么 i.loopback 中的 2.0.0 就可以写成 2

## 增加从服务器

| 服务器     | ip        |
| ------- | --------- |
| 主 DNS 服务器 | 10.0.0.10 |
| 从 DNS 服务器 | 10.0.0.20 |

### 主服务器配置

在主服务器的区域配置文件中允许该从服务器的更新请求，即修改 allow-update {允许更新区域信息的主机地址;}; 参数，然后重启主服务器的 DNS 服务程序。

```conf
/* 正向查找 i.com 从 i.com 这个文件里查找 */
zone "i.com" IN {
	type master;
    file "i.com";
    allow-update { 10.0.0.20; };
};

/* 反向查找 ip地址 10 开头的 从 i.loopback 里查找 */
zone "10.IN-ADDR.ARPA" {
    type master;
    file "i.loopback";
    allow-update { 10.0.0.20; };
};
```

{% note warning flat %}
增加了从服务器，每次更新主配置文件，需要同步更新 serial number
{% endnote %}

### 从服务器配置

```conf
/* 正向查找 i.com 从 i.com 这个文件里查找 */
zone "i.com" IN {
    type slave;
    file "i.com";
    masters { 10.0.0.10; };
};

/* 反向查找 ip地址 10 开头的 从 i.loopback 里查找 */
zone "10.IN-ADDR.ARPA" {
    type slave;
    file "i.loopback";
    masters { 10.0.0.10; };
};
```

等待同步完成后， 在 `/var/named/` 目录里面就能看到文件。

#### 手动同步

```bash
# 从服务器上执行
rndc retransfer <zone>
```

## 验证

[检查域名解析](/posts/ae8cd9d9/)
