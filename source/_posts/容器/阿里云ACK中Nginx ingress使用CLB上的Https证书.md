---
title: 阿里云ACK中Nginx ingress使用CLB上的Https证书
categories:
  - 容器
tags: [Nginx, ingress, Kubernetes, 阿里云, ACK]
abbrlink: lr01lzch
cover: 'https://s3.babudiu.com/iuxt/public/aliyun.svg'
date: 2024-01-05 10:54:34
updated: 2025-01-09 15:59:13
---

背景: 我们在客户那里部署了一套服务, 服务运行在客户提供的 ACK 集群, 我们删除了客户 ACK 自带的 nginx ingress, 通过自建的方式部署了两套 ingress, 一套绑定了公网 四层 CLB, 一套绑定了内网 四层 CLB, 也就是说是 CLB 转发到 ingress, 然后通过 ingress 转发到其他服务. 现在需要配置 Https 证书, 客户不同意我们配置证书到 ingress, 客户将证书放在了 CLB 上, 给了一个证书 ID

## 查询阿里云文档

阿里云的文档还是很详细, 通过 google 查询到文档地址: [通过Annotation配置传统型负载均衡CLB](https://help.aliyun.com/zh/ack/ack-managed-and-ack-dedicated/user-guide/add-annotations-to-the-yaml-file-of-a-service-to-configure-clb-instances)

具体可以查看这里

![image.png](https://s3.babudiu.com/iuxt/images/202401051108111.png)

HTTPS 请求会在 CLB 层解密，然后以 HTTP 请求的形式发送给后端的 Pod。

> 这个在腾讯云的四层负载均衡里叫 TCP SSL 监听器。

## 配置 LoadBalancer 类型的 Service

因为我们的 CLB 是只给 ingress 使用, 所以修改 ingress 的 Service 配置 yaml:

```yml
apiVersion: v1
kind: Service
metadata:
  annotations:
    service.beta.kubernetes.io/alibaba-cloud-loadbalancer-force-override-listeners: 'true'
    service.beta.kubernetes.io/alibaba-cloud-loadbalancer-id: lb-<负载均衡ID>

    # 新增了下面两行
    service.beta.kubernetes.io/alibaba-cloud-loadbalancer-protocol-port: "https:443,http:80"
    service.beta.kubernetes.io/alibaba-cloud-loadbalancer-cert-id: "<证书的ID>"
  labels:
    app.kubernetes.io/component: public-controller
    app.kubernetes.io/instance: public-ingress-nginx
    app.kubernetes.io/name: public-ingress-nginx
    app.kubernetes.io/part-of: public-ingress-nginx
    app.kubernetes.io/version: 1.6.4
  name: public-ingress-nginx-controller
  namespace: nginx-ingress
spec:
  ipFamilies:
  - IPv4
  ipFamilyPolicy: SingleStack
  ports:
  - appProtocol: http
    name: http
    port: 80
    protocol: TCP
    targetPort: http
    nodePort: 31080
  - appProtocol: https
    name: https
    port: 443
    protocol: TCP
    nodePort: 31443
    targetPort: https
  selector:
    app.kubernetes.io/component: public-controller
    app.kubernetes.io/instance: public-ingress-nginx
    app.kubernetes.io/name: public-ingress-nginx
  type: LoadBalancer
```

## CLB 后端端口配置问题

照着上面步骤配置了以后, Https 访问证书是生效了, 但是没法转发到后端, 会报错: `The plain HTTP request was sent to HTTPS port`

![image.png](https://s3.babudiu.com/iuxt/images/202401051117258.png)

### 原因分析:

![image.png](https://s3.babudiu.com/iuxt/images/20250109154725382.png)

这里 https 请求在 CLB 解密后, 请求后面的 Ingress 是用 http 协议来请求的, 按道理是所有请求都到 ingress-controller 的 HTTP 端口 才对（如上图）, 如果将 TCP SSL 的后端配置成了 HTTPS 就会出现报错: `The plain HTTP request was sent to HTTPS port`

### 解决方案

第一种方法，修改 CLB 配置，后端指向 HTTP 端口。
![Pasted image 20250109153734.webp|910](https://s3.babudiu.com/iuxt/images/20250109155853273.png)

第二种方法：将 service 的 443 端口也转发到 pod 的 80 端口即可. 对应的 yaml 文件:

```yml
apiVersion: v1
kind: Service
metadata:
  annotations:
    service.beta.kubernetes.io/alibaba-cloud-loadbalancer-force-override-listeners: 'true'
    service.beta.kubernetes.io/alibaba-cloud-loadbalancer-id: lb-<负载均衡ID>
    service.beta.kubernetes.io/alibaba-cloud-loadbalancer-protocol-port: "https:443,http:80"
    service.beta.kubernetes.io/alibaba-cloud-loadbalancer-cert-id: "<证书的ID>"
  labels:
    app.kubernetes.io/component: public-controller
    app.kubernetes.io/instance: public-ingress-nginx
    app.kubernetes.io/name: public-ingress-nginx
    app.kubernetes.io/part-of: public-ingress-nginx
    app.kubernetes.io/version: 1.6.4
  name: public-ingress-nginx-controller
  namespace: nginx-ingress
spec:
  ipFamilies:
  - IPv4
  ipFamilyPolicy: SingleStack
  ports:
  - appProtocol: http
    name: http
    port: 80
    protocol: TCP
    targetPort: http
    nodePort: 31080
  - appProtocol: https
    name: https
    port: 443
    protocol: TCP
    nodePort: 31443

    # 这里把https改成http即可
    # targetPort: https
    targetPort: http

  selector:
    app.kubernetes.io/component: public-controller
    app.kubernetes.io/instance: public-ingress-nginx
    app.kubernetes.io/name: public-ingress-nginx
  type: LoadBalancer
```

把这里的 `targetPort: https` 改成 `targetPort: http` 即可.
