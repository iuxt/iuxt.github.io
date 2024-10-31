---
title: 用Prometheus对nacos集群进行监控
categories:
  - 监控
tags:
  - nacos
  - prometheus
abbrlink: skma0p
cover: ''
date: 2024-09-30 16:24:24
---

参考官方文档：<https://nacos.io/zh-cn/docs/monitor-guide.html>

暴露 `metrics` 数据 需要修改配置文件，`spring boot` 支持通过环境变量来修改系统配置，在 `Kubernets` 环境下，可以通过增加环境变量的形式来暴露 `metrics` 数据。

```yml
kind: StatefulSet
apiVersion: apps/v1
metadata:
  name: nacos
  namespace: public
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nacos
  template:
    metadata:
      labels:
        app: nacos
    spec:
      containers:
        - name: nacos
          image: nacos/nacos-server:v2.1.0
          env:
...
            # 增加这个环境变量
            - name: management.endpoints.web.exposure.include
              value: '*'
...
```

增加环境变量后，nacos 服务会重启，重启后进入 Pod，执行命令查看是否有 metrics 数据：

```bash
curl localhost:8848/nacos/actuator/prometheus
```

## 数据接入 Prometheus

自动接入或手动接入按照需求选择一个。

### 自动接入

自动接入需要使用到 `Prometheus` 的自动发现机制，利用 `servcie discovery endpoint` 来接入，`Prometheus` 配置：

```yml
   global:
      scrape_interval:     30s
      evaluation_interval: 30s

    scrape_configs:
      - job_name: 'service_endpoints_metrics'
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
        - source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
          action: replace
          target_label: __address__
          regex: ([^:]+)(?::\d+)?;(\d+)
          replacement: $1:$2
        # 额外增加的标签
        - source_labels: [__meta_kubernetes_namespace]
          target_label: namespace
        - source_labels: [__meta_kubernetes_service_name]
          target_label: service_name
```

修改 nacos 的 service：

```yml
apiVersion: v1
kind: Service
metadata:
  name: nacos-svc
  namespace: public
  labels:
    app: nacos
  annotations:
    # 增加如下注解，即可被Prometheus自动发现
    prometheus.io/path: /nacos/actuator/prometheus
    prometheus.io/port: "8848"
    prometheus.io/scrape: "true"
spec:
  ports:
    - port: 8848
      name: server
      targetPort: 8848
    - port: 9848
      name: client-rpc
      targetPort: 9848
    - port: 9849
      name: raft-rpc
      targetPort: 9849
    ## 兼容1.4.x版本的选举端口
    - port: 7848
      name: old-raft-rpc
      targetPort: 7848
  type: ClusterIP
  selector:
```

