---
title: 生产环境Prometheus监控架构记录
categories:
  - 监控
tags:
  - prometheus
abbrlink: sn6pu2
date: 2024-11-19 14:25:14
cover: https://static.zahui.fan/images/202411151309207.png
---

比如有 30 家客户，每一个客户都有自己的 Kubernetes 集群，部署方式千差万别，还有客户不使用 Kubernetes 的，使用虚拟机部署，那么怎么对这么多客户的机器、服务进行有效的监控，本文记录一下监控的架构方案。

## 监控架构图

![](https://static.zahui.fan/images/202411201501698.png)

说明：
Prometheus Core 是一个核心的 Prometheus，所有其他 Prometheus 的数据都汇总到这里，查询、告警等都使用这个 Prometheus

## Prometheus Core

这个是核心的 Prometheus，其他客户的 Prometheus 通过联邦接入或者 远程写 (remote write) 的方式来写入数据到这个 Prometheus 中。Prometheus Core 可以更换成 [VictoriaMetrics](/posts/e59d8e32)

### 联邦接入配置

```yml
  # http 接口联邦
  - job_name: 'federate-http'
    scrape_interval: 30s
    scrape_timeout: 30s
    honor_labels: true
    metrics_path: '/federate'
    basic_auth:
      username: 'admin'
      password: 'password'
    params:
      'match[]':
        - '{job=~".+"}'
    file_sd_configs:
      - files:
          - /data/prometheus/conf.d/federate_http.yml
        refresh_interval: 30s

  # https 接口联邦
  - job_name: 'federate-https'
    scrape_interval: 30s
    scrape_timeout: 30s
    honor_labels: true
    metrics_path: '/federate'
    basic_auth:
      username: 'admin'
      password: 'password'
    scheme: https
    params:
      'match[]':
        - '{job=~".+"}'
    file_sd_configs:
      - files:
          - /data/prometheus/conf.d/federate_https.yml
        refresh_interval: 1m
    tls_config:
      insecure_skip_verify: true
```

对应的 `federate_http.yml`

```yml
- targets:
  - 10.252.0.250:9090
  labels:
    env: "test"
    k8s: k8s-test
    type: "prometheus"

- targets:
  - 10.249.48.250:9090
  labels:
    env: "prod"
    k8s: k8s-prod
    type: "prometheus"
```

### 远程写入配置

修改 Prometheus 启动参数，增加：`--enable-feature=remote-write-receiver` 启动参数。

## Kubernetes 中部署有集群权限的 Prometheus

适合有集群权限的 Prometheus,可以创建 serviceaccount 和 clusterrole clusterrolebinding 资源才可以自动发现

参考 Prometheus 官方 GitHub 上的配置文件 <https://github.com/prometheus/prometheus/blob/main/documentation/examples/rbac-setup.yml>

完整的配置如下：

```yml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: prometheus
rules:
- apiGroups: [""]
  resources:
  - nodes
  - nodes/proxy
  - services
  - endpoints
  - pods
  verbs: ["get", "list", "watch"]
- apiGroups:
  - extensions
  - networking.k8s.io
  resources:
  - ingresses
  verbs: ["get", "list", "watch"]
- nonResourceURLs: ["/metrics"]
  verbs: ["get"]

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prometheus
  namespace: monitor

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: prometheus
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: prometheus
subjects:
- kind: ServiceAccount
  name: prometheus
  namespace: monitor

---
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    name: prometheus-deployment
  name: prometheus
  namespace: monitor
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      serviceAccountName: prometheus
      containers:
      - image: prom/prometheus:v2.34.0
        name: prometheus
        command:
        - "/bin/prometheus"
        args:
        - "--config.file=/etc/prometheus/prometheus.yml"
        - "--storage.tsdb.path=/prometheus"
        - "--storage.tsdb.retention=24h"
        - "--web.enable-lifecycle"
        ports:
        - containerPort: 9090
          protocol: TCP
        volumeMounts:
        - name: data
          mountPath: "/prometheus"
        # 这种方式挂载，会将原始目录整个挂载，也就是看不到原始的文件了。
        # - name: prometheus-config
        #   mountPath: /etc/prometheus
        - name: prometheus-config                # volumes的名字
          mountPath: /etc/prometheus/prometheus.yml     # 容器内的目录
          subPath: prometheus.yml                       # 指定configmap里面的key
        - name: prometheus-config                # volumes的名字
          mountPath: /etc/prometheus/web.yml     # 容器内的目录
          subPath: web.yml                       # 指定configmap里面的key
        resources:
          requests:
            cpu: "1"
            memory: "2Gi"
          limits:
            cpu: "1"
            memory: "2Gi"
      volumes:
      - name: data
        emptyDir: {}
      - name: prometheus-config
        configMap:
          name: prometheus-config
---
kind: Service
apiVersion: v1
metadata:
  labels:
    app: prometheus
  name: prometheus
  namespace: monitor
spec:
  # type: NodePort
  ports:
  - port: 9090
    targetPort: 9090
    # nodePort: 30090
  selector:
    app: prometheus
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: prometheus
  namespace: monitor
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"

spec:
  tls:
  - hosts:
    - prometheus.i.com
    secretName: i-com
  rules:
  - host: prometheus.i.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: prometheus
            port:
              number: 9090
```

`configmap.yml`

```yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitor
data:
  web.yml: |
    basic_auth_users:
      admin: $2y$05$UKSS18ztdsUNoEuXYScr2OE1TCMe1hWnmD6JuwUi/uPTJayHIakae
  prometheus.yml: |
    global:
      scrape_interval:     15s
      evaluation_interval: 15s
      
      # 全局标签
      external_labels:
        env: prod
        dept: ops
        project: example
        k8s: example

    scrape_configs:
      - job_name: 'apiservers'
        kubernetes_sd_configs:
        - role: endpoints
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
        - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
          action: keep
          regex: default;kubernetes;https

      - job_name: 'cadvisor'
        kubernetes_sd_configs:
        - role: node
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
          insecure_skip_verify: false
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
        - action: labelmap
          regex: __meta_kubernetes_node_label_(.+)
        - target_label: __address__
          replacement: kubernetes.default.svc:443
        - source_labels: [__meta_kubernetes_node_name]
          regex: (.+)
          target_label: __metrics_path__
          replacement: /api/v1/nodes/${1}/proxy/metrics/cadvisor

      - job_name: "kubelet"
        honor_timestamps: true
        scrape_interval: 1m
        scrape_timeout: 1m
        metrics_path: /metrics
        scheme: https
        kubernetes_sd_configs:
        - role: node
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
          insecure_skip_verify: false
        relabel_configs:
        - separator: ;
          regex: __meta_kubernetes_node_label_(.+)
          replacement: $1
          action: labelmap
        - separator: ;
          regex: (.*)
          target_label: __address__
          replacement: kubernetes.default.svc:443
          action: replace
        - source_labels: [__meta_kubernetes_node_name]
          separator: ;
          regex: (.+)
          target_label: __metrics_path__
          replacement: /api/v1/nodes/${1}/proxy/metrics
          action: replace

      - job_name: 'service_endpoints_metrics'
        # service 需要添加元数据 通常需要有 /metrics 接口返回 prometheus 数据格式
        # prometheus.io/path: /metrics
        # prometheus.io/port: "8080"
        # prometheus.io/scrape: "true"

        kubernetes_sd_configs:
        - role: endpoints
        relabel_configs:
        
        # 带注解  prometheus.io/scrape: true  的才会被采集，不然不采集，不入库
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
          action: keep
          regex: true
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scheme]
          action: replace
          target_label: __scheme__
          regex: (https?)
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
          action: replace
          target_label: __metrics_path__
          regex: (.+)
        - source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
          action: replace
          target_label: __address__
          regex: ([^:]+)(?::\d+)?;(\d+)
          replacement: $1:$2
        - action: labelmap
          regex: __meta_kubernetes_service_label_(.+)
```

> 注：如果需要监控 pod 状态，比如 pod 重启次数等数据，需要安装 `kube-state-metrics` 并通过服务发现的方式将数据接入到 Prometheus

## Kubernetes 中部署无集群权限的 Prometheus

有的客户不给集群权限，比如一个大的 Kubernetes 集群中，给分配了一个 namespace，其他 namespace 是别人的服务，当然不能给你很高的权限，或者是个定制的控制界面，无法进行创建 serviceaccount 的操作等。这样只能监控一些基础的信息，比如 service 通不通（通过 service 地址来监控），监控一些中间件的监控数据（手动配置 exporter 的 service 地址）

```yml
global:
  scrape_interval:     30s
  evaluation_interval: 30s
  external_labels:
    env: prod
    dept: ops
    project: example
    k8s: example

scrape_configs:
- job_name: "mysql_instance"
  static_configs:
  - targets: ['mysql-exporter:9104']
    labels:
      app: prod_example_mysql

- job_name: "redis_instance"
  static_configs:
  - targets: ['redis-exporter:9121']
    labels:
      app: prod_example_redis

- job_name: "port"
  scrape_interval: 20s
  params:
    module: [tcp_connect]
  metrics_path: /probe
  scheme: http
  static_configs:
  - targets: ['10.133.103.171:6379']
    labels:
      app: redis
  - targets: ['10.133.103.170:3306']
    labels:
      app: mysql
  relabel_configs:
    - source_labels: [__address__]
      target_label: __param_target

    - source_labels: [__param_target]
      target_label: addr
    - source_labels: [__param_target]
      action: replace
      regex: (.+):(.*)
      replacement: $2
      target_label: port

    - target_label: __address__
      replacement: "blackbox-exporter:9115"

# 这里手动配置的service请求地址
- job_name: "http_get"
  scrape_interval: 20s
  metrics_path: /probe
  scheme: http
  params:
    module: [http_2xx]
  static_configs:
  - targets: ['prod-idk-mob-sdk-server:5003/actuator/info']
    labels:
      app: idk-mob-sdk-server
  - targets: ['prod-public-hsm-services:8007/hsm/actuator/health']
    labels:
      app: public-hsm-services

  relabel_configs:
    - source_labels: [__address__]
      target_label: __param_target
    - source_labels: [__param_target]
      target_label: instance
    - target_label: __address__
      replacement: "blackbox-exporter:9115"
```

## 虚拟机部署

类似于上面的 Kubernetes 中部署的无权限 Prometheus

## 没有公网域名的 Prometheus

没有公网域名意味着无法通过 Prometheus Core 来拉取（联邦），可以使用 remote write 远程写的方式写入到目标的 Prometheus Core 中

`vim prometheus.yml`

```yml
remote_write:
- url: "https://prometheus.example.com/api/v1/write"
  basic_auth:
    username: admin
    password: password
  remote_timeout: 30s
  tls_config:
    insecure_skip_verify: true
  queue_config:
    capacity: 2000
    max_shards: 1000
    min_shards: 1
    max_samples_per_send: 1000
    batch_send_deadline: 5s
    min_backoff: 30ms
    max_backoff: 100ms
```

### 远程写 Prometheus 自身挂掉如何监控

使用 absent 函数来做判断 具体可以看 [Prometheus通过remote_write写入数据到另一台Prometheus](/posts/666e547f/)

## basicauth 认证

关于认证，可以看 [Prometheus开启basic_auth认证](/posts/165a0cd3/)

