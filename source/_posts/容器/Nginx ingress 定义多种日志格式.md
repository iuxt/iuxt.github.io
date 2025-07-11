---
title: Nginx Ingress 定义多种日志格式
abbrlink: dcab3f5f
cover: 'https://s3.babudiu.com/iuxt/public/Nginx.svg'
categories:
  - 容器
tags:
  - ingress
  - nginx
date: 2022-04-08 19:47:39
---

生产环境有个项目需要打开 nginx 日志的 request_body 日志记录，但是如果把默认的日志格式改掉的话，日志量就太大了，所以查了一下针对某个域名进行搜集不同的日志。

k8s 的 ingress 其实就是 nginx 封装了一层，所以 nginx 可以做的，ingress 也都可以做，nginx 我们知道可以定义不同的日志格式，然后不同的虚拟主机来引用就好了。先查看文档，发现了 nginx-ingress 有一个叫 http-snippet 的参数，意思就是在 http 块下面增加一段原生的 Nginx 配置

## 在 configmap 里面增加一个新的日志格式配置

我们可以在 ingress-nginx 的 configmap 里面添加一个新的日志格式：

```yaml
kind: ConfigMap
apiVersion: v1
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
  labels:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
data:
  enable-underscores-in-headers: "true"
  allow-snippet-annotations: "true"
  use-gzip: "true"
  gzip-level: "2"

  proxy-body-size: 100M # 对应nginx client_max_body_size
  client-body-buffer-size: "8M"
  client-header-buffer-size: "2M"

  proxy-connect-timeout: "300"
  proxy-read-timeout: "300"
  proxy-send-timeout: "300"
  proxy-buffer-size: "32k"
  connection-proxy-header: "keep-alive"
  # 默认的日志格式
  log-format-upstream: '{"@timestamp": "$time_iso8601","server_addr":"$server_addr","remote_addr":"$remote_addr","scheme":"$scheme","request_method":"$request_method","request_uri": "$request_uri","request_length": "$request_length","uri": "$uri","request_time":$request_time,"body_bytes_sent":$body_bytes_sent,"bytes_sent":$bytes_sent,"status":"$status","upstream_host":"$upstream_addr","domain":"$host","http_referer":"$http_referer","http_user_agent":"$http_user_agent","http_app_id":"$http_app_id","x_forwarded":"$http_x_forwarded_for","up_r_time":"$upstream_response_time","up_status":"$upstream_status","os_plant":"$http_os_plant","os_version":"$http_os_version","app_version":"$http_app_version","app_build":"$http_app_build","guid":"$http_guid","resolution_ratio":"$http_resolution_ratio","ip":"$http_ip","imsi":"$http_imsi","listen_port":"$server_port"}'
  # 定义了一个新的日志格式
  http-snippet: |
    log_format  with_body escape=json  '{"@timestamp": "$time_iso8601",'
      '"server_addr":"$server_addr",'
      '"remote_addr":"$remote_addr",'
      '"scheme":"$scheme",'
      '"request_method":"$request_method",'
      '"request_uri": "$request_uri",'
      '"request_length": "$request_length",'
      '"uri": "$uri", '
      '"request_time":$request_time,'
      '"body_bytes_sent":$body_bytes_sent,'
      '"bytes_sent":$bytes_sent,'
      '"dm":"$request_body",'
      '"status":"$status",'
      '"upstream_host":"$upstream_addr",'
      '"domain":"$host",'
      '"http_referer":"$http_referer",'
      '"http_user_agent":"$http_user_agent",'
      '"http_host":"$http_host",'
      '"http_app_id":"$http_app_id"'
      '}';
```

## 然后修改对应的 ingress 资源

```yaml
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: test
  namespace: test
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
    # 指定日志格式为with_body
    nginx.ingress.kubernetes.io/configuration-snippet: |
            access_log /dev/stdout with_body;

spec:
  tls:
  - hosts:
    - test.i.com
    secretName: i-com
  rules:
  - host: test.i.com
    http:
      paths:
      - backend:
          serviceName: test
          servicePort: 80
        path: /
      - backend:
          serviceName: test
          servicePort: 8080
        path: /sys
```