---
title: ingress-nginx 去除指定context path
categories:
  - 容器
tags: [ingress, Nginx]
abbrlink: tatajf
date: 2026-02-21 21:52:27
cover: ""
updated: 2026-02-21 21:52:44
---

比如我想去掉 url 中的 `/a`

```yaml
curl test.example.com/a/b/xxx/xxx

# 实际请求到后端的路径：
/b/xxx/xxx
```

## 方法一、使用 Nginx 配置片段

```conf
  location /a/b/ {
    proxy_pass http://a.default/b/;
  }
```

但是这种方式需要修改 ingress nginx 开启支持 nginx 配置的功能，详情见 [ingress-nginx 使用自定义的nginx配置](/posts/sygayi/)

## 方法二、使用 ingress nginx 原生配置

需要去除 context path 的路径，创建专门的 ingress，比如：

```yaml
kind: Ingress
apiVersion: networking.k8s.io/v1
metadata:
  name: a
  namespace: default
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
spec:
  ingressClassName: private-nginx
  rules:
    - host: test.example.com
      http:
        paths:
          - path: /
            pathType: ImplementationSpecific
            backend:
              service:
                name: a
                port:
                  number: 80

---
kind: Ingress
apiVersion: networking.k8s.io/v1
metadata:
  name: b
  namespace: default
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
    nginx.ingress.kubernetes.io/rewrite-target: /b/$2
spec:
  ingressClassName: private-nginx
  rules:
    - host: test.example.com
      http:
        paths:
          - path: /a/b(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: b
                port: 
                  number: 80
```
