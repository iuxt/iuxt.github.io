---
title: 使用blackbox-exporter做域名监控
categories:
  - 监控
tags: [prometheus, 监控]
abbrlink: sxztsa
date: 2025-06-17 17:16:58
cover: ""
updated: 2025-06-18 15:28:39
---

## blackbox 创建模块

对应的 blackbox exporter 的配置文件：

```yml
    modules:
      http_2xx:
        prober: http
        timeout: 5s
        http:
          valid_http_versions: ["HTTP/1.1", "HTTP/2"]
          valid_status_codes: [200]
          method: GET
          preferred_ip_protocol: "ip4"
      http_post_2xx:
        prober: http
        timeout: 5s
        http:
          valid_http_versions: ["HTTP/1.1", "HTTP/2"]
          method: POST
          preferred_ip_protocol: "ip4"
      tcp_connect:
        prober: tcp
        timeout: 2s
      icmp:
        prober: icmp
        timeout: 2s
        icmp:
          preferred_ip_protocol: "ip4"
      http_accept_404:
        prober: http
        timeout: 10s
        http:
          valid_status_codes: [200, 201, 204, 404]  # 404 也被视为正常
          method: GET
          preferred_ip_protocol: "ip4"
          no_follow_redirects: false
```

其中：
- http_2xx： get 请求 200 认为是正常的
- http_post_2xx： post 请求 200 认为是正常的
- tcp_connect： 测试端口是不是通的
- icmp：能否 ping 通
- http_accept_404： get 请求，404 也认为是正常的

## 配置 Prometheus

### HTTP 监控 只有 200 是正常请求

```yaml
      - job_name: 'http_get'
        metrics_path: /probe
        params:
          module: [http_2xx]
        static_configs:
          - targets: ['https://test.com']
            labels:
              app: 生产环境域名
          - targets: ['http://1.1.1.1:8888']
            labels:
              app: 测试IP地址
        relabel_configs:
          - source_labels: [__address__]
            target_label: __param_target
          - target_label: __address__
            replacement: blackbox-exporter.monitor.svc:9115
          - source_labels: [__param_target]
            target_label: instance
```

### HTTP 监控 2xx 和 404 都认为是正常请求

```yml
      - job_name: 'http_get_with_404'
        metrics_path: /probe
        params:
          module: [http_accept_404]
        static_configs:
          - targets: ['https://test.com']
            labels:
              app: 生产环境域名
          - targets: ['http://1.1.1.1:8888']
            labels:
              app: 测试IP地址
        relabel_configs:
          - source_labels: [__address__]
            target_label: __param_target
          - target_label: __address__
            replacement: blackbox-exporter.monitor.svc:9115
          - source_labels: [__param_target]
            target_label: instance
```

### TCP 端口监控

```yaml
      - job_name: port
        honor_timestamps: true
        params:
          module:
          - tcp_connect
        scrape_interval: 10s
        scrape_timeout: 10s
        metrics_path: /probe
        scheme: http
        follow_redirects: true
        static_configs:
          - targets: ['1.1.1.1:8662']
            labels:
              app: 密码机-1
          - targets: ['2.2.2.2:8662']
            labels:
              app: 密码机-2
        relabel_configs:
        - source_labels: [__address__]
          separator: ;
          regex: (.*)
          target_label: __param_target
          replacement: $1
          action: replace
        - source_labels: [__param_target]
          separator: ;
          regex: (.*)
          target_label: addr
          replacement: $1
          action: replace
        - source_labels: [__param_target]
          separator: ;
          regex: (.+):(.*)
          target_label: port
          replacement: $2
          action: replace
        - separator: ;
          regex: (.*)
          target_label: __address__
          replacement: blackbox-exporter:9115
          action: replace
```

### 验证

```bash
curl "http://blackbox-exporter.monitor:9115/probe?target=http://a.test.com&module=http_accept_404"
```

## PromQL 常用查询

```bash
# 查询证书到期时间
(probe_ssl_earliest_cert_expiry{project="project1",env="prod"} - time()) / 60 / 60 / 24

# 查询接口通不通
probe_success{project="project1",env="prod"}

# 查询接口延迟，包括 tcp监控 http监控
probe_duration_seconds{project="project1",env="prod"}
```
