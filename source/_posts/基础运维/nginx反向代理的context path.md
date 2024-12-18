---
title: nginx反向代理的context path
categories:
  - 基础运维
tags:
  - ''
abbrlink: sootea
date: 2024-12-18 19:32:33
cover: ''
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