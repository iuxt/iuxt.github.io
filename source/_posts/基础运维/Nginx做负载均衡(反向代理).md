---
title: Nginx负载均衡(反向代理)
abbrlink: 0f0ebc52
categories:
  - 基础运维
tags:
  - LoadBalance
  - Nginx
  - Proxy
cover: 'https://s3.babudiu.com/iuxt/public/Nginx.svg'
date: 2021-06-26 22:03:21
---

## 7 层负载均衡

> 7 层就是用域名来进行转发

类似配置文件：

`vim /etc/nginx/conf.d/xxx.conf`

```text
upstream  wordpress {
    server  192.168.1.20:8000 weight=5 max_fails=3 fail_timeout=30s;
    server  192.168.1.21:8000 weight=5 max_fails=3 fail_timeout=30s;
}

server {
    listen 80 ;
    server_name wordpress.zahui.fan;

    location / {
        proxy_pass http://wordpress;
    }
}

```

### 反代到虚拟主机的另一台 Nginx

比如现在有一台服务器，部署了 a、b 两个服务，比如 a.com 到 a 服务，b.com 到 b 服务，这种情况我的 Nginx 想要代理 b 服务，就需要指定反代 header `proxy_set_header Host "b.com"`，配置如下

```conf
server {
  listen 80;
  listen [::]:80;
  server_name c.com;
  client_max_body_size 1024m;

  location / {
    proxy_pass https://x.x.x.x;      # b服务的ip，也可以用域名，用域名理论上不需要下面这条。
    proxy_set_header HOST b.com;     # 代理服务器请求后端使用的Header
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

## 4 层负载

> 4 层负载就是类似端口转发

`vim /etc/nginx.conf` 最后添加：

```text
stream {
    include port_forward.conf;
}
```

`vim /etc/nginx/port_forward.conf`

### 简单配置

```text
# 访问本机的5555端口， 转发到172.16.1.7的22端口
server {
    listen 5555;
    proxy_pass 172.16.1.7:22;
}
```

### 复杂配置

```text
upstream mysql-server {
    server 192.168.1.20:3306 weight=5 max_fails=3 fail_timeout=10s;
    server 192.168.1.21:3306 weight=5 max_fails=3 fail_timeout=10s;
    server 192.168.1.22:3306 weight=5 max_fails=3 fail_timeout=10s;
}
server {
    listen 3306;
    proxy_connect_timeout 1s;
    proxy_timeout 10s;
    proxy_pass mysql-server;
}
```
