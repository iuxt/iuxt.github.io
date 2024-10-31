---
title: Kubernetes使用ingress反向代理外部IP
abbrlink: 0ad6df1b
cover: 'https://static.zahui.fan/public/kubernetes.svg'
categories:
  - 容器
tags:
  - Service
  - k8s
date: 2022-04-15 22:03:37
---

我们平常使用 k8s 的 service 都是自动发现增加 endpoint 的，但是有的时候集群外的服务我们又想用 k8s 的 ingress 来统一做入口，就会涉及到自定义 endpoint

## 创建 service

```yml
apiVersion: v1
kind: Service
metadata:
  name: kibana
  namespace: ops
spec:
  type: ClusterIP
  ports:
  - name: kibana
    port: 80
    protocol: TCP
    targetPort: 80
```

## 创建 endpoint

```yml
apiVersion: v1
kind: Endpoints
metadata:
  name: kibana
  namespace: ops
subsets:
- addresses:
  - ip: 10.0.0.12
  - ip: 10.0.0.13
  ports:
  - name: kibana
    port: 5601
    protocol: TCP
```

## 创建 Ingress

```yml
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: kibana
  namespace: ops
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/proxy-body-size: 300M
    nginx.ingress.kubernetes.io/server-snippet: |
      if ($http_user_agent ~* (Scrapy|Go-http-client/1.1|HttpClient|curl/7.64.1)) {
        return 403;
      }
spec:
  rules:
  - host: kibana.i.com
    http:
      paths:
      - backend:
          serviceName: kibana
          servicePort: 80
        path: /
```
