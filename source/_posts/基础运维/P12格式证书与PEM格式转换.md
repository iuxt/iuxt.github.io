---
title: P12格式证书与PEM格式转换
categories:
  - 基础运维
tags: [SSL]
abbrlink: sycvjt
date: 2025-06-24 18:23:52
cover: ""
updated: 2025-06-24 18:33:14
---

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
