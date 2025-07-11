---
title: Ingress Nginx 配置ssl双向认证
categories:
  - 容器
tags:
  - Ingress
  - nginx
  - ssl
abbrlink: lefqq7f4
cover: 'https://s3.babudiu.com/iuxt/public/Nginx.svg'
date: 2023-02-22 21:58:04
---

记录一下在 kuberentes 下使用 ingress-nginx 来配置 ssl 双向认证，可以参考其他几篇文章：
[使用certbot自动申请ssl证书](/posts/28c679c3)

[使用acme.sh来自动更新https证书](/posts/1e777b9e)

[制作和使用自签名证书](/posts/097e5b7c)

[Nginx配置SSL双向认证](/posts/b78a00fa)

## 创建 CA 证书

执行以下命令，创建自签的 CA 证书。

```bash
openssl req -x509 -sha256 -newkey rsa:4096 -keyout ca.key -out ca.crt -days 3650 -nodes -subj '/CN=Fern Cert Authority'
```

## 生成 server 证书

> 这里可以使用公共的 CA 签发的证书， 比如各大云服务商购买的证书。下面是自签证书的步骤。

### 生成 Server 端证书的请求文件

```bash
openssl req -new -newkey rsa:4096 -keyout server.key -out server.csr -nodes -subj '/CN=foo.bar.com'
```

### 使用根证书签发 Server 端请求文件，生成 Server 端证书

```bash
openssl x509 -req -sha256 -days 365 -in server.csr -CA ca.crt -CAkey ca.key -set_serial 01 -out server.crt
```

### 配置到 ingress 里

```bash
kubectl create secret tls foo-bar-com --cert=server.crt --key=server.key
```

```yml
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: nginx-test
spec:
  rules:
  - host: foo.bar.com
    http:
      paths:
      - backend:
          serviceName: http-svc
          servicePort: 80
        path: /
  tls:
  - hosts:
    - foo.bar.com
    secretName: tls-secret
```

## 生成 client 证书

### 生成 Client 端证书的请求文件

> 双向认证一般都是别人使用自己的 key 生成 csr 给到我们， 然后我们用 CA 签名证书，然后将签名后的证书给到别人，后续别人使用证书和自己的私钥就可以访问服务。

```bash
openssl req -new -newkey rsa:4096 -keyout client.key -out client.csr -nodes -subj '/CN=Fern'
```

### 生成 client 端证书

执行以下命令，使用根证书签发 Client 端请求文件，生成 Client 端证书。

```bash
openssl x509 -req -sha256 -days 365 -in client.csr -CA ca.crt -CAkey ca.key -set_serial 02 -out client.crt 
```

### 配置双向认证

创建 secret

```bash
kubectl create secret generic ca-secret --from-file=ca.crt=ca.crt
```

```yml
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/auth-tls-verify-client: "on"
    nginx.ingress.kubernetes.io/auth-tls-secret: "default/ca-secret"
    nginx.ingress.kubernetes.io/auth-tls-verify-depth: "1"
    nginx.ingress.kubernetes.io/auth-tls-pass-certificate-to-upstream: "true"
  name: nginx-test
  namespace: default
spec:
  rules:
  - host: foo.bar.com
    http:
      paths:
      - backend:
          serviceName: http-svc
          servicePort: 80
        path: /
  tls:
  - hosts:
    - foo.bar.com
    secretName: tls-secret
  ```

## 测试访问

```bash
# 自签server证书也可以增加 --cacert ca.crt 参数指定ca证书，客户端也是信任的
curl --cert ./client.crt --key ./client.key https://foo.bar.com/actuator/info -k
```
