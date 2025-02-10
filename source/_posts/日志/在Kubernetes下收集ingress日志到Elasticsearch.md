---
title: 在Kubernetes下收集ingress日志到Elasticsearch
categories:
  - 日志
tags:
  - Elasticsearch
  - Kafka
  - logstash
  - filebeat
abbrlink: skk1ln
cover: https://static.zahui.fan/public/elasticsearch.svg
date: 2024-09-29 11:27:22
updated: 2025-02-10 19:12:21
---

本文 ingress 用的是 Nginx-ingress，普通的 Nginx 原理是一样的。容器运行时是 Docker。

## ingress 配置

ingress 需要调整一下日志格式，json 日志更有利于分析与处理。

```yml
# Source: ingress-nginx/templates/controller-configmap.yaml
apiVersion: v1
kind: ConfigMap
...
  name: ingress-nginx-controller
  namespace: ingress-nginx
data:
  ...
  # annotation: nginx.ingress.kubernetes.io/client-body-buffer-size: 1M
  log-format-upstream: '{"@timestamp": "$time_iso8601","server_addr":"$server_addr","remote_addr":"$remote_addr","scheme":"$scheme","request_method":"$request_method","request_uri": "$request_uri","request_length": "$request_length","uri": "$uri","request_time":$request_time,"body_bytes_sent":$body_bytes_sent,"bytes_sent":$bytes_sent,"status":"$status","upstream_host":"$upstream_addr","domain":"$host","http_referer":"$http_referer","http_user_agent":"$http_user_agent","http_app_id":"$http_app_id","x_forwarded":"$http_x_forwarded_for","up_r_time":"$upstream_response_time","up_status":"$upstream_status","listen_port":"$server_port"}'
```

## filebeat 配置

在 Linux 中，一切皆文件，那么 Pod 的控制台日志也是存储在文件里的，如果容器运行时用的是 Docker，默认使用的是 json 日志文件格式 `"log-driver": "json-file"` 日志在主机上的 `/var/lib/docker/containers/xx/xx-json.log`, 那么我们可以把这个目录挂载到 filebeat 容器中即可使用 filebeat 来搜集日志，但是这样不方便分辨是哪个容器的日志，Kubernetes 给我们创建了一个目录 `/var/log/pods` 这里文件目录都是以固定格式来显示的，可以根据文件名来分析是哪个 namespace 的哪个 pod 的日志了。还有个目录是 `/var/log/containers/` 这个目录里面的文件是链接到 `/var/log/pods/` 里面的日志文件。所以收集日志可以直接从 `/var/log/containers` 来收集。所以 filebeat 需要只读访问 3 个目录：

1. `/var/lib/docker/containers/`
2. `/var/log/containers/`
3. `/var/log/pods/`

