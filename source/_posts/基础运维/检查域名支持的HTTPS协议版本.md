---
title: 检查域名支持的HTTPS协议版本
categories:
  - 基础运维
tags: [加密, SSL, tls, https]
abbrlink: lqxf8k8u
cover: 'https://s3.babudiu.com/iuxt/public/certificate-ssl.svg'
date: 2024-01-03 14:52:44
updated: 2025-04-11 01:47:15
---

## 使用 NMAP(推荐)

依赖于 `nmap`, `nmap` 需要安装

```bash
nmap --script ssl-enum-ciphers -p 443 baidu.com
```

比如 GitHub 只支持 TLS1.2 和 TLS1.3：
![image.png](https://s3.babudiu.com/iuxt/images/202401031545944.png)

## 在线验证

[SSL Server Test (Powered by Qualys SSL Labs)](https://www.ssllabs.com/ssltest/index.html) 这个域名还可以检测支持的设备情况。

<https://myssl.com/>

<https://www.ssleye.com/ssltool/cipher_suites.html>

<https://www.site24x7.com/zhcn/tools/tls-checker.html>

## 使用 CURL 验证

```bash
curl --tlsv1 --tls-max 1.0  https://github.com
curl --tlsv1 --tls-max 1.0  https://www.baidu.com
```

报错说明不支持当前版本:

```vim
curl: (35) LibreSSL/3.3.6: error:1404B42E:SSL routines:ST_CONNECT:tlsv1 alert protocol version
```

## 使用 OpenSSL

```bash
# 验证TLS1.2
openssl s_client -connect www.baidu.com:443 -tls1_2

# 验证TLS1.1
openssl s_client -connect www.baidu.com:443 -tls1_1

# 验证TLS1.0
openssl s_client -connect www.baidu.com:443 -tls1
```

如果握手失败的话，那么就是不支持了。

## 服务端 TLS 版本配置

可以通过配置服务端,比如 nginx 来设置支持的 TLS 版本.

### Nginx 配置修改

配置生成地址: <https://ssl-config.mozilla.org/>

注意： tls 版本的配置必须全局生效，如果你有多个 `vhost`，那么所有都需要修改，建议直接写到一个文件内，然后通过 `include` 的方式来引用。

```conf
# generated 2024-01-03, Mozilla Guideline v5.7, nginx 1.17.7, OpenSSL 1.1.1k, intermediate configuration
# https://ssl-config.mozilla.org/#server=nginx&version=1.17.7&config=intermediate&openssl=1.1.1k&guideline=5.7
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    ssl_certificate /path/to/signed_cert_plus_intermediates;
    ssl_certificate_key /path/to/private_key;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozSSL:10m;  # about 40000 sessions
    ssl_session_tickets off;

    # curl https://ssl-config.mozilla.org/ffdhe2048.txt > /path/to/dhparam
    ssl_dhparam /path/to/dhparam;

    # intermediate configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;

    # HSTS (ngx_http_headers_module is required) (63072000 seconds)
    add_header Strict-Transport-Security "max-age=63072000" always;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;

    # verify chain of trust of OCSP response using Root CA and Intermediate certs
    ssl_trusted_certificate /path/to/root_CA_cert_plus_intermediates;

    # replace with the IP address of your resolver
    resolver 127.0.0.1;
}
```

## 常见问题

### ssl_ciphers

密码套件不是瞎配置的，需要和你的 TLS 版本、和证书的加密类型（如 RSA ECC 等）对的上才行。
不想要的加密套件，前面可以加个 ! 表示不使用。
