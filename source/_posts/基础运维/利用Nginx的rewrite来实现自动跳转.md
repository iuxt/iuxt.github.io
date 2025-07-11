---
title: 利用Nginx的rewrite来实现自动跳转
categories:
  - 基础运维
tags:
  - Nginx
abbrlink: ldsv2ssw
cover: 'https://s3.babudiu.com/iuxt/public/Nginx.svg'
date: 2023-02-06 21:41:08
---

## 任意链接都跳转到指定页面

> 需要部署一个服务在 Kubernetes 内， 需要实现通过 ingress 可以访问到， 本来是很简单的事情， 但是由于访问来源的 location 不确定，为了避免报错 404，所以用 Nginx 的 rewrite 来实现

Nginx 配置如下（所有 location 转发到 index.html）：

```conf
server {
        listen 80 default_server;
        listen [::]:80 default_server;
        server_name _;
        root /var/www/html;

        index index.html index.htm index.nginx-debian.html;

        location / {
                rewrite ^(.*) /index.html break;
        }

}
```

## 自动跳转 https

配置文件如下：

### 使用 return

```conf
server { 	
      listen	  80;
      server_name    example.qcloud.com;
      return	  301 https://$server_name$request_uri;
}

server {
      listen	  443 ssl;
     server_name    example.qcloud.com;
    [....]
}
```

### 使用 rewrite

`rewrite` 性能消耗更大，但是支持更复杂的规则，只是跳转到 https 建议使用 `return 301`

```conf
 if ( $scheme = http ){
      rewrite ^(/.*)$ https://$host$1 permanent;
  }
```

## 判断 Header

```conf
if ($http_user_agent !~* "(Go-http-client/.*|.*Safari.*)") { 
    return 404;
}
```

## 直接返回内容

比如备案、或者各种认证， 证明网站属于自己，通常会给一个 txt 文件让放在网站根目录，其实可以使用这种方法来实现

```conf
location /098x6OP2Qq.txt {
    default_type text/plain;
    return 200 "123456qqqqq";
}
```

## 返回请求者 IP

实现一个获取公网 ip 的小工具，类似于 `curl ip.sb` 可以直接在终端获得公网 ip。

```conf
location /ip {
    default_type text/plain;
    return 200 $remote_addr\n;
}
```