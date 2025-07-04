---
title: minio自建对象存储
categories:
  - 工具
tags:
  - 对象存储
  - 搭建
  - 存储
abbrlink: syv4vu
date: 2025-07-04 15:02:18
cover: https://minio.babudiu.com/iuxt/2025/07/9b62bab970676aeef01b597ccff9a533.png
updated: 2025-07-04 16:22:35
---

## docker 部署

> 这里我指定了 network，我的 nginx 也是用的这个 network，可以直接用 名字 来访问

```bash
docker run --name minio -d \
    --env-file=.env \
    --network iuxt \
    -v ./data:/data \
    -v ./config:/root/.mc \
    minio/minio:RELEASE.2025-04-22T22-12-26Z server --console-address ":9001" /data
```

.env 配置

```env
MINIO_ROOT_USER=username
MINIO_ROOT_PASSWORD=password
MINIO_SERVER_URL=https://minio.xxx.com
MINIO_BROWSER_REDIRECT_URL=https://minio.xxx.com/ui/
MC_CONFIG_DIR=/root/.mc
```

## nginx 配置

```conf
server {
    listen 80;
    listen 443 ssl;
    server_name minio.xxx.com;
    client_max_body_size 0;

    ssl_certificate         ssl/xxx.com.crt;
    ssl_certificate_key     ssl/xxx.com.key;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    add_header Strict-Transport-Security "max-age=31536000";
    error_page 497  https://$host$request_uri;

    # API endpoint
    location / {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://minio:9000;
    }

    # Console endpoint
    location /ui/ {
        rewrite ^/ui/(.*) /$1 break;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://minio:9001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## mc 命令创建 apikey

在 `RELEASE.2025-04-22T22-12-26Z` 这个版本之后 minio 把控制台的管理功能给砍了，顺便还送了你一个每次打开都会弹出的通知。可以继续使用 `RELEASE.2025-04-22T22-12-26Z` 这个版本。如果你不幸更新了版本，你需要使用 mc 命令来创建 API key。

```bash
# 增加节点管理，命名为minio
mc alias set minio http://127.0.0.1:9000 <USERNAME> <PASSWORD>

# 创建用户 
mc admin user add minio <KEY ID> <KEY SECRET>

# 分配权限
mc admin policy attach minio readwrite --user=<KEY ID>
```
