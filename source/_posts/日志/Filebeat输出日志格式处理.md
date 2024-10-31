---
title: Filebeat输出日志格式处理
abbrlink: 1a418f5e
cover: 'https://static.zahui.fan/public/elasticsearch.svg'
categories:
  - 日志
tags:
  - Elasticsearch
  - filebeat
date: 2022-03-15 14:47:06
---

使用 filebeat 可以在收集过程中进行一些简单的处理，如丢弃日志等，给后面的 kafka 等减少压力

## 普通文本日志格式

原始日志格式：

```txt
{"log":"2022-03-15 14:53:48.972 [http-nio-8080-exec-10] o.s.c.c.c.ConfigServicePropertySourceLocator-[227]-[INFO]-Connect Timeout Exception on Url - http://localhost:8888. Will be trying the next url if available\n","stream":"stdout","time":"2022-03-15T06:53:48.972854745Z"}
```

这里的原始日志是指要收集的日志文件的格式，上面的这个日志是被 Kubernetes 处理过的，真正程序输出的日志应该是 log 字段。

对应的 filebeat 配置文件如下：

```yml
filebeat.inputs:

- type: log
    symlinks: true
    enabled: true
    json.keys_under_root: false     # keys_under_root可以让字段位于根节点,默认为false
    json.overwrite_keys: false      # 对于同名的key,覆盖原有key值
    json.add_error_key: true        # 将解析错误的消息记录储存在error.message字段中
    tail_files: true                # 如果此选项设置为true,Filebeat开始在每个文件的末尾读取新文件,默认设置是false。
    paths:
    - /var/log/containers/*_dev_*.log
    # exclude_files:                    # 排除的文件路径
    #   - 'ingress-nginx-controller\.*'
    #   - '\.*_dev_\.*

    processors:
    - drop_event:
        when:
            or:
            - regexp:
                json.log: '定时任务task'
            - regexp:
                json.log: '定时任务执行成功'

    fields:
    log_topic: k8s-pod-logs
    type: "kube-logs"
    # multiline.negate: true
    # multiline.match: after
```

经过 filebeat 处理后输出的内容：
所以回过头来看上面的配置文件，`drop_event` `regexp` 下面 针对 `json.log` 做正则匹配，包含指定字符就丢弃。

```json
{
    "@timestamp": "2022-03-15T07:04:44.917Z",
    "@metadata": {
        "beat": "filebeat",
        "type": "_doc",
        "version": "7.3.2",
        "topic": "k8s-pod-logs"
    },
    "log": {
        "offset": 6799764,
        "file": {
            "path": "/var/log/containers/xxxx.log"
        }
    },
    "json": {
        "log": "[2022-03-15 15:04:37.637] http-nio-8080-exec-8 com.i.aa.aa.b-[-1]-[DEBUG]-[TID:null NAME:APPNAME ENV:dev INS:172.20.37.197] CORSFilter is work~~~\n",
        "stream": "stdout",
        "time": "2022-03-15T07:04:37.638273461Z"
    },
    "input": {
        "type": "log"
    },
    "fields": {
        "type": "kube-logs",
        "log_topic": "k8s-pod-logs"
    },
    "ecs": {
        "version": "1.0.1"
    },
    "host": {
        "name": "localhost.localdomain",
        "architecture": "x86_64",
        "os": {
            "platform": "centos",
            "version": "7 (Core)",
            "family": "redhat",
            "name": "CentOS Linux",
            "kernel": "5.4.113-1.el7.elrepo.x86_64",
            "codename": "Core"
        },
        "containerized": false,
        "hostname": "localhost.localdomain"
    },
    "agent": {
        "ephemeral_id": "xxxxx",
        "hostname": "localhost.localdomain",
        "id": "xxxxx",
        "version": "7.3.2",
        "type": "filebeat"
    }
}
```

## 针对 json 格式日志处理

原始日志：

```json
{"@timestamp": "2022-03-15T14:15:14+08:00","server_addr":"1.1.1.1","remote_addr":"1.1.1.1","scheme":"https","request_method":"POST","request_uri": "/","request_length": "25545","uri": "/","request_time":0.004,"body_bytes_sent":833,"bytes_sent":1072,"status":"200","upstream_host":"1.1.1.1:8084","domain":"a.i.com","http_referer":"-","http_user_agent":"-","http_app_id":"xxxxxxx","x_forwarded":"-","up_r_time":"0.003","up_status":"200","os_plant":"android","os_version":"11","app_version":"4.0.4","app_build":"97","guid":"xxxxxccb","resolution_ratio":"1080*2193","ip":"xx::xx:xx:xx:xx%dummy0","imsi":"xxxxx-xxxxxx","listen_port":"443"}
```

### 某一行包含 xx 就丢弃

比如我想丢弃所有 `request_uri` 为 `/actuator/info` 或 `http_user_agent` 为 `Go-http-client/2.0` 的日志

filebeat.yml 配置文件如下：

```yml
- type: log
    symlinks: true
    enabled: true
    json.keys_under_root: true
    json.overwrite_keys: true
    json.add_error_key: true
    tail_files: true
    paths:
    - /var/log/containers/ingress-nginx-controller*.log
    processors:
    - decode_json_fields:           # 解析二级json
        fields: ['log']             # 一级json的log键
        target: ""
        overwrite_keys: false
        process_array: false
        max_depth: 1
    - drop_event:
        when:
            or:
            - regexp:
                http_user_agent: 'Go-http-client/2.0'
            - regexp:
                request_uri: '/actuator/info'
    - drop_fields:
        # when: 可以设置去除的条件
        #   condition
        fields: ["log","host"]     # 要去除的字段
        ignore_missing: false
        
    fields:
    log_topic: "ingress-k8s"
    type: "ingress"
```

因为日志本身就是个 json，经过 filebeat 后又会包装一个 json，所以我们需要对日志做二级解析。