![image.png](https://static.zahui.fan/images/202409291142969.png)

![image.png](https://static.zahui.fan/images/202409291150198.png)

首先在 Kubernetes 环境下，我们认为 Pod 是并不固定的，可能会漂移到任意的节点，那么收集日志需要每台节点上都部署 filebeat 来搜集，那么使用 daemonset 是最合适的。

```yml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: filebeat
subjects:
- kind: ServiceAccount
  name: filebeat
  namespace: ops
roleRef:
  kind: ClusterRole
  name: filebeat
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: filebeat
  labels:
    app: filebeat
rules:
- apiGroups: [""] # "" indicates the core API group
  resources:
  - namespaces
  - pods
  verbs:
  - get
  - watch
  - list
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: filebeat
  namespace: ops
  labels:
    app: filebeat
---

kind: ConfigMap
apiVersion: v1
metadata:
  name: filebeat-config
  namespace: ops
  labels:
    app: filebeat
data:
  filebeat.yml: |-
    ###################### Filebeat Configuration Example  #########################

    filebeat.inputs:
      - type: log
        symlinks: true
        enabled: true
        json.keys_under_root: true
        json.overwrite_keys: true
        json.add_error_key: true
        tail_files: true
        paths:
          - /var/log/containers/ingress-nginx-controller-*.log
        processors:
          - decode_json_fields:
              fields: ['log'] # 这里针对的是docker转换后的json日志，原始日志在log字段内。
              target: ""
              overwrite_keys: false
              process_array: false
              max_depth: 1
          - drop_event:
              when:
                or:
                  - regexp:
                      http_user_agent: 'Go-http-client'
                  - regexp:
                      request_uri: '/actuator/info'
        fields:
          log_topic: "ingress-k8s"
          type: "ingress"

    # ============================= Filebeat modules ===============================

    filebeat.config.modules:
      path: ${path.config}/modules.d/*.yml
      reload.enabled: false

    #==================== Elasticsearch template setting ==========================

    setup.template.settings:
      index.number_of_shards: 1

    #============================== Kibana =====================================
    # Uncomment and add the necessary Kibana configuration if needed
    # setup.kibana:
    #   host: "http://your-kibana-host:5601"

    output.kafka:
      enabled: true
      hosts: ["10.0.0.3:9092", "10.0.0.4:9092", "10.0.0.5:9092"]
      topic: '%{[fields.log_topic]}'
      partition.round_robin:
        reachable_only: false
      required_acks: 1
      compression: none
      max_message_bytes: 100000

    #================================ Processors =====================================

    processors:
      - add_host_metadata: ~
      - add_cloud_metadata: ~

---
kind: DaemonSet
apiVersion: apps/v1
metadata:
  name: filebeat
  namespace: ops
  labels:
    app: filebeat
spec:
  selector:
    matchLabels:
      app: filebeat
  template:
    metadata:
      labels:
        app: filebeat
    spec:
      volumes:
        - name: config
          configMap:
            name: filebeat-config
            defaultMode: 420
        - name: varlibdockercontainers
          hostPath:
            path: /opt/docker/containers
            type: ''
        - name: varlog
          hostPath:
            path: /var/log
            type: ''
        - name: data
          hostPath:
            path: /var/lib/filebeat-data
            type: DirectoryOrCreate
      containers:
        - name: filebeat
          image: registry.cn-hangzhou.aliyuncs.com/yaml/images:filebeat-7.3.2
          args:
            - '-c'
            - /etc/filebeat.yml
            - '-e'
          resources:
            limits:
              cpu: 300m
              memory: 200Mi
            requests:
              cpu: 200m
              memory: 100Mi
          volumeMounts:
            - name: config
              readOnly: true
              mountPath: /etc/filebeat.yml
              subPath: filebeat.yml
            - name: data
              mountPath: /usr/share/filebeat/data
            - name: varlibdockercontainers
              readOnly: true
              mountPath: /opt/docker/containers
            - name: varlog
              readOnly: true
              mountPath: /var/log
          imagePullPolicy: IfNotPresent
          securityContext:
            runAsUser: 0
      restartPolicy: Always
      terminationGracePeriodSeconds: 30
      dnsPolicy: ClusterFirst
      serviceAccountName: filebeat
      serviceAccount: filebeat
      hostNetwork: true
```

这里的 filebeat 把收集到的日志写入到 Kafka 集群中。如果容器运行时是 containerd，需要做相应的修改。

## logstash 配置

logstash 消费 kafka 数据，进行处理后 写入到 Elasticsearch

```yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: logstash-ingress-logs
  namespace: ops
spec:
  replicas: 1
  selector:
    matchLabels:
      app: logstash-ingress-logs
  template:
    metadata:
      labels:
        app: logstash-ingress-logs
    spec:
      containers:
        - image: logstash:7.5.1
          name: logstash
          volumeMounts:
          - mountPath: /usr/share/logstash/config/logstash.yml
            name: logstash-ingress-logs-conf
            readOnly: true
            subPath: logstash.yml
          - mountPath: /usr/share/logstash/pipeline/logstash.conf
            name: logstash-ingress-logs-conf
            readOnly: true
            subPath: logstash.conf
          - mountPath: /usr/share/logstash/config/jvm.options
            name: logstash-ingress-logs-conf
            readOnly: true
            subPath: jvm.options
      volumes:
        - configMap:
            defaultMode: 420
            name: logstash-ingress-logs-conf
          name: logstash-ingress-logs-conf

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: logstash-ingress-logs-conf
  namespace: ops
data:
  jvm.options: |
    -Xms2g
    -Xmx3g
    -XX:+UseConcMarkSweepGC
    -XX:CMSInitiatingOccupancyFraction=75
    -XX:+UseCMSInitiatingOccupancyOnly
    -Djava.awt.headless=true
    -Dfile.encoding=UTF-8
    -Djruby.compile.invokedynamic=true
    -Djruby.jit.threshold=0
    -Djruby.regexp.interruptible=true
    -XX:+HeapDumpOnOutOfMemoryError
    -Djava.security.egd=file:/dev/urandom
  logstash.yml: 'config.reload.automatic: true'
  logstash.conf: |
    input {
      kafka {
        bootstrap_servers => "10.0.0.3:9092,10.0.0.4:9092,10.0.0.5:9092"
        topics => ["ingress-k8s"]
        codec => "json"
        consumer_threads => 3
        group_id => "k8s_group"
        decorate_events => true
        type => "logstash_mixins"
      }
    }

    filter{
        mutate{
            rename => ["[host][name]", "hostname"]
            remove_field => ["ecs","@version","input","host","agent","log"]
            convert => {
              "status" => "integer"
            }
        }
    }

    output {
      if [type] == "logstash_mixins" {
          elasticsearch {
              action   => "index"
              hosts    => ["http://10.0.0.13:9200","http://10.0.0.14:9200","http://10.0.0.15:9200"]
              index    => "%{[fields][type]}-%{+YYYY.MM.dd}"
              user     => "elastic"
              password => "elastic的密码"
          }
      }
    }

```

写入到 Elasticsearch 后，在 Elasticsearch 就可以看到对应的索引了。

