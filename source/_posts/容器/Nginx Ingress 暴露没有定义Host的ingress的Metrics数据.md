---
title: Nginx Ingress 暴露没有定义Host的ingress的Metrics数据
categories:
  - 容器
tags:
  - prometheus
  - Nginx
  - ingress
abbrlink: sk5u8v
cover: 'https://static.zahui.fan/public/Prometheus.svg'
date: 2024-09-21 19:22:06
---

## 指定默认的 ingress 后端

名字有点绕口，假如说之前有个服务是通过 `ip:port` 来访问 nginx(就是 default server)，然后转发到后端服务的，那么转换成 ingress 后，不能指定 host，不然会匹配不到规则。ingress 就不能配置 host，创建出来的 ingress 资源就是这样的：

```yml
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
  name: g.example.com
  namespace: default
spec:
  rules:
  - http:
      paths:
      - backend:
          serviceName: server1
          servicePort: 5003
        path: /sdk
      - backend:
          serviceName: server2
          servicePort: 8665
        path: /tsp
```

创建出来的 ingress 资源显示：

```bash
[root@VM_233_33_centos new]# kubectl get ingress
NAME                               HOSTS   ADDRESS        PORTS   AGE
g.example.com                      *       10.13.255.17   80      4h40m
```

## metrics 监控指标问题

因为上面我们创建了一个 ingress，但是没有指定 host，在 ingress-nginx 中，没有 host 的 ingress 的 metrics 指标是不收集的，代码在此：<https://github.com/kubernetes/ingress-nginx/blob/d82585917c845e598a2cd5d2c4291ce891b5e5b4/internal/ingress/metric/collectors/socket.go#L233-L235>

![image.png|980](https://static.zahui.fan/images/202409231515944.png)

GitHub 上有很多对应的 issues，比如：<https://github.com/kubernetes/ingress-nginx/issues/5755> 和 <https://github.com/kubernetes/ingress-nginx/issues/3713>
![image.png|738](https://static.zahui.fan/images/202409231511781.png)

这里有个修复链接，`https://github.com/kubernetes/ingress-nginx/pull/4139` 理论上在这个时间之后的版本就已经修复了，需要添加启动参数：`--metrics-per-host=false`， yml 文件如下（部分内容精简）：

```yml
# Source: ingress-nginx/templates/controller-deployment.yaml
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3
    spec:
      dnsPolicy: ClusterFirst
      containers:
        - name: controller
          image: k8s.gcr.io/ingress-nginx/controller:v0.35.0@sha256:fc4979d8b8443a831c9789b5155cded454cb7de737a8b727bc2ba0106d2eae8b
          imagePullPolicy: IfNotPresent
          lifecycle:
            preStop:
              exec:
                command:
                  - /wait-shutdown
          args:
            - /nginx-ingress-controller
            - --election-id=ingress-controller-leader
            - --ingress-class=nginx
            - --configmap=$(POD_NAMESPACE)/ingress-nginx-controller
            - --validating-webhook=:8443
            - --validating-webhook-certificate=/usr/local/certificates/cert
            - --validating-webhook-key=/usr/local/certificates/key
            - --default-backend-service=$(POD_NAMESPACE)/ingress-nginx-default-backend
            - --metrics-per-host=false
...
```

然后等待重启完成，既可看到监控指标：需要注意标签的变化，grafana 中也需要做相应的修改。

![image.png](https://static.zahui.fan/images/202409231527790.png)
