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

## 自签名证书

```bash
mkdir -p certs

openssl req \
  -newkey rsa:4096 -nodes -sha256 -keyout certs/i.com.key \
  -addext "subjectAltName = DNS:hub.i.com" \
  -x509 -days 3650 -out certs/i.com.crt
```

## docker 信任证书

将文件复制到每个 Docker 上 主机。您无需重新启动 Docker。

```bash
mkdir -p /etc/docker/certs.d/hub.i.com/
cp i.com.crt /etc/docker/certs.d/hub.i.com/
```

## 部署服务

```bash
#!/bin/bash

docker run -d \
  --restart=always \
  --name registry \
  -v ./data:/var/lib/registry \
  -v ./certs:/certs \
  -e REGISTRY_HTTP_ADDR=0.0.0.0:443 \
  -e REGISTRY_HTTP_TLS_CERTIFICATE=/certs/i.com.crt \
  -e REGISTRY_HTTP_TLS_KEY=/certs/i.com.key \
  -p 443:443 \
  registry:2
```

## 常用的 API

假设镜像名为：`hub.i.com/iuxt/test:latest`

```bash
# 查看镜像列表
curl https://hub.i.com/v2/_catalog

# 查看镜像的tag列表，假设镜像名是test
curl https://hub.i.com/v2/iuxt/test/tags/list

# 查看某个tag的详细信息
curl https://hub.i.com/v2/iuxt/test/manifests/latest

# 获取镜像摘要
curl -s -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
https://hub.i.com/v2/iuxt/test/manifests/latest \
| jq -r '.config.digest'

# 删除镜像，不会释放磁盘空间，释放磁盘空间还需要进行垃圾回收操作。
curl -X DELETE \
https://hub.i.com/v2/iuxt/test/manifests/sha256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 垃圾回收

在 Docker Registry 配置文件 config.yml 中，启用删除功能：

```yml
storage:
  delete:
    enabled: true
```

执行垃圾回收操作

```bash
docker exec <registry-container> bin/registry garbage-collect /etc/docker/registry/config.yml
```

## 配置 OS 信任 CA 证书

部分旧版本 docker 不支持使用 docker 方式信任证书，可以在操作系统全局信任证书。

使用自签名的证书的域名，客户端是不信任的， 除非客户端信任对应的自签名 CA 证书。

{% tabs TabName %}

<!-- tab Debian系信任CA -->

```bash
sudo cp ca.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

然后使用 curl 等工具就受信任了。

<!-- endtab -->

<!-- tab Redhat系信任CA -->

```bash
sudo cp ca.crt /etc/pki/ca-trust/source/anchors/
sudo ln -s /etc/pki/ca-trust/source/anchors/ca.crt  /etc/ssl/certs/ca.crt
sudo update-ca-trust
```

然后使用 curl 等工具就受信任了。

<!-- endtab -->

<!-- tab windows信任CA -->

右键 cacert.crt 选择安装证书， 放进受信任的根证书颁发机构。

![windows安装CA证书](https://static.zahui.fan/images/202305251008396.png)

<!-- endtab -->

{% endtabs %}

