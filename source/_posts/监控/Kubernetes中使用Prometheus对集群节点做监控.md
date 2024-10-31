---
title: Kubernetes中使用Prometheus对集群节点做监控
abbrlink: 61baae6f
categories:
  - 监控
tags:
  - k8s
  - Prometheus
  - prometheus
  - node_exporter
  - monitor
cover: 'https://static.zahui.fan/public/Prometheus.svg'
date: 2022-09-20 16:28:16
---

正常情况下使用 Prometheus 对机器做监控，比如监控 CPU、内存、磁盘等信息， 都是在机器上安装一个 node exporter， 然后将 metrics 接入到 Prometheus 中。在 k8s 环境下， 我们可以使用 k8s 来管理， 实现自动化监控。

node exporter 是针对主机节点的， 需要在每台 node 节点上安装， 那么 daemonset 控制器是最合理的选择。 网络使用 Host Network 模式， 在主机上直接暴露一个端口。

## 部署 node exporter

使用 yaml

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  namespace: monitor
  labels:
    name: node-exporter
spec:
  selector:
    matchLabels:
      name: node-exporter
  template:
    metadata:
      labels:
        name: node-exporter
    spec:
      hostPID: true
      hostIPC: true
      hostNetwork: true
      containers:
      - name: node-exporter
        image: prom/node-exporter:v1.3.1
        ports:
        - containerPort: 9100
        resources:
          requests:
            cpu: 0.15
        securityContext:
          privileged: true
        args:
        - --path.procfs
        - /host/proc
        - --path.sysfs
        - /host/sys
        - --collector.filesystem.ignored-mount-points
        - '"^/(sys|proc|dev|host|etc)($|/)"'
        - '--web.listen-address=:9100'
        volumeMounts:
        - name: dev
          mountPath: /host/dev
        - name: proc
          mountPath: /host/proc
        - name: sys
          mountPath: /host/sys
        - name: rootfs
          mountPath: /rootfs
      tolerations:
      - key: "node-role.kubernetes.io/master"
        operator: "Exists"
        effect: "NoSchedule"
      volumes:
        - name: proc
          hostPath:
            path: /proc
        - name: dev
          hostPath:
            path: /dev
        - name: sys
          hostPath:
            path: /sys
        - name: rootfs
          hostPath:
            path: /
```

## 配置 prometheus

关于 Prometheus 标签处理， 可以看 [这篇文章](/posts/prometheus_tag)

```yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitor
data:
  web.yml: |
    basic_auth_users:
      admin: $2y$05$UKSS18ztdsUNoEuXYScr2OE1TCMe1hWnmD6JuwUi/uPTJayHIakae
  prometheus.yml: |
    global:
      scrape_interval:     15s
      evaluation_interval: 15s
      
      # 全局标签
      external_labels:
        env: prod
        dept: ops
        project: datong

    scrape_configs:
    # 此处省略掉一部分JOB
      # 自动发现集群的节点
      - job_name: 'kubernetes-node'
        kubernetes_sd_configs:
        - role: node
        relabel_configs:
        - source_labels: [__address__]
          regex: '(.*):10250'
          replacement: '${1}:9100'
          target_label: __address__
          action: replace
        - action: labelmap
          regex: __meta_kubernetes_node_label_(.+)
```

这里是利用了 Prometheus 的元数据，将 kubelet 的地址更换成了 node exporter 的地址， 端口换成了 9100 来实现自动化监控的。