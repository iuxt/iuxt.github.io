---
title: 基于VictoriaMetrics的大规模监控实战
abbrlink: e59d8e32
categories:
  - 监控
tags:
  - monitor
  - 配置记录
  - prometheus
date: 2022-06-17 04:02:36
---

victoriametrics 原生支持水平扩展，并且大部分兼容 Prometheus 语法，官方文档地址：<https://docs.victoriametrics.com/>

这个是 victoriametrics 官方的集群架构

![victoriametrics集群架构](https://s3.babudiu.com/iuxt/images/20220617162704.png)

我公司用到的集群架构

![我公司用到的集群](https://s3.babudiu.com/iuxt/images/202206182239511.png)

目前用到 3 台机器

| IP          | 部署的服务                                           |
| ----------- | ---------------------------------------------- |
| 10.0.0.21 | vmauth、vmselect、vminsert、vmstorage、vmalert |
| 10.0.0.22 | vmselect、vminsert、vmstorage                  |
| 10.0.0.23 | vmselect、vminsert、vmstorage                  |

## vmstorage

首先需要把存储部署上，多个存储之间数据是不同步的，也就是说所有的 storege 组件之间是感知不到彼此的。通过 vmselect 和 vminsert 采用一致性 hash 算法来确定读取/写入哪台节点。

vmstorage 启动命令

```bash
./vmstorage-prod -httpListenAddr "0.0.0.0:8482" \   # vmstorage监听端口
    -storageDataPath ./data \                       # 数据存储位置
    -retentionPeriod 60d \                          # 数据保留多久
    -vminsertAddr "0.0.0.0:8400" \                  # insert服务连接的端口
    -vmselectAddr "0.0.0.0:8401" \                  # select服务连接的端口
    -dedup.minScrapeInterval=30s \                  # 和vmselect保持一致
    -loggerTimezone "Asia/Shanghai" \
    -loggerLevel INFO
```

## vminsert

```bash
./vminsert-prod -httpListenAddr "0.0.0.0:8480" \
    -storageNode 10.0.0.21:8400,10.0.0.22:8400,10.0.0.23:8400 \       # 指定所有storege节点
    -replicationFactor 2 \                                                  # 副本数2
    -loggerTimezone"Asia/Shanghai" \
    -loggerLevel INFO
```

## vmselect

vmselect 启动命令

```bash
./vmselect-prod -httpListenAddr "0.0.0.0:8481" \
    -selectNode 10.0.0.21:8481,10.0.0.22:8481,10.0.0.23:8481 \    # select的所有节点
    -storageNode 10.0.0.21:8401,10.0.0.22:8401,10.0.0.23:8401 \   # 指定所有storage节点
    -dedup.minScrapeInterval=30s \                                      # 重复数据删除，如果是从Prometheus写入的话，必须和Prometheus的scrape_interval保持一致。
    -loggerTimezone "Asia/Shanghai" \
    -loggerLevel INFO
```

## vmalert

```bash
./vmalert-prod -rule=./rules/* \                            # 告警规则目录
    -datasource.url=http://10.0.0.21:8427 \               # vmselect的url,一般都是负载均衡地址
    -datasource.basicAuth.username admin \                  # vmselect的url认证用户名
    -datasource.basicAuth.password 123456 \                # vmselect的url认证密码
    -notifier.url=http://10.0.0.11:9093 \                 # alertmanager地址
    -remoteWrite.url=http://10.0.0.21:8427 \              # vminsert的url,一般都是负载均衡地址
    -remoteWrite.basicAuth.username admin \                 # vminsert的url认证用户名
    -remoteWrite.basicAuth.password 123456 \               # vminsert的url认证密码
    -evaluationInterval=15s \
    -httpListenAddr=0.0.0.0:8080
```

## 负载均衡配置

### vmauth 负载均衡配置

```bash
./vmauth-prod -auth.config=./vmauth.yml
```

其中 vmauth.yml 的配置

```yml
users:
- username: "admin"
  password: "123456"
  url_map:
  - src_paths:
    - "/api/v1/query"
    - "/api/v1/query_range"
    - "/api/v1/label/[^/]+/values"
    url_prefix:
    - "http://10.0.0.21:8481/select/0/prometheus"
    - "http://10.0.0.22:8481/select/0/prometheus"
    - "http://10.0.0.23:8481/select/0/prometheus"
  - src_paths: ["/api/v1/write"]
    url_prefix:
    - "http://10.0.0.21:8480/insert/0/prometheus"
    - "http://10.0.0.22:8480/insert/0/prometheus"
    - "http://10.0.0.23:8480/insert/0/prometheus"
#    headers:
#    - "X-Scope-OrgID: abc"
```

### nginx 负载均衡配置

如果你不想用 vmauth，nginx 功能可以完全覆盖 vmauth

nginx 配置示例：

```text
upstream  vmselect {
    server  10.0.0.21:8481 weight=5 ;
    server  10.0.0.22:8481 weight=5 ;
    server  10.0.0.23:8481 weight=5 ;
}

server {
    listen 8000;
    server_name _;
    auth_basic "authentication";                # 开启基本认证
    auth_basic_user_file conf.d/.htpasswd;      # 密码文件
    location / {
        proxy_pass http://vmselect/select/0/prometheus/;
    }
}

upstream vminsert {
    server  10.0.0.21:8480 weight=5 ;
    server  10.0.0.22:8480 weight=5 ;
    server  10.0.0.23:8480 weight=5 ;
}

server {
    listen 8001;
    server_name _;
    auth_basic "authentication";                # 开启基本认证
    auth_basic_user_file conf.d/.htpasswd;      # 密码文件
    location / {
        proxy_pass http://vminsert/insert/0/prometheus/;
    }
}
```

.htpasswd 文件格式：

```text
admin:$1$QYnl4A1Q$I8Q712.eKtG9m7sAb9oeM1
```

> admin 是用户名, : 后面的是密码， 密码可以使用 `openssl passwd -1 123456` 来生成（假设原始密码是 123456）

## 常用的配置

### Prometheus 通过 remote_write 写入 vm 集群

> 官方文档：<https://prometheus.io/docs/prometheus/latest/configuration/configuration/#remote_write>

```yml
remote_write:
- url: "http://10.0.0.21:8001/api/v1/write"                           # 通过负载均衡地址
# - url: "http://10.0.0.21:8480/insert/0/prometheus/api/v1/write"     # 直接连接vminsert组件
  basic_auth:
    username: admin
    password: 123456
  remote_timeout: 30s
  tls_config:
    insecure_skip_verify: true
  queue_config:
    capacity: 2500
    max_shards: 200
    min_shards: 1
    max_samples_per_send: 500
    batch_send_deadline: 5s
    min_backoff: 30ms
    max_backoff: 5s
```

参数说明：

> 官方地址：<https://prometheus.io/docs/practices/remote_write/>

- capacity

    定义：每个内存队列（shard：分片）的容量。

    一旦 WAL 被阻塞，就无法将样本附加到任何分片，并且所有吞吐量都将停止。所以在大多数情况下，单个队列容量应足够打以避免阻塞其他分片，但是太大的容量可能会导致过多的内存消耗，并导致重新分片期间清除队列的时间更长。

    容量建议：将容量设置为 3-10 倍 `max_samples_per_send`

- max_shards

    顾名思义，最大的分片数（即队列数），也可以理解为远程写的并行度。peometheus 远程写的时候会使用所有的分片，只有在写队列落后于远程写的速度，使用的队列数会达到 max_shards,目的在于提高远程写的吞吐量。

    PS：在操作过程中，Prometheus 将根据传入的采样率，未发送的未处理样本数以及发送每个样本所花费的时间，连续计算要使用的最佳分片数。（实际的分片数是动态调整的）

- min_shards

    最小分片配置 Prometheus 使用的最小分片数量，并且是远程写入开始时使用的分片数量。如果远程写入落后，Prometheus 将自动扩大分片的数量，因此大多数用户不必调整此参数。但是，增加最小分片数将使 Prometheus 在计算所需分片数时避免在一开始就落后。

- max_samples_per_send

    定义：每次远程写发送的最大指标数量，即批处理；

    这个值依赖于远程存储系统，对于一些系统而言，在没有显著增加延迟的情况下发送更多指标数据而运行良好，然而，对于另外一些系统而言，每次请求中发送大量指标数据可能导致其出现故障，使用的默认值是适用于绝大多数系统的。

- batch_send_deadline

    定义：单一分片批量发送指标数据的最大等待时间；

    即使排队的分片尚未达到 max_samples_per_send，也会发送请求。 对于对延迟不敏感的小批量系统，可以增加批量发送的截止时间，以提高请求效率。

- min_backoff

    定义：远程写失败的最小等待时间；

    min_backoff 是第一次的重试等待时间，第二次等待时间是其 2 倍，以此类推，直到 max_backoff 的值；

- max_backoff

    定义：远程写失败的最大等待时间；

### Grafana 直接查询 VM 集群

Grafana 配置地址：

| 说明         | 地址                                        |
| ------------ | ------------------------------------------- |
| 负载均衡地址 | `http://10.0.0.21:8000`                     |
| vmselect 地址 | `http://10.0.0.21:8481/select/0/prometheus` |

### 其他 API 地址

目录：<http://10.0.0.21:8481/select/0/>

vmui：<http://10.0.0.21:8481/select/0/vmui/>

每个组件都有 `/metrics`，可以接入监控
