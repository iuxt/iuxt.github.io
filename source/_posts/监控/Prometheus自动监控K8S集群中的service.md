---
title: Prometheus自动监控K8S集群中的service
categories:
  - 监控
tags: ['']
abbrlink: sw6yvo
date: 2025-05-13 16:42:59
cover: ''
updated: 2025-05-27 10:36:08
---

## 定义

部署在 Kubernetes 上的 Prometheus 是有自动发现机制的，可以自动监控 service 通不通、监控 ingress 上的域名通不通等等。

## HTTP Get 监控

### service 的 HTTP Get 监控

```yaml
      - job_name: 'service_http_get'

        # service 需要添加注解
        # prometheus.io/http_get_path: /actuator/info
        # prometheus.io/http_get: "true"
        # prometheus.io/http_get_port: "8080"

        metrics_path: /probe
        params:
          module: [http_2xx]
        kubernetes_sd_configs:
        - role: service
        relabel_configs:
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_http_get]
          action: keep
          regex: true

        - source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_http_get_port, __meta_kubernetes_service_annotation_prometheus_io_http_get_path]
          action: replace
          # 正则解释：
          # 第一组([^:]+) - 匹配地址部分（直到冒号或结尾）
          # (:[0-9]+)? - 可选匹配端口部分
          # ;([0-9]+) - 匹配注解中的端口
          # ;(/.*)? - 匹配注解中的路径（可选）
          regex: ([^:]+)(:[0-9]+)?;([0-9]+);(/.*)?
          replacement: http://$1:$3$4
          target_label: __param_target

        - target_label: __address__
          replacement: blackbox-exporter.monitor.svc:9115

        - source_labels: [__param_target]
          target_label: instance

        # 额外添加标签
        - action: labelmap
          regex: __meta_kubernetes_service_label_(.+)

        - source_labels: [__meta_kubernetes_namespace]
          target_label: namespace

        - source_labels: [__meta_kubernetes_service_name]
          target_label: service_name

        - source_labels: [__meta_kubernetes_service_name]
          target_label: app

```

### ingress 的 HTTP Get 监控

```yaml

      - job_name: 'ingress_http_get'

        # ingress 需要添加注解才可被自动发现
        # prometheus.io/http_get_path: /actuator/info
        # prometheus.io/http_get: "true"

        metrics_path: /probe
        params:
          module: [http_2xx]
        kubernetes_sd_configs:
        - role: ingress
        relabel_configs:

        - source_labels: [__meta_kubernetes_ingress_annotation_kubernetes_io_http_get]
          action: keep
          regex: true

        - source_labels: [__meta_kubernetes_ingress_scheme,__address__,__meta_kubernetes_ingress_annotation_kubernetes_io_http_get_path]
          target_label: __param_target
          regex: (.+);(.+);(.*)
          replacement: ${1}://${2}${3}

        - target_label: __address__
          replacement: blackbox-exporter.monitor.svc:9115

        - source_labels: [__param_target]
          target_label: instance

        # 额外添加标签
        - action: labelmap
          regex: __meta_kubernetes_ingress_label_(.+)

        - source_labels: [__meta_kubernetes_namespace]
          target_label: kubernetes_namespace

        - source_labels: [__meta_kubernetes_ingress_name]
          target_label: kubernetes_name
        - source_labels: [__meta_kubernetes_ingress_name]
          target_label: app

```

## 收集业务 Metrics

比如有的业务会暴露出 metrics，比如 Prometheus 的各种 exporter，一个一个接入比较麻烦，也可以利用 service 自动发现的形式接入 Prometheus

```yaml

      - job_name: 'service_endpoints_metrics'
        # service 需要添加元数据 通常需要有 /metrics 接口返回 prometheus 数据格式
        # prometheus.io/path: /metrics
        # prometheus.io/port: "8080"
        # prometheus.io/scrape: "true"

        kubernetes_sd_configs:
        - role: endpoints
        relabel_configs:
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
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_env]
          action: replace
          target_label: env
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_dept]
          action: replace
          target_label: dept
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_app]
          action: replace
          target_label: app
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_project]
          action: replace
          target_label: project
        - source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
          action: replace
          target_label: __address__
          regex: ([^:]+)(?::\d+)?;(\d+)
          replacement: $1:$2
        - action: labelmap
          regex: __meta_kubernetes_service_label_(.+)

          
        # 新增标签
        - source_labels: [__meta_kubernetes_namespace]
          action: replace
          target_label: kubernetes_namespace
        - source_labels: [__meta_kubernetes_service_name]
          action: replace
          target_label: kubernetes_service_name
        - source_labels: [__meta_kubernetes_pod_host_ip]
          action: replace
          target_label: node_ip
        - source_labels: [__meta_kubernetes_pod_name]
          action: replace
          target_label: pod_name
```

在需要接入监控的 service 上配置注解即可实现自动接入，注解如下：

```yaml
kind: Service
apiVersion: v1
metadata:
  name: ops-kafka-exporter
  namespace: kafka-exporter
  annotations:
    prometheus.io/scrape: 'true'
    prometheus.io/path: /metrics
    prometheus.io/port: '9308'
    prometheus.io/project: ops
    prometheus.io/app: ops-kafka
    prometheus.io/dept: ep
    prometheus.io/env: prod
spec:
  ports:
    - protocol: TCP
      port: 9308
      targetPort: 9308
  selector:
    app: ops-kafka-exporter
  type: ClusterIP
```
