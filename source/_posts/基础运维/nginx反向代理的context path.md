---
title: nginx反向代理的context path
categories:
  - 基础运维
tags: [Nginx]
abbrlink: sootea
date: 2024-12-18 19:32:33
cover: ""
updated: 2025-02-19 17:46:45
---

## 返回请求 uri

在 Nginx 中，可以使用 `$request_uri` 来表示请求 uri, 配置如下；

```conf
server {
    listen 80;
    server_name example.com;

    location / {
        add_header Content-Type text/html;
        return 200 "$request_uri\n";
    }
}
```

这里再使用另一台 nginx 反向代理到这台 nginx 就可以测试请求的 uri 了。

## 测试 nginx 的反向代理 content path

### 1

```conf
location / {
   proxy_pass http://192.168.200.12;
}
```

结果是

`curl localhost/aa/bb/` --> `http://192.168.200.12/aa/bb/`

### 2

```conf
location /aa {
   proxy_pass http://192.168.200.12;
}
```

结果和上面一样，但是只有 /aa 开头的才能转发到这里

### 3

```conf
location /aa/ {
   proxy_pass http://192.168.200.12;
}
```

结果和上面一样，但是只有 /aa/ 开头的才能转发到这里

### 4

```conf
location /aa {
   proxy_pass http://192.168.200.12/;
}
```

结果是：

```bash
[root@master1 nginx]# curl localhost/aa/bb/cc
//bb/cc
```

### 5

```conf
location /aa {
   proxy_pass http://192.168.200.12/x/y/z;
}
```

结果是：

```bash
[root@master1 nginx]# curl localhost/aa
/x/y/z
```

## nginx 的 alias

Nginx 的 alias 指令可以理解为“路径别名”，它能把用户访问的 URL 路径直接映射到服务器上的另一个真实目录。举个例子：

假设你配置了：

```conf
location /images/ {
    alias /var/www/my_photos/;
}
```

当用户访问 `http://你的网站/images/cat.jpg` 时，Nginx 会直接去服务器上的 `/var/www/my_photos/cat.jpg` 找文件，而不会保留 URL 中的 `/images/` 路径。

和另一个指令 root 的区别在于：

用 root 时，路径是追加（比如 location /a/ { root /b; }，访问 `/a/1.jpg` 会找 `/b/a/1.jpg`）
用 alias 时，路径是替换（同样配置下，访问 `/a/1.jpg` 会直接找 `/b/1.jpg`）
需要注意：配置时路径末尾的 `/` 要统一，比如 `location /images/` 和 `alias /var/www/my_photos/` 都要带斜杠，否则可能导致路径错误
