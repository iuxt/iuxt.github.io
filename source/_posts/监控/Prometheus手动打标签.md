---
title: Prometheus手动打标签
abbrlink: ac395656
cover: 'https://s3.babudiu.com/iuxt/public/Prometheus.svg'
categories:
  - 监控
tags:
  - monitor
  - Prometheus
  - prometheus
date: 2022-06-20 01:19:35
---

有时候需要给 Prometheus 打标签，比如说联邦集群接入，需要知道是哪个集群，remote write 写入的时候也需要做个标记。

## 直接在集群打标签

vim prometheus.yml

```yml
global:
  scrape_interval: 15s # Set the scrape interval to every 15 seconds. Default is every 1 minute.
  evaluation_interval: 15s # Evaluate rules every 15 seconds. The default is every 1 minute.
  # scrape_timeout is set to the global default (10s).

  external_labels:
    env: uat
    dept: ops
    project: xxx
...
```

这样就可以给集群内的所有 metrics 打上这三个标签。

## 通过联邦集群打标签

如果集群不好进行操作，可以通过联邦集群接入，在联邦主节点进行配置

```yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  scrape_timeout: 10s

scrape_configs:
  - job_name: 'federate-https'
    scrape_interval: 15s
    scrape_timeout: 15s
    honor_labels: true
    metrics_path: '/federate'
    scheme: https
    params:
      'match[]':
        - '{job=~".+"}'
    static_configs:
      - targets:
        - '10.0.0.11:9090'
        - '10.0.0.12:9090'
        labels:
          env: uat
          dept: ops
          project: xxx
```

## 给接入的 target 打标签

> 这种只是给当前这个 target 打标签，不是全局生效

```yml
  - job_name: node_exporter
    honor_timestamps: true
    scrape_interval: 5s
    scrape_timeout: 5s
    metrics_path: /metrics
    scheme: http
    follow_redirects: true
    static_configs:
    - targets:
      - 10.0.0.17:9100
      - 10.0.0.18:9100
      - 10.0.0.19:9100
      labels:
        env: uat
        dept: ops
        project: xxx
```
