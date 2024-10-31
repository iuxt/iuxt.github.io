---
title: Nginx四层反向代理后端记录真实IP
abbrlink: ee4a87b3
categories:
  - 基础运维
tags:
  - proxy
  - 配置记录
cover: 'https://static.zahui.fan/public/Nginx.svg'
date: 2022-06-08 09:58:58
---

使用 k8s 的 ingress 暴露服务，会有使用负载均衡反向代理 ingress 的情况，那么我们的 ingress 获取到的 ip 都是 4 层负载的 ip，比如常用架构图
![常用架构](https://static.zahui.fan/images/20220608100711.png)

4 层 Proxy Protocol 透传 tcp 工作在网络第 4 层,Proxy Protocol 就是在 tcp 中增加一个小的报头，用来存储额外的信息

代理协议即 Proxy Protocol,是 haproxy 的作者 Willy Tarreau 于 2010 年开发和设计的一个 Internet 协议，通过为 tcp 添加一个很小的头信息，来方便的传递客户端信息（协议栈、源 IP、目的 IP、源端口、目的端口等)，在网络情况复杂又需要获取客户 IP 时非常有用。
其本质是在三次握手结束后由代理在连接中插入了一个携带了原始连接四元组信息的数据包。

目前 proxy protocol 有两个版本，v1 仅支持 human-readable 报头格式（ASCIII 码），v2 需同时支持 human-readable 和二进制格式，即需要兼容 v1 格式
proxy protocol 的接收端必须在接收到完整有效的 proxy protocol 头部后才能开始处理连接数据。因此对于服务器的同一个监听端口，不存在兼容带 proxy protocol 包的连接和不带 proxy protocol 包的连接。如果服务器接收到的第一个数据包不符合 proxy protocol 的格式，那么服务器会直接终止连接。

Proxy protocol 是比较新的协议，但目前已经有很多软件支持，如 haproxy、nginx、apache、squid、mysql 等等，要使用 proxy protocol 需要两个角色 sender 和 receiver,sender 在与 receiver 之间建立连接后，会先发送一个带有客户信息的 tcp header,因为更改了 tcp 协议头，需 receiver 也支持 proxy protocol，否则不能识别 tcp 包头，导致无法成功建立连接。
nginx 是从 1.5.12 起开始支持的

## 问题所在

通常我们获取真实 ip 是通过负载均衡获取到远程的地址， 然后生成一个 header 发送给后端， 这样就可以获取到真实 ip 了，但是在 4 层负载里面， 没有 header 这个概念， ingress 又没办法获取到访问 4 层的地址， 最多只能拿到 4 层负载的地址， 所以需要在 4 层上面把远程的 ip 记录下来， 然后传送到后端也就是 ingress

TCP proxy_protocol 的定义其实就是在数据报文最前面加上对应的 IP 信息。然后最后一个 server 解开这个 data 前面的 IP 信息。

官方文档：<https://nginx.org/en/docs/stream/ngx_stream_realip_module.html>

## 4 层负载修改

先用 `nginx -V` 看下 nginx 有没有 `--with-stream_realip_module` 编译参数， 没有的话， 需要记下当前的编译参数，添加 `--with-stream_realip_module` 后重新编译，替换现有的 nginx 二进制文件

然后修改配置文件，增加参数

```conf
   upstream k8s-http {
        server 10.0.0.30:80;
    }
    server {
        listen 80;
        proxy_connect_timeout 1s;
        # proxy_timeout 10s;        # 后端连接超时时间
        proxy_protocol on ;         # 增加这个
        proxy_pass k8s-http;
    }
   upstream k8s-https {
        server 10.0.0.30:443;
    }
    server {
        listen 443;
        proxy_connect_timeout 1s;
        # proxy_timeout 10s;        # 后端连接超时时间
        proxy_protocol on ;         # 增加这个
        proxy_pass k8s-https;
    }
```

## 修改 ingress（最后一个负载均衡）

这样改了之后， 由于包被修改了，导致后面的 ingress 无法解析这个包了， 会报错 `400 Bad Request`

需要修改 ingress nginx 的 configmap 配置， 如下：

```yml
data:
  use-proxy-protocol: "true"
```

然后 ingress 就可以获取到真实的 ip 了。
