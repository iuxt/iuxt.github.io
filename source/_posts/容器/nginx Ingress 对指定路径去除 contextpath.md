---
title: nginx Ingress 对指定路径去除 contextpath
categories:
  - 容器
tags:
  - ingress
  - contextpath
abbrlink: sib2vi
cover: 'https://s3.babudiu.com/iuxt/images/202408161820015.png'
date: 2024-08-16 18:09:17
---

要在 Kubernetes 中配置 Nginx Ingress 以便转发到后端时去掉 `contextPath`，你可以通过以下步骤来实现：

## 单个 path 去掉 contextpath

假设你有一个服务在 `/app` 路径下运行，并希望通过 Ingress 直接访问后端服务的根路径 `/`，可以如下配置：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: example-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2

spec:
  rules:
  - host: example.com
    http:
      paths:
      - path: /app(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: example-service
            port:
              number: 80
```

### $2 是什么

假设一个请求路径是 `/app1/foo/bar`，根据路径匹配规则 `/app1(/|$)(.*)`：

第一组 `(/|$)` 匹配的是 `/`。
第二组 `(.*)` 匹配的是 `foo/bar`。
因此，`$2` 将包含 `foo/bar`，重写后的目标路径为 `/foo/bar`。

`pathType: ImplementationSpecific`: 允许路径匹配类型由具体的 Ingress 控制器实现决定。在 `Nginx` 中，这通常表示使用最长前缀匹配。

## 如果有多个 location 需要对其中一个 location 去除 contextpath

### 方法一：使用多个 Ingress，配置同一个域名

个人比较推荐这种配置

ingress1:

```yaml
kind: Ingress
apiVersion: networking.k8s.io/v1
metadata:
  name: ibr-portal
  namespace: default
  annotations:
    kubernetes.io/ingress.class: apple-internet

spec:
  tls:
    - hosts:
        - register.example.com
      secretName: example-com
  rules:
    - host: register.example.com
      http:
        paths:
          - path: /
            pathType: ImplementationSpecific
            backend:
              service:
                name: ibr-wfe
                port:
                  number: 80
          - path: /job
            pathType: ImplementationSpecific
            backend:
              service:
                name: xxl-job
                port:
                  number: 80
```

ingress2:
这个 ingress 是需要去除 contextpath 的路径。

```yaml
kind: Ingress
apiVersion: networking.k8s.io/v1
metadata:
  name: ibr
  namespace: default
  annotations:
    kubernetes.io/ingress.class: apple-internet
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  tls:
    - hosts:
        - register.example.com
      secretName: example-com
  rules:
    - host: register.example.com
      http:
        paths:
          - path: /ibr(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: ibr
                port:
                  number: 80
```

### 方法二：直接使用 Nginx 配置

这个用 ingress 好像实现不了了，需要用到原生的 Nginx 配置，增加一条 `server-snippet` 注解，记得全局 configmap 也需要开启 server-snippet 支持。这个方案有个缺点，如果我删除了 service 然后再创建个同名的 service，还是访问不了的，这个是 Nginx 的特性，nginx proxy_pass 如果配置了域名，那么 nginx 会将域名解析的 IP 缓存下来，不会更新的。除非你 reload 或 restart

```yaml
kind: Ingress
apiVersion: networking.k8s.io/v1
metadata:
  name: ibr-portal
  namespace: default
  annotations:
    kubernetes.io/ingress.class: apple-internet
    nginx.ingress.kubernetes.io/server-snippet: |
      location /ibr {
        proxy_pass http://ibr.default/; 
      }

spec:
  tls:
    - hosts:
        - register.example.com
      secretName: example-com
  rules:
    - host: register.example.com
      http:
        paths:
          - path: /
            pathType: ImplementationSpecific
            backend:
              service:
                name: ibr-wfe
                port:
                  number: 80
          - path: /job
            pathType: ImplementationSpecific
            backend:
              service:
                name: xxl-job
                port:
                  number: 80
```
