---
title: P12格式证书与PEM格式转换
categories:
  - 基础运维
tags: [SSL]
abbrlink: sycvjt
date: 2025-06-24 18:23:52
cover: ""
updated: 2025-07-18 00:21:46
---

P12 证书是整合了公钥和私钥的，还可以给 P12 证书设置密码。

## P12 转换为 PEM

```bash
# 提取证书
openssl pkcs12 -in 1.p12  -clcerts -nokeys -out certificate.crt

# 提取加密的私钥
openssl pkcs12 -in 1.p12 -nocerts -out private_key.key

# 提取未加密的私钥
openssl pkcs12 -in 1.p12 -nocerts -nodes -out private_key.key
```

这种是加密的 PEM 私钥

```plaintext
-----BEGIN ENCRYPTED PRIVATE KEY-----
...
-----END ENCRYPTED PRIVATE KEY-----
```

也可以将加密的 PEM 私钥转换成未加密的 PEM 私钥

```bash
openssl rsa -in encrypt.key -out nopassword.key
```

未加密的 PEM 私钥长这样

```plaintext
-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
```

## PEM 公钥和私钥转换成 P12

```bash
openssl pkcs12 -export -out certificate.p12 -inkey privateKey.key -in certificate.crt
```
