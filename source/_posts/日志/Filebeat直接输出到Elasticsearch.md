---
title: Filebeat直接输出到Elasticsearch
categories:
  - 日志
tags: ['']
abbrlink: suuwju
date: 2025-04-17 17:47:54
cover: ''
updated: 2025-04-17 18:41:23
---

正常情况下收集日志流程为：
1. filebeat 读取节点上指定目录日志文件 --> kafka
2. logstash 消费 kafka 数据 --> 写入到 ES 的指定索引
加入 kafka 会提高健壮性，可以起到削峰填谷的效果。现在是非生产环境没有 kafka，所以才采用 filebeat 写入到 ES 这种方案。另一种架构：[在Kubernetes下收集ingress日志到Elasticsearch](/posts/skk1ln/)

## 输入配置

输入就是源日志的配置， 我这里配置了 2 个日志源，一个是 nginx ingress 的配置，记录的是所有请求的访问日志，另一个是业务 pod 的日志。通过 `fields.log_topic` 来配合下面的 output 来区分怎么输出。

```yml
    filebeat.inputs:
    - type: container
      symlinks: true
      enabled: true
      tail_files: true # 如果此选项设置为true, Filebeat开始在每个文件的末尾读取新文件, 默认设置是false。
      paths:
        - /var/log/containers/*vos-xxx-pre*.log
      exclude_files: 
        - 'ingress-nginx-controller*'

      fields:
        log_topic: k8s-pod-logs
        type: "pre-logs"

      multiline.pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
      multiline.negate: true
      multiline.match: after

    - type: container
      symlinks: true
      enabled: true
      json.keys_under_root: true
      json.overwrite_keys: true
      json.add_error_key: true
      tail_files: true
      paths:
        - /var/log/containers/*ingress-nginx-controller*.log
      processors:
        - decode_json_fields:
            fields: ['log']
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
                  domain: 'graylog.example.com'
              - regexp:
                  domain: 'prometheus.example.com'

      fields:
        log_topic: "ingress-logs"
        type: "pre-logs"
```

## 索引生命周期

如果你的索引名字没有生效，变成了 filebeat 开头的， 你需要关闭 filebeat 的自动 ILM 功能：

```yml
setup.ilm:
  enabled: false
```

关闭自动 ILM 仅仅是索引生命周期不由 filebeat 来管理，还可以手动在 es 里创建生命周期策略的方式来管理。参考 [Elasticsearch索引生命周期配置](/posts/snui2r/)

## 索引模版配置

```yml
    setup.template:
      name: "ingress_logs_template"
      pattern: "ingress*"
      overwrite: true
      enabled: true
      settings:
        index:
          number_of_shards: 6
          number_of_replicas: 0
      name: "pod_logs_template"
      pattern: "k8s-pod-logs*"
      overwrite: true
      enabled: true
      settings:
        index:
          number_of_shards: 2
          number_of_replicas: 0
```

这里可以根据 pattern 来匹配索引，比如设置副本数与分片数。

## 输出到 ES 配置

```yml
    output.elasticsearch:
      enabled: true
      hosts: ["http://10.22.22.22:9200"]
      index: "%{[fields.log_topic]}-%{+yyyy.MM.dd}"
      username: "elastic"
      password: "password"
```

这里的 `%{[fields.log_topic]}` 和上面的 input 里面对应，就是不同的日志输出到不同的 ES 索引。

## 完整的 yml 文件

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: filebeat
subjects:
- kind: ServiceAccount
  name: filebeat
  namespace: public
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
  namespace: public
  labels:
    app: filebeat


---

kind: ConfigMap
apiVersion: v1
metadata:
  name: filebeat-config
  namespace: public
  labels:
    app: filebeat
data:
  filebeat.yml: |
    filebeat.inputs:
    - type: container
      symlinks: true
      enabled: true
      tail_files: true #  如果此选项设置为true,Filebeat开始在每个文件的末尾读取新文件,默认设置是false。
      paths:
        - /var/log/containers/*vos-a66-t-pre*.log
      exclude_files: 
        - 'ingress-nginx-controller\.*'

      fields:
        log_topic: k8s-pod-logs
        type: "pre-logs"

      multiline.pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
      multiline.negate: true
      multiline.match: after

    - type: container
      symlinks: true
      enabled: true
      json.keys_under_root: true
      json.overwrite_keys: true
      json.add_error_key: true
      tail_files: true
      paths:
        - /var/log/containers/*ingress-nginx-controller*.log
      processors:
        - decode_json_fields:
            fields: ['log']
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
                  domain: 'graylog.example.com'
              - regexp:
                  domain: 'prometheus.example.com'

      fields:
        log_topic: "ingress-logs"
        type: "pre-logs"

    filebeat.config.modules:
      # Glob pattern for configuration loading
      path: ${path.config}/modules.d/*.yml
      # Set to true to enable config reloading
      reload.enabled: false
      # Period on which files under path should be checked for changes
      #reload.period: 10s

    setup.template:
      name: "ingress_logs_template"
      pattern: "ingress*"
      overwrite: true
      enabled: true
      settings:
        index:
          number_of_shards: 6
          number_of_replicas: 0
      name: "pod_logs_template"
      pattern: "k8s-pod-logs*"
      overwrite: true
      enabled: true
      settings:
        index:
          number_of_shards: 2
          number_of_replicas: 0
          
    setup.ilm:
      enabled: false
      
      
    setup.kibana:

    output.elasticsearch:
      enabled: true
      hosts: ["http://10.123.56.10:9200"]
      index: "%{[fields.log_topic]}-%{+yyyy.MM.dd}"
      username: "elastic"
      password: "passwordprocessors:
      - add_host_metadata: ~
      - add_cloud_metadata: ~

---
kind: DaemonSet
apiVersion: apps/v1
metadata:
  name: filebeat
  namespace: public
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
            defaultMode: 384
        - name: varlibdockercontainers
          hostPath:
            path: /var/log/containers
            type: ''
        - name: varlog
          hostPath:
            path: /var/log/pods
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
              cpu: 800m
              memory: 300Mi
            requests:
              cpu: 300m
              memory: 200Mi
          volumeMounts:
            - name: config
              readOnly: true
              mountPath: /etc/filebeat.yml
              subPath: filebeat.yml
            - name: data
              mountPath: /usr/share/filebeat/data
            - name: varlibdockercontainers
              readOnly: true
              mountPath: /var/log/containers
            - name: varlog
              readOnly: true
              mountPath: /var/log/pods
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
          imagePullPolicy: IfNotPresent
          securityContext:
            runAsUser: 0
      restartPolicy: Always
      terminationGracePeriodSeconds: 30
      dnsPolicy: ClusterFirstWithHostNet
      serviceAccountName: filebeat
      serviceAccount: filebeat
      hostNetwork: true
      securityContext: {}
      schedulerName: default-scheduler
      tolerations:
        - key: apptype
          operator: Exists
          effect: NoSchedule
```
