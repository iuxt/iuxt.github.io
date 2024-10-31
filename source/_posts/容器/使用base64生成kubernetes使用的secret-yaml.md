---
title: 使用base64生成kubernetes使用的secret yaml
categories:
  - 容器
tags:
  - k8s
  - base64
abbrlink: 462d0642
cover: 'https://static.zahui.fan/public/linux.svg'
date: 2022-11-04 15:47:52
---

先申请证书, 证书申请下来后会有 证书 (一般都是 pem 后缀或者 crt 后缀) 和 私钥 (一般后缀是 key)

使用 base64 加工一下:

```bash
base64 ./i.com_bundle.crt -w 0
```

> -w 0 的意思是不换行, 默认是 76 个字符换行.

然后填到 Kubernetes 的 yaml 文件里面即可.

```yaml
apiVersion: v1
data:
  tls.crt: <单行文本证书>
  tls.key: <单行文本key>
kind: Secret
metadata:
  name: lexus-ald-i-com
  namespace: prod-valet
type: kubernetes.io/tls
```