查看 Prometheus 的 targets：
![image.png](https://static.zahui.fan/images/202409301700141.png)

### 手动接入

如果由于种种原因不能自动发现，可以手动配置的方式来接入到 `Prometheus`

```yml
scrape_configs:
- job_name: nacos
  honor_timestamps: true
  scrape_interval: 15s
  scrape_timeout: 10s
  metrics_path: '/nacos/actuator/prometheus'
  scheme: http
  follow_redirects: true
  static_configs:
    - targets:
      - '{ip1}:8848'
      - '{ip2}:8848'
      - '{ip3}:8848'
```

## Nacos metrics 含义

### jvm metrics

|指标	|含义|
|---|---|
|system_cpu_usage	|CPU 使用率|
|system_load_average_1m	|load|
|jvm_memory_used_bytes	|内存使用字节，包含各种内存区|
|jvm_memory_max_bytes	|内存最大字节，包含各种内存区|
|jvm_gc_pause_seconds_count	|gc 次数，包含各种 gc|
|jvm_gc_pause_seconds_sum	|gc 耗时，包含各种 gc|
|jvm_threads_daemon|	线程数|

### Nacos 监控指标

| 指标                                                  | 含义                            |
| --------------------------------------------------- | ----------------------------- |
| http_server_requests_seconds_count                  | http 请求次数，包括多种 (url,方法,code)  |
| http_server_requests_seconds_sum                    | http 请求总耗时，包括多种 (url,方法,code) |
| nacos_timer_seconds_sum                             | Nacos config 水平通知耗时           |
| nacos_timer_seconds_count                           | Nacos config 水平通知次数           |
| nacos_monitor{name='longPolling'}                   | Nacos config 长连接数             |
| nacos_monitor{name='configCount'}                   | Nacos config 配置个数             |
| nacos_monitor{name='dumpTask'}                      | Nacos config 配置落盘任务堆积数        |
| nacos_monitor{name='notifyTask'}                    | Nacos config 配置水平通知任务堆积数      |
| nacos_monitor{name='getConfig'}                     | Nacos config 读配置统计数           |
| nacos_monitor{name='publish'}                       | Nacos config 写配置统计数           |
| nacos_monitor{name='ipCount'}                       | Nacos naming ip 个数            |
| nacos_monitor{name='domCount'}                      | Nacos naming 域名个数 (1.x 版本)    |
| nacos_monitor{name='serviceCount'}                  | Nacos naming 域名个数 (2.x 版本)    |
| nacos_monitor{name='failedPush'}                    | Nacos naming 推送失败数            |
| nacos_monitor{name='avgPushCost'}                   | Nacos naming 平均推送耗时           |
| nacos_monitor{name='leaderStatus'}                  | Nacos naming 角色状态             |
| nacos_monitor{name='maxPushCost'}                   | Nacos naming 最大推送耗时           |
| nacos_monitor{name='mysqlhealthCheck'}              | Nacos naming mysql 健康检查次数     |
| nacos_monitor{name='httpHealthCheck'}               | Nacos naming http 健康检查次数      |
| nacos_monitor{name='tcpHealthCheck'}                | Nacos naming tcp 健康检查次数       |
| nacos_monitor{module="naming",name="serviceCount",} | Nacos 注册的服务数量                 |

### nacos 异常指标

| 指标                                                 | 含义                              |
| -------------------------------------------------- | ------------------------------- |
| nacos_exception_total{name='db'}                   | 数据库异常                           |
| nacos_exception_total{name='configNotify'}         | Nacos config 水平通知失败             |
| nacos_exception_total{name='unhealth'}             | Nacos config server 之间健康检查异常    |
| nacos_exception_total{name='disk'}                 | Nacos naming 写磁盘异常              |
| nacos_exception_total{name='leaderSendBeatFailed'} | Nacos naming leader 发送心跳异常      |
| nacos_exception_total{name='illegalArgument'}      | 请求参数不合法                         |
| nacos_exception_total{name='nacos'}                | Nacos 请求响应内部错误异常（读写失败，没权限，参数错误） |

### client metrics

|指标|	含义|
|---|---|
|nacos_monitor{name='subServiceCount'}	|订阅的服务数|
|nacos_monitor{name='pubServiceCount'}	|发布的服务数|
|nacos_monitor{name='configListenSize'}	|监听的配置数|
|nacos_client_request_seconds_count	|请求的次数，包括多种 (url,方法,code)|
|nacos_client_request_seconds_sum	|请求的总耗时，包括多种 (url,方法,code)|

## 告警规则制定

针对异常指标进行告警，修改 Prometheus alert 配置文件。告警规则待验证。

```yml
groups:
- name: nocas告警
  rules:
  - alert: "nocas服务注册数量异常"
    expr: nacos_monitor{module="naming",name="serviceCount",} < 10
    for: 1m
    labels:
      severity: critical
    annotations:
      description: "项目:{{$labels.project}} nocas当前注册数量:{{$value}}"
      summary: "服务注册数量异常"

  - alert: "Nacos naming leader发送心跳异常"
    expr: increase(nacos_exception_total{name='leaderSendBeatFailed'}[1m]) !=0
    for: 1m
    labels:
      severity: critical
    annotations:
      description: "项目:{{$labels.project}} 发送心跳异常数量为:{{$value}}"
      summary: "Nacos naming leader发送心跳异常"

  - alert: "Nacos config长连接数大于5000"
    expr: sum by (project,instance,dept) (irate(nacos_monitor{name='longPolling'}[5m])) > 5000
    for: 5m
    labels:
      severity: critical
    annotations:
      description: "项目:{{$labels.project}} 发送心跳异常数量为:{{$value}}"
      summary: "Nacos config长连接数大于5000"

  - alert: "Nacos config server之间健康检查异常"
    expr: sum by (project,instance,dept) (rate(nacos_exception_total{name='unhealth'}[1m]))  > 1
    for: 1m
    labels:
      severity: critical
    annotations:
      description: "项目:{{$labels.project}} config unhealth exception alert"
      summary: "Nacos config server之间健康检查异常"

  - alert: "Nacos naming推送失败数大于1"
    expr : sum by (project,instance,dept) (irate(nacos_monitor{name='failedPush'}[5m])) > 1
    for: 5m
    labels:
      severity: critical
    annotations:
      description: "项目:{{$labels.project}} 推送失败数 {{$value}}"
      summary: "Nacos naming推送失败数大于1"

  - alert: "Nacos naming写磁盘异常"
    expr : sum by (project,instance,dept) (rate(nacos_exception_total{name='disk'}[1m])) > 1
    for: 1m
    labels:
      severity: critical
    annotations:
      description: "项目:{{$labels.project}} 写磁盘异常"
      summary: "Nacos naming写磁盘异常"

  - alert: "Nacos config水平通知失败"
    expr : sum by (project,instance,dept) (rate(nacos_exception_total{name='configNotify'}[1m])) > 1
    for: 1m
    labels:
      severity: critical
    annotations:
      description: "项目:{{$labels.project}} 水平通知失败"
      summary: "Nacos config水平通知失败"

  - alert: "Nacos请求响应内部错误异常(读写失败,没权限,参数错误)"
    expr : sum by (project,instance,dept) (rate(nacos_exception_total{name='nacos'}[1m])) > 1
    for: 1m
    labels:
      severity: critical
    annotations:
      description: "项目:{{$labels.project}} 读写失败"
      summary: "Nacos请求响应内部错误异常(读写失败,没权限,参数错误)"

```
