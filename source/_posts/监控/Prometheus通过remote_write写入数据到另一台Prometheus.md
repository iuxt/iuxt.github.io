---
title: Prometheus通过remote_write写入数据到另一台Prometheus
abbrlink: 666e547f
cover: 'https://s3.babudiu.com/iuxt/public/Prometheus.svg'
categories:
  - 监控
tags:
  - Prometheus
  - prometheus
date: 2022-06-09 18:57:20
---

假设 `Prometheus1` 是一个集群内的 `Prometheus`，需要远程写入数据到 `Prometheus_Core`

## Prometheus_Core 开启 remote_write_receiver

`Prometheus_Core` 需要打开接收远程写入的功能，通过增加启动参数 `--web.enable-remote-write-receiver`：

```bash
./prometheus --web.enable-remote-write-receiver --web.config.file=web.yml --web.listen-address=0.0.0.0:9090
```

> 远程写的接口地址 `/api/v1/write`

## Prometheus_Core 开启认证

参考 [Prometheus开启basic_auth认证](/posts/165a0cd3/)

## Prometheus1 配置 remote_write

`Prometheus1` 需要将 `remote_write` 写入到 `Prometheus_Core` 的远程接口

```yml
remote_write:
- url: "http://127.0.0.1:9090/api/v1/write"
  basic_auth:                   # 开启认证后需要配置
    username: admin             # 开启认证后需要配置
    password: xxxxxx            # 开启认证后需要配置
  remote_timeout: 30s
  tls_config:
    insecure_skip_verify: true
  queue_config:
    capacity: 500
    max_shards: 1000
    min_shards: 1
    max_samples_per_send: 100
    batch_send_deadline: 5s
    min_backoff: 30ms
    max_backoff: 100ms
```

## 远程写如何判断监控是否离线

远程写不像联邦集群，联邦是事先配置好的，远程写的方式，被写入的 Prometheus 是无法预知是谁在向我发送数据的。可以通过 absent 函数来实现。

### 收集 Prometheus 自身的监控指标

想要监控 `Prometheus` 的状态，则需要收集自身的监控指标（比如 `up` 指标），确保 `Prometheus1` 中有如下配置：

```yml
scrape_configs:
- job_name: 'prometheus'
  static_configs:
    - targets: ['localhost:9090']
```

在 `Prometheus_Core` 的告警配置中做如下配置，其中 `absent` 在查询不到数据的情况下返回 `1`，由于 `absent` 返回的数据不带标签，所以独立写成一条告警规则。

```yaml
groups:
- name: Prometheus1推送告警
  rules:
  - alert: "Prometheus1推送离线"
    expr: absent(up{job=~"prometheus",project=~"prometheus1"}) == 1
    for: 3m
    labels:
      severity: critical
    annotations:
      description: '远程写 Prometheus1 无数据'
      summary: "远程写 Prometheus1 无数据"
```