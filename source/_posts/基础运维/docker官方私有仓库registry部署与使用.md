---
title: docker官方私有仓库registry部署与使用
categories:
  - 基础运维
tags:
  - 部署
  - 仓库
  - Docker
  - 镜像
  - 搭建
abbrlink: sc3b39
cover: 'https://static.zahui.fan/public/Docker.svg'
date: 2024-04-17 22:04:20
---

一般来说大家用容器镜像都选择 harbor，有个管理界面，还支持权限控制、漏洞扫描等，但是我公司有个客户的环境只允许通过跳板机登录 Linux 机器，没法使用浏览器，另外也只是需要一个简单一点的、好维护的仓库，找了一下，这个比较简单。如果需要更专业的私有镜像仓库，可以选择 harbor（免费）或者 jFrog 家的（收费）

## 生成 CA 证书

```bash
# 私钥
openssl genrsa -out ca.key 4096

# 证书请求
openssl req -utf8 -new -x509 -days 3650 -key ca.key -out ca.crt -subj '/C=CN/ST=Shanghai/L=Pudong/O=iuxt/OU=张理坤/CN=*.i.com/emailAddress=iuxt@qq.com'

# 生成私钥
openssl genrsa -out server.key 4096
openssl req -utf8 -new -key server.key -out server.csr -subj '/C=CN/ST=Shanghai/L=Pudong/O=iuxt/OU=张理坤/CN=*.i.com/emailAddress=iuxt@qq.com'

```

## 生成扩展属性信息

需要修改如下的 IP 和域名信息，和你的服务器保持一致

```bash
cat >> server.ext <<'EOF'
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName=@SubjectAlternativeName

[ SubjectAlternativeName ]
DNS.1=i.com
DNS.2=*.i.com
IP.1=192.168.1.11
EOF
```

## 生成服务器证书

```bash
# 私钥
openssl genrsa -out server.key 4096

# 证书请求
openssl req -utf8 -new -key server.key -out server.csr -subj '/C=CN/ST=Shanghai/L=Pudong/O=iuxt/OU=张理坤/CN=*.i.com/emailAddress=iuxt@qq.com'

# 使用CA证书进行签发
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 3650 -sha256 -extfile server.ext
```

## 配置客户端信任 CA 证书

使用自签名的证书的域名，客户端是不信任的， 除非客户端信任对应的自签名 CA 证书。

{% tabs TabName %}

<!-- tab windows信任CA -->

右键 cacert.crt 选择安装证书， 放进受信任的根证书颁发机构。

![windows安装CA证书](https://static.zahui.fan/images/202305251008396.png)

<!-- endtab -->

<!-- tab Debian系信任CA -->

```bash
sudo cp cacert.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

然后使用 curl 等工具就受信任了。

<!-- endtab -->

<!-- tab Redhat系信任CA -->

```bash
sudo cp cacert.crt /etc/pki/ca-trust/source/anchors/
sudo ln -s /etc/pki/ca-trust/source/anchors/cacert.crt  /etc/ssl/certs/cacert.crt
sudo update-ca-trust
```

然后使用 curl 等工具就受信任了。

<!-- endtab -->

{% endtabs %}

客户端信任证书后，需要重启一下 Docker

```bash
systemctl restart docker
```

## 部署服务

```bash
#!/bin/bash

docker run -d \
  --restart=always \
  --name registry \
  -v "$(pwd)"/certs:/certs \
  -e REGISTRY_HTTP_ADDR=0.0.0.0:443 \
  -e REGISTRY_HTTP_TLS_CERTIFICATE=/certs/server.crt \
  -e REGISTRY_HTTP_TLS_KEY=/certs/server.key \
  -p 443:443 \
  registry:2
```

## 常用的 API

```bash
# 查看镜像列表
curl https://10.0.0.101/v2/_catalog

# 查看镜像的tag列表，假设镜像名是test
curl https://10.0.0.101/v2/test/tags/list

# 查看某个tag的详细信息， test是镜像名，2是tag， tag也可以替换成digest
curl https://10.0.0.101/v2/test/manifests/2

# 删除镜像，失败，有空再研究怎么用
~~ curl -X DELETE https://10.0.0.101/v2/test/manifests/2 ~~
```

![image.png](https://static.zahui.fan/images/202404172214456.png)
