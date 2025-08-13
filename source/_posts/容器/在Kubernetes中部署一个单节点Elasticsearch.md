---
title: 在Kubernetes中部署一个单节点Elasticsearch
categories:
  - 容器
tags: ['']
abbrlink: t0wu1k
date: 2025-08-13 10:10:31
cover: ''
updated: 2025-08-13 10:47:26
---

1. Elasticsearch 有自己的高可用集群机制，不建议再用 k8s 管理
2. 适用于临时使用一下、或者测试使用

## 数据存储问题

为了测试使用，我也没有用 pvc 来管理数据，而是选择了 hostpath，那么为了重启也可以正常访问数据，需要将 es 固定在一个节点上。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: elasticsearch
  labels:
    app: elasticsearch
spec:
  replicas: 1
  selector:
    matchLabels:
      app: elasticsearch
  template:
    metadata:
      labels:
        app: elasticsearch
    spec:
      nodeSelector:
        kubernetes.io/hostname: iuxt
      containers:
      - name: elasticsearch
        image: sls-registry.cn-hangzhou.cr.aliyuncs.com/kproxy/elasticsearch:7.17.26
        env:
          - name: discovery.type
            value: single-node
          - name: ELASTIC_USERNAME
            value: elastic
          - name: ELASTIC_PASSWORD
            value: "jjxkjkdgkdjgkkdjgk"
          - name: ES_JAVA_OPTS
            value: "-Xms1G -Xmx1G"
          - name: xpack.security.enabled
            value: "true"
        ports:
        - containerPort: 9200
          name: http
        - containerPort: 9300
          name: transport
        volumeMounts:
        - name: data
          mountPath: /usr/share/elasticsearch/data
      volumes:
      - name: data
        hostPath:
          path: /data/elasticsearch
          type: DirectoryOrCreate
```

这里我使用 nodeSelector 指定了一个标签来选择节点。

## 问题

日志停留在：`Created elasticsearch keystore in /usr/share/elasticsearch/config/elasticsearch.keystore`
然后自动重启

到主机的 `/data/elasticsearch` 目录查看，是空的

这种情况是没有权限写入，用 pvc 没有这个问题，直接挂载 hostpath 就会有权限问题，因为 es 这个容器不是使用 root 运行的进程，而是用的 uid:1000 这个用户来运行的。

解决方法是：使用 init container 来修复目录权限 ，init container 太适合来做这个事情了

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: elasticsearch
  labels:
    app: elasticsearch
spec:
  replicas: 1
  selector:
    matchLabels:
      app: elasticsearch
  template:
    metadata:
      labels:
        app: elasticsearch
    spec:
      nodeSelector:
        kubernetes.io/hostname: iuxt
      initContainers:
      - name: fix-permissions
        image: busybox
        command: ["sh", "-c", "chown -R 1000:1000 /usr/share/elasticsearch/data"]
        volumeMounts:
        - name: data
          mountPath: /usr/share/elasticsearch/data
      containers:
      - name: elasticsearch
        image: sls-registry.cn-hangzhou.cr.aliyuncs.com/kproxy/elasticsearch:7.17.26
        env:
          - name: discovery.type
            value: single-node
          - name: ELASTIC_USERNAME
            value: elastic
          - name: ELASTIC_PASSWORD
            value: "jjxkjkdgkdjgkkdjgk"
          - name: ES_JAVA_OPTS
            value: "-Xms1G -Xmx1G"
          - name: xpack.security.enabled
            value: "true"
        ports:
        - containerPort: 9200
          name: http
        - containerPort: 9300
          name: transport
        volumeMounts:
        - name: data
          mountPath: /usr/share/elasticsearch/data
      volumes:
      - name: data
        hostPath:
          path: /data/elasticsearch
          type: DirectoryOrCreate
```

这样就解决了权限问题：

## 部署 kibana

```yaml
---
kind: Deployment
apiVersion: apps/v1
metadata:
  namespace: default
  labels:
    app: kibana
  name: kibana
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kibana
  template:
    metadata:
      labels:
        app: kibana
    spec:
      containers:
      - name: kibana
        image: sls-registry.cn-hangzhou.cr.aliyuncs.com/kproxy/kibana:7.17.26
        ports:
          - containerPort: 5601
            protocol: TCP
        volumeMounts:
          - name: kibana-config
            mountPath: /usr/share/kibana/config
        resources:
          limits:
            memory: "4Gi"
            cpu: "2"
          requests: 
            memory: "2Gi"
            cpu: "2"
      volumes:
      - name: kibana-config
        configMap:
          name: kibana-config
          items:
            - key: kibana.yml
              path: kibana.yml
---
apiVersion: v1
kind: ConfigMap
metadata:
  namespace: default
  name: kibana-config
data:
  kibana.yml: |
    server.port: 5601
    server.host: "0.0.0.0"
    elasticsearch.hosts: ["http://elasticsearch:9200"]
    elasticsearch.requestTimeout: 3600000
    elasticsearch.shardTimeout: 3600000
    i18n.locale: "zh-CN"
    elasticsearch.username: "elastic"
    elasticsearch.password: "jjxkjkdgkdjgkkdjgk"
---
kind: Service
apiVersion: v1
metadata:
  labels:
    app: kibana
  name: kibana-service
  namespace: default
spec:
  ports:
    - port: 5601
      targetPort: 5601
  selector:
    app: kibana
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  namespace: default
  name: kibana
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/ssl-redirect: "false" #关闭SSL跳转

spec:
  tls:
  - hosts:
    - kibana.xxxx.com
    secretName: xxxx-com
  rules:
  - host: kibana.xxxx.com
    http:
      paths:
      - backend:
          serviceName: kibana-service
          servicePort: 5601
        path: /
```
