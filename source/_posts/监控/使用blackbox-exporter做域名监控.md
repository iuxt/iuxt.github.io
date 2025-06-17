---
title: 使用blackbox-exporter做域名监控
categories:
  - 监控
tags: ['']
abbrlink: sxztsa
date: 2025-06-17 17:16:58
cover: ''
updated: 2025-06-17 17:40:22
---

## 创建模块

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

验证：

```bash
curl "http://blackbox-exporter.monitor:9115/probe?target=http://a.test.com&module=http_accept_404"
```
