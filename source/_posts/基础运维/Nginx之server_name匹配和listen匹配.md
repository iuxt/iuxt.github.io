---
title: Nginx之server_name匹配和listen匹配
abbrlink: 09a38e37
categories:
  - 基础运维
tags:
  - Nginx
  - 配置文件
cover: 'https://static.zahui.fan/public/Nginx.svg'
date: 2022-03-30 10:14:39
---

nginx 可以通过 listen 的 ip 和端口来匹配请求应该由哪个配置文件来处理，也可以通过 server_name 来匹配，抽空理了理这个匹配的规则和优先级，参考文档：

## 基于域名的虚拟主机

默认是先匹配 listen 的 ip 和端口，匹配到了再检查 server_name，如果没有匹配的 server_name，则由第一个来处理，除非添加 default_server

```conf
server {
    listen      80;
    server_name example.net;
    default_type application/json;
    return 200 '{"server_name":"$server_name", "host": "$host", "server_addr":"$server_addr"}';
}

server {
    listen      80;
    server_name example.com;
    default_type application/json;
    return 200 '{"server_name":"$server_name", "host": "$host", "server_addr":"$server_addr"}';
}
```

测试一下：

```bash
> curl 10.0.0.100 -H "host:example.com"
{"server_name":"example.com", "host": "10.0.0.100", "server_addr":"10.0.0.100"}

> curl localhost
{"server_name":"example.net", "host": "localhost", "server_addr":"127.0.0.1"}
```

在这个配置中，nginx 仅仅检查请求的“Host”头以决定该请求应由哪个虚拟主机来处理。如果 Host 头没有匹配任意一个虚拟主机，或者请求中根本没有包含 Host 头，那 nginx 会将请求分发到定义在此端口上的默认虚拟主机。在以上配置中，第一个被列出的虚拟主机即 nginx 的默认虚拟主机——这是 nginx 的默认行为。而且，可以显式地设置某个主机为默认虚拟主机，即在 "listen" 指令中设置 "default_server" 参数：

如果同样的 listen 配置了两个 default_server 则会报错 `nginx: [emerg] a duplicate default server for 10.0.0.100:80 in /etc/nginx/conf.d/test.conf:9`

## 基于域名和 IP 混合的虚拟主机

Nginx 首先选定由哪一个虚拟主机来处理请求。让我们从一个简单的配置（其中全部 2 个虚拟主机都在端口 `*：80` 上监听）开始：

```conf
server {
    listen      localhost:80;
    server_name example.org;
    default_type application/json;
    return 200 '{"server_name":"$server_name", "host": "$host", "server_addr":"$server_addr"}';
}

server {
    listen      10.0.0.100:80;
    server_name example.net;
    default_type application/json;
    return 200 '{"server_name":"$server_name", "host": "$host", "server_addr":"$server_addr"}';
}

server {
    listen      10.0.0.100:80;
    server_name example.com;
    default_type application/json;
    return 200 '{"server_name":"$server_name", "host": "$host", "server_addr":"$server_addr"}';
}
```

这个配置中，nginx 首先测试请求的 IP 地址和端口是否匹配某个 server 配置块中的 listen 指令配置。接着 nginx 继续测试请求的 Host 头是否匹配这个 server 块中的某个 server_name 的值。如果主机名没有找到，nginx 将把这个请求交给默认虚拟主机处理。

例如，一个从 10.0.0.100:80 端口收到的访问 a.example.com 的请求将被监听 10.0.0.100:80 端口的默认虚拟主机处理，本例中就是第二个服务器，因为这个端口上没有定义名为 a.example.com 的虚拟主机。

我们可以测试一下：

```bash
> curl localhost
{"server_name":"example.org", "host": "localhost", "server_addr":"127.0.0.1"}

> curl 10.0.0.100
{"server_name":"example.net", "host": "10.0.0.100", "server_addr":"10.0.0.100"}

> curl 10.0.0.100 -H "host:example.com"
{"server_name":"example.com", "host": "example.com", "server_addr":"10.0.0.100"}

> curl 10.0.0.100 -H "host:a.example.com"
{"server_name":"example.net", "host": "a.example.com", "server_addr":"10.0.0.100"}
```

## server_name 为空

看一个例子，如果不允许请求中缺少“Host”头，可以定义如下主机，丢弃这些请求：

```conf
server {
    listen       80;
    server_name  "";
    return       444;
}
```
