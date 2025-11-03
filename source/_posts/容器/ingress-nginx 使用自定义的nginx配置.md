---
title: ingress-nginx 使用自定义的nginx配置
categories:
  - 容器
tags: [ingress, Nginx, Kubernetes]
abbrlink: sygayi
date: 2025-06-26 14:49:30
cover: ""
updated: 2025-11-03 22:48:01
---

新版 ingress 增强了 安全性, 它认为用户自己写的 nginx 配置文件不安全，所以又加了限制。（允许自定义 nginx 配置有一定安全风险，酌情修改！）我的 ingress 版本是： 1.12.2

比如有个需求，Spring Boot 写的程序有个 /actuator 路径，安全审查不通过，如果是个 nginx 可以通过：

```conf
location /actuator {
    return 404;
}
```

来直接让它返回 404

## configmap

```yaml
apiVersion: v1
data:
  allow-snippet-annotations: "true"
  annotations-risk-level: Critical
kind: ConfigMap
metadata:
  labels:
    app.kubernetes.io/component: controller
    app.kubernetes.io/instance: public-ingress-nginx
    app.kubernetes.io/name: public-ingress-nginx
    app.kubernetes.io/part-of: public-ingress-nginx
    app.kubernetes.io/version: 1.12.2
  name: public-ingress-nginx-controller
  namespace: public-ingress-nginx
```

加上这两个配置：
`allow-snippet-annotations`
`annotations-risk-level`

风险等级，在这里可以查到：
<https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations-risk/>

## ingress 配置

```yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/cors-allow-headers: '*'
    nginx.ingress.kubernetes.io/cors-allow-methods: '*'
    nginx.ingress.kubernetes.io/cors-allow-origin: '*'
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
    nginx.ingress.kubernetes.io/server-snippet: |
      location /actuator {
        return 404;
      }
  name: mtls
  namespace: vos
spec:
  ingressClassName: public-nginx
  rules:
  - host: a.com
    http:
      paths:
      - backend:
          service:
            name: gateway
            port:
              number: 80
        path: /
        pathType: ImplementationSpecific
  tls:
  - hosts:
    - a.com
    secretName: a-com
```

server-snippet 作用于 server 块
configuration-snippet 作用于 location 块

注意：

```yml
nginx.ingress.kubernetes.io/use-regex: 'true'
```

当启用 `use-regex` 时，所有路径都会被当作正则表达式处理，会影响到匹配。
