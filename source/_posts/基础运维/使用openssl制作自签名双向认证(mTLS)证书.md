---
title: 使用openssl制作自签名双向认证(mTLS)证书
categories:
  - 基础运维
tags: [SSL, Auth]
abbrlink: szkilc
date: 2025-07-18 07:58:24
cover: ""
updated: 2025-08-24 01:02:24
---

可以直接使用我制作好的工具，支持自签名 HTTPS 证书和双向认证证书，纯 shell 脚本，支持 Docker 使用，一键生成证书：<https://github.com/iuxt/my_cert>

双向认证用途是什么： 双向认证就是客户端需要携带证书来请求服务器，证书校验通过了才会正常返回。比如说我有个网站只有自己访问，就可以配置双向认证，自己电脑安装一下证书就可以访问，还可以通过吊销证书的方式来禁止对应的人访问网站。

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

## 制作双向认证客户端证书

我是在 `Ubuntu 24.04` 系统下操作。不同系统可能会有差别。

### 生成证书吊销列表

准备一份 `openssl.cnf` 配置文件

```conf
[ ca ]
default_ca = CA_default

[ CA_default ]
# 根目录设置为自定义路径
dir = ./ca

# 默认算法
default_md = sha256

# CA 的数据库文件
database = $dir/index.txt
# 证书的序列号文件
serial = $dir/serial
# 新证书的默认有效期
default_days = 365
# 吊销证书的理由
crl_reason = unspecified
# 默认的证书颁发策略
policy = policy_anything

# CRL 选项
crlnumber = $dir/crlnumber
default_crl_days = 30
crl_extensions = crl_ext

[ policy_anything ]
# 配置任何策略
countryName = optional
stateOrProvinceName = optional
organizationName = optional
organizationalUnitName = optional
commonName = supplied
emailAddress = optional

[ crl_ext ]
# CRL 的扩展配置
authorityKeyIdentifier = keyid:always
```

### 吊销指定证书

其他的证书都是 ca 签发的, 不管是 nginx 用的 server 证书,还是双向认证用到的 client 证书, 吊销证书后需要重新生成 crl 文件

```bash
touch ca/index.txt

# crlnumber初始化，第一次给个初始值即可，后面不需要修改，每次重新生成crl的时候会自增。
[ ! -f ca/crlnumber ] && echo "01" > ca/crlnumber

# 吊销指定证书
openssl ca  -config openssl.cnf -cert ca/ca.crt  -keyfile  ca/ca.key  -revoke ssl/i.com.crt

# 吊销完成后，重新生成吊销列表，建议定期重新生成 CRL 文件，并在 Nginx 上 reload 配置
openssl ca -config openssl.cnf  -cert ca/ca.crt  -keyfile  ca/ca.key  -gencrl -out ca/crl.pem
```

### 服务端 nginx 配置

```conf
server {
  listen 80;
  listen [::]:80;
  listen 443 ssl;
  listen [::]:443 ssl;
  ssl_certificate   ssl/i.com.crt;
  ssl_certificate_key ssl/i.com.key;
  ssl_session_timeout 5m;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
  ssl_prefer_server_ciphers on;
  server_name i.com;

  ssl_client_certificate ssl/ca.crt;       # 配置 CA 证书，用于验证客户端证书的签发者
  ssl_verify_client on;                    # 启用客户端证书验证
  ssl_crl ssl/crl.pem;                     # 配置 CRL 文件路径，用于检查吊销的证书

  client_max_body_size 1024m;

  location / {
          default_type text/plain;
          return 200 "hello";
  }
}

```

## 配置客户端 client 证书

证书生成方式和上面一样，p12 格式包含私钥和证书（iPhone 想导入的话，必须设置密码。）

```bash
openssl pkcs12 -export -in zhangsan.crt -inkey zhangsan.key -out zhangsan.p12
```

### Windows 系统

双击导入，存储位置选择个人
![image.png](https://s3.babudiu.com/iuxt/images/202411071859189.png)

访问对应网站的时候浏览器会提示让选择证书
![image.png|593](https://s3.babudiu.com/iuxt/images/202411071900128.png)

这是证书被吊销的样子：
![image.png|593](https://s3.babudiu.com/iuxt/images/202411071900403.png)

### iPhone 手机

先在文件里点击一下 p12 文件
![IMG_5978-1.png|283](https://s3.babudiu.com/iuxt/2025/07/fa3a67c3a23c675bc5d1c9a0b1c64fbc.png)

然后到 VPN 与设备管理里
![IMG_5979-1.png|302](https://s3.babudiu.com/iuxt/2025/07/7e78a2fe2e97dc9cd3bfc41d883cd953.png)

选择已下载的描述文件，进行安装。

## 二级 CA

可选使用二级 CA 证书，如果业务量比较大的情况下，可以使用二级 CA，这样如果二级 CA 出现私钥泄露，可以通过根 CA 吊销二级 CA 证书 (通过此二级 CA 签发的证书都会失效)。使用二级 CA 签发证书需要注意：
1. 签发二级 CA 的时候需要执行证书扩展信息为 CA (`basicConstraints=CA:TRUE`)
2. 在 Nginx 等配置认证证书的时候，需要配置证书链，即 二级 CA 和 根 CA 这两个证书合并到一个文件里。

下面是一个一键生成各种证书脚本：

```bash
#!/bin/bash
set -e

WORKDIR=mtls_certs
mkdir -p $WORKDIR
cd $WORKDIR

echo "[1/6] 生成 Root CA..."
openssl genrsa -out rootCA.key 4096
openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 3650 \
  -subj "/C=CN/ST=Beijing/O=MyOrg/CN=MyRootCA" \
  -out rootCA.crt

echo "[2/6] 生成二级 Sub CA..."
openssl genrsa -out subCA.key 4096
openssl req -new -key subCA.key \
  -subj "/C=CN/ST=Beijing/O=MyOrg/CN=MySubCA" \
  -out subCA.csr

openssl x509 -req -in subCA.csr -CA rootCA.crt -CAkey rootCA.key -CAcreateserial \
  -out subCA.crt -days 1825 -sha256 -extfile <(printf "basicConstraints=CA:TRUE,pathlen:0\nkeyUsage=critical,keyCertSign,cRLSign")

echo "[3/6] 生成 Client Key & CSR..."
openssl genrsa -out client.key 2048
openssl req -new -key client.key \
  -subj "/C=CN/ST=Beijing/O=MyOrg/CN=mtls-client" \
  -out client.csr

echo "[4/6] 用 Sub CA 签发 Client Cert..."
openssl x509 -req -in client.csr -CA subCA.crt -CAkey subCA.key -CAcreateserial \
  -out client.crt -days 825 -sha256

echo "[5/6] 生成证书链 (SubCA + RootCA)..."
cat subCA.crt rootCA.crt > ca-chain.crt

echo "[6/6] 生成 PFX (可用于浏览器/工具)"
openssl pkcs12 -export -out client.pfx -inkey client.key -in client.crt -certfile ca-chain.crt -password pass:123456

echo "✅ 证书生成完成 (目录: $WORKDIR)"
ls -l
```

## 其他

### 验证证书

```bash
# openssl 验证证书关系
openssl verify -CAfile ca-chain.crt client.crt

# curl测试
curl --cert client.crt --key client.key https://test.babudiu.com
```

### Windows 删除个人证书

win + r 运行，输入 `certmgr.msc` 进入证书管理器。或者在开始菜单搜索 `管理用户证书` 进入。找到证书，右键删除即可。

### iPhone 删除证书

删除描述文件即可。
