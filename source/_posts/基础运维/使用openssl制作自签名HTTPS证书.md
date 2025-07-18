---
title: 使用openssl制作自签名HTTPS证书
abbrlink: 097e5b7c
categories:
  - 基础运维
tags: [SSL, Auth]
date: 2022-05-28 14:05:52
cover: https://s3.babudiu.com/iuxt/images/202411211426166.png
updated: 2025-07-18 08:20:39
---

在很多使用到证书的场景, 比如 HTTPS, 可以选择去申请一个免费的证书, 也可以尝试自签名证书, 申请免费证书请看:[使用certbot自动申请ssl证书](/posts/28c679c3) 或者 [使用acme.sh来自动更新https证书](/posts/1e777b9e), 本文介绍自签名证书.

可以直接使用我制作好的工具，支持自签名 HTTPS 证书和双向认证证书，纯 shell 脚本，支持 Docker 使用，一键生成证书：<https://github.com/iuxt/my_cert>

## SSL 协议加密方式

SSL 协议即用到了对称加密也用到了非对称加密 (公钥加密)，在建立传输链路时，SSL 首先对对称加密的密钥使用公钥进行非对称加密，链路建立好之后，SSL 对传输内容使用对称加密。

- 对称加密
    速度高，可加密内容较大，用来加密会话过程中的消息。

- 公钥加密
    加密速度较慢，但能提供更好的身份认证技术，用来加密对称加密的密钥。

## CA 证书

### 生成 CA 私钥

```bash
openssl genrsa -out ca.key 4096
```

生成一个 `ca.key` 文件

### 生成 CA 证书

{% tabs TabName %}

<!-- tab 非交互式创建 -->

```bash
openssl req -utf8 -new -x509 -days 3650 -key ca.key -out ca.crt -subj '/C=CN/ST=Shanghai/L=Pudong/O=iuxt/OU=张理坤/CN=www.i.com/emailAddress=iuxt@qq.com'
```

<!-- endtab -->

<!-- tab 交互式创建 -->

```bash
openssl req -utf8 -new -x509 -days 3650 -key ca.key -out ca.crt
```

需要交互式输入:

| 提示                     | 含义           | 输入内容    |
| ------------------------ | -------------- | ----------- |
| Country Name             | 国家           | CN          |
| State or Province Name   | 省             | Shanghai    |
| Locality Name            | 市             | 留空        |
| Organization Name        | 组织名,公司名  | iuxt        |
| Organizational Unit Name | 团体名         | 留空        |
| Common Name              | 你的名字或域名 | zhanglikun  |
| Email Address            | 电子邮箱       | iuxt@qq.com |

<!-- endtab -->

{% endtabs %}

就可以生成 `ca.crt` 文件, 这个文件需要加入到客户端的 `受信任的根证书颁发机构`

## 生成服务器 HTTPS 证书

### 生成 server 端的私钥

```bash
openssl genrsa -out server.key 4096
```

### 生成 server 端证书请求

{% tabs TabName %}

<!-- tab 非交互式创建 -->

```bash
openssl req -utf8 -new -key server.key -out server.csr -subj '/C=CN/ST=Shanghai/L=Pudong/O=iuxt/OU=张理坤/CN=*.i.com/emailAddress=iuxt@qq.com'
```

<!-- endtab -->

<!-- tab 交互式创建 -->

```bash
openssl req -utf8 -new -key server.key -out server.csr
```

需要交互式输入:

| 提示                       | 含义      | 输入内容         |
| ------------------------ | ------- | ------------ |
| Country Name             | 国家      | CN           |
| State or Province Name   | 省       | Shanghai     |
| Locality Name            | 市       | 留空           |
| Organization Name        | 组织名,公司名 | iuxt         |
| Organizational Unit Name | 团体名     | 留空           |
| Common Name              | 你的名字或域名 | 这里必须写域名或者 ip |
| Email Address            | 电子邮箱    | iuxt@qq.com  |

<!-- endtab -->

{% endtabs %}

### 用 CA 私钥签发 server 的数字证书

> 解决 chrome 不受信任的问题，需要指定 `SubjectAlternativeName`

`vim server.ext`

```conf
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName=@SubjectAlternativeName

[ SubjectAlternativeName ]
DNS.1=i.com
DNS.2=*.i.com
IP.1=192.168.1.1
IP.2=192.168.1.2
```

在里面填写证书绑定的 IP 和域名, 支持通配符

```bash
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 3650 -sha256 -extfile server.ext
```

生成 `server.crt` 证书文件

### 将证书配置到 nginx

```conf
server {
  listen 80;
  listen [::]:80;
  listen 443 ssl;
  listen [::]:443 ssl;
  ssl_certificate   ssl/i.com.crt;              # server 证书
  ssl_certificate_key ssl/i.com.key;            # server 私钥
  ssl_session_timeout 5m;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
  ssl_prefer_server_ciphers on;
  server_name i.com;

  client_max_body_size 1024m;

  location / {
          default_type text/plain;
          return 200 "hello";
  }
}
```

## 配置客户端信任 CA 证书

使用自签名的证书的域名，客户端是不信任的， 除非客户端信任对应的自签名 CA 证书。

{% tabs TabName %}

<!-- tab windows信任CA -->

右键 cacert.crt 选择安装证书， 放进受信任的根证书颁发机构。

![windows安装CA证书|655](https://s3.babudiu.com/iuxt/images/202305251008396.png)

<!-- endtab -->

<!-- tab Debian系信任CA -->

```bash
sudo cp cacert.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

<!-- endtab -->

<!-- tab Redhat系信任CA -->

```bash
sudo cp cacert.crt /etc/pki/ca-trust/source/anchors/
sudo update-ca-trust
```

<!-- endtab -->

{% endtabs %}
然后使用 curl 或 Chrome 浏览器等工具就受信任了。

## 其他

### 查看证书有效期

```bash
openssl x509 -in cacert.crt -noout -dates
```

### Windows 删除证书

win + r 运行，输入 `certmgr.msc` 进入证书管理器。或者在开始菜单搜索 `管理用户证书` 进入。找到证书，右键删除即可。
