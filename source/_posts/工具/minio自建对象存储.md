---
title: minio自建对象存储
categories:
  - 工具
tags: [对象存储, 搭建, 存储]
abbrlink: syv4vu
date: 2025-07-04 15:02:18
cover: https://s3.babudiu.com/iuxt/2025/07/9b62bab970676aeef01b597ccff9a533.png
updated: 2025-12-07 13:34:57
---

## 单域名方式部署

单域名就是把 minio 的 api 接口和 web 管理控制台放在一个域名下，比如：

管理控制台：`https://minio.xxx.com/ui/`
API 接口：`https://minio.xxx.com`

### docker 部署

> 这里我指定了 network，我的 nginx 也是用的这个 network，可以直接用 容器名字 来访问

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

### nginx 配置

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

## 独立 web 控制台方式部署

可以将 web 控制台独立出来，考虑到安全性，web 控制台不需要开放到公网，可以将控制台独立域名。比如：

管理控制台：`https://s3-admin.example.com`
API 接口：`https://s3.example.com`

### docker 部署

> 这里我指定了 network，我的 nginx 也是用的这个 network，可以直接用 容器名字 来访问

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
MINIO_SERVER_URL=https://s3.example.com
MINIO_BROWSER_REDIRECT_URL=https://s3-admin.example.com
MC_CONFIG_DIR=/root/.mc
```

### nginx 配置

我给控制台开了双向认证，如果不需要，删除掉这三行配置。`ssl_client_certificate ssl/ca.crt;` `ssl_verify_client on;` `ssl_crl ssl/crl.pem;`

```plaintext
```conf
server {
    listen 80;
    listen 443 ssl;
    server_name s3.example.com;

    ssl_certificate         ssl/example.com.crt;
    ssl_certificate_key     ssl/example.com.key;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    error_page 497  https://$host$request_uri;

    ignore_invalid_headers off;
    client_max_body_size 0;
    proxy_buffering off;
    proxy_request_buffering off;

    location / {
      proxy_set_header Host $http_host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;

      proxy_cache_convert_head off;

      proxy_connect_timeout 300;
      proxy_http_version 1.1;
      proxy_set_header Connection "";
      chunked_transfer_encoding off;

      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";

      proxy_pass http://minio:9000;
    }
}

server {
    listen 80;
    listen 443 ssl;
    server_name s3-admin.example.com;
    client_max_body_size 0;

    ssl_certificate         ssl/example.com.crt;
    ssl_certificate_key     ssl/example.com.key;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    add_header Strict-Transport-Security "max-age=31536000";
    error_page 497  https://$host$request_uri;

    ssl_client_certificate ssl/ca.crt;       # 配置 CA 证书，用于验证客户端证书的签发者
    ssl_verify_client on;                    # 启用客户端证书验证
    ssl_crl ssl/crl.pem;                     # 配置 CRL 文件路径，用于检查吊销的证书

    location / {
      proxy_set_header Host $http_host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;

      proxy_cache_convert_head off;

      proxy_connect_timeout 300;
      proxy_http_version 1.1;
      proxy_set_header Connection "";
      chunked_transfer_encoding off;

      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";

      proxy_pass http://minio:9001;
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

## 使用 CURL 操作对象存储

### 公共存储桶（无须认证）

```bash
# 上传文件
# test 为 bucket 名字
curl -T "./1.txt" https://s3.example.com/test/

# 下载文件
curl -OL https://s3.example.com/test/1.txt
```

### 私有存储桶

#### 上传文件

```bash
#!/bin/bash
ACCESS_KEY="minio_ACCESS_KEY"
SECRET_KEY="minio_SECRET_KEY"
BUCKET_NAME="test"
FILE_NAME="./1.txt"
OBJECT_NAME="1.txt"
MINIO_URL="s3.example.com"

# 生成签名
DATE_VALUE="$(date -R)"
SIGNATURE="$(echo -en "PUT\n\n\n${DATE_VALUE}\n/${BUCKET_NAME}/${OBJECT_NAME}" | openssl sha1 -hmac "${SECRET_KEY}" -binary | base64)"

# 上传文件
curl -X PUT --upload-file "${FILE_NAME}" \
   --header "Date: ${DATE_VALUE}" \
   --header "Authorization: AWS ${ACCESS_KEY}:${SIGNATURE}" \
   "${MINIO_URL}/${BUCKET_NAME}/${OBJECT_NAME}"
```

#### 下载文件

```bash
#!/bin/bash
ACCESS_KEY="minio_ACCESS_KEY"
SECRET_KEY="minio_SECRET_KEY"
BUCKET_NAME="test"
FILE_NAME="./1.txt"
OBJECT_NAME="1.txt"
MINIO_URL="s3.example.com"

# 生成签名
DATE_VALUE="$(date -R)"
SIGNATURE="$(echo -en "GET\n\n\n${DATE_VALUE}\n/${BUCKET_NAME}/${OBJECT_NAME}" | openssl sha1 -hmac "${SECRET_KEY}" -binary | base64)"

# 上传文件
curl -X GET -OL \
   --header "Date: ${DATE_VALUE}" \
   --header "Authorization: AWS ${ACCESS_KEY}:${SIGNATURE}" \
   "${MINIO_URL}/${BUCKET_NAME}/${OBJECT_NAME}"
```
