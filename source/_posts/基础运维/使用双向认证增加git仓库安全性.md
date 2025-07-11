---
title: 使用双向认证增加git仓库安全性
categories:
  - 基础运维
tags: ['']
abbrlink: sxb6po
date: 2025-06-04 09:56:12
cover: ''
updated: 2025-06-04 11:06:07
---

双向认证是用户需要提供证书来访问服务器，没有证书的用户不允许访问服务器，并且在服务端可以实现吊销指定用户的证书来实现禁止用户访问。配置 https 双向认证会影响到使用 https 协议拉取和推送代码，以及 git lfs 的正常使用 (lfs 使用 https 协议)，ssh 协议使用代码仓库不受影响。

## 配置双向认证

我是用的自签名证书，自签名证书的文档可以查看 [制作和使用自签名证书](/posts/097e5b7c/) 或者我的开源项目：<https://github.com/iuxt/my_cert.git>

### 服务器上的 nginx 上配置

```conf
server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate /path/to/your/server.crt;
    ssl_certificate_key /path/to/your/server.key;

    ssl_client_certificate /path/to/your/ca.crt;        # 配置 CA 证书，用于验证客户端证书的签发者
    ssl_verify_client on;                               # 启用客户端证书验证
    ssl_crl /path/to/your/crl.pem;                      # 配置 CRL 文件路径，用于检查吊销的证书

    location / {
        root /var/www/html;
        index index.html;
    }
}
```

配置好之后，打开网页会提示：
![image.png](https://s3.babudiu.com/iuxt/images/20250604105943557.png)

## 操作系统信任 CA 证书

### Windows

Windows 将证书导入到系统的个人分类下。

### macOS

macOS-- 待补充。

### Linux

Debian 系 Linux：

```bash
sudo cp cacert.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

RedHat 系 Linux：

```bash
sudo cp cacert.crt /etc/pki/ca-trust/source/anchors/
sudo update-ca-trust
```

信任完成后，浏览器重启后再次打开 git 网页：
选择证书，点击确定，就可以正常打开页面了。
![image.png](https://s3.babudiu.com/iuxt/images/20250604110355773.png)

## Git 客户端配置

上面的配置，浏览器已经可以正常携带证书来访问指定的服务了，但是 git 客户端还不行，需要对 git 仓库进行配置。

```bash
# 需要全局配置，增加 --global 参数。会写入到 ~/.gitconfig 中。
git config http.sslCert C:\Users\iuxt\OneDrive\keys\manage.crt
git config http.sslkey C:\Users\iuxt\OneDrive\keys\manage.key
```
