---
title: Prometheus标签处理
categories:
  - 监控
tags:
  - Prometheus
  - prometheus
  - 监控
abbrlink: prometheus_tag
cover: 'https://s3.babudiu.com/iuxt/public/Prometheus.svg'
date: 2023-07-28 15:07:00
---

## 元标签

在被监控端纳入普罗米修斯里面定义了一些元数据标签
在 Prometheus 所有的 Target 实例中，都包含一些默认的 Metadata 标签信息。可以通过 Prometheus UI 的 Status 里面的 Service Discovery 查看

| Metadata 标签     | 说明                                             |
| ---------------- | --- |
| __address__      | 当前 Target 实例的访问地址 host:port            |
| __scheme__       | 采集目标服务访问地址的 HTTP Scheme，HTTP 或者 HTTPS |
| __metrics_path__ | 采集目标服务访问地址的访问路径                   |

上面这些标签将会告诉 Prometheus 如何从该 Target 实例中获取监控数据。除了这些默认的标签以外，我们还可以为 Target 添加自定义的标签。

元标签是不会写到数据库当中的，使用 promql 是查询不到这些标签的，如果需要源标签的数据（比如 k8s 部署的 Prometheus 使用自动发现获取 pod 监控），这个时候就需要把一些元标签重新打标签来使用。

![](https://s3.babudiu.com/iuxt/images/202307311829414.png)

比如上图，监控 k8s 的 pod 状态， 因为 pod 是动态的，所以需要 pod 名字和 pod 的 namespace 信息，就可以从元标签中取值。

## 自定义标签

可以针对特定的标签去查询，比如根据厂商、项目等来区分。

```yml
  - job_name: 'Beijing Linux Server'
    static_configs:
    - targets: ['192.168.179.99:9100']
      labels:
        address: beijing
        project: mysql
 
  - job_name: 'Shanghai Linux Server'
    static_configs:
    - targets: ['192.168.179.99:9100']
      labels:
        address: shanghai
        project: www
```

## 重新标记标签

action 重新标记标签动作, 可以取的值有：

| 动作      | 作用                                                                                                                                                                              |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| replace   | 默认，通过 regex 匹配 source_label 的值，使用 replacement 来引用表达式匹配的分组，分组使用 $1,$2...引用（正则匹配，提取字段创建新标签）                                                  |
| keep      | 删除 regex 与连接不匹配的目标 source_labels ， keep drop 就是让普罗米修斯采集和不采集哪些目标                                                                                        |
| drop      | 删除 regex 与连接匹配的目标 source_labels                                                                                                                                           |
| labeldrop | 删除 regex 匹配的标签                                                                                                                                                               |
| labelkeep | 删除 regex 不匹配的标签                                                                                                                                                             |
| labelmap  | 匹配 regex 所有标签名称，并将捕获的内容分组，用第一个分组内容作为新的标签名（使用正则提取出多个字段，使用匹配到的作为新标签名，但是标签的内容不会改变，相对于对原有标签换了个名字） |

## 举例

### 动态生成添加标签（对已有的标签重新标记）

```yml
  - job_name: 'Linux Server'
    static_configs:
    - targets: ['192.168.179.99:9100']
    metric_relabel_configs:
    - action: replace
      source_labels: ["instance"]
      regex: (.*):([0-9]+)  # 正则匹配标签值，( )分组
      replacement: $1       # 引用分组匹配的内容
      target_label: "ip"
```

可以看到该标签已经进入数据库里面了，这样就根据源标签通过正则匹配动态生成了新的标签

![](https://s3.babudiu.com/iuxt/images/202307311816271.png)

### 选择采集的目标

```yml
  - job_name: 'Linux Server'
    static_configs:
    - targets: ['192.168.179.99:9100']
    relabel_configs:
    - action: drop
      regex: "192.168.179.99:9100"   # 正则匹配标签值
      source_labels: ["_address_"]
```

在 target 里面就没有了，在普罗米修斯里面就看不到该台机器，同时 exporter 也不会被停止.

### 删除标签

有些标签不希望被存储上，那么可以使用 labeldrop, 删除 regex 匹配的标签去完成不需要入库 将里面的标签删除掉，在入库之前删除

```yml
  - job_name: 'Linux Server'
    static_configs:
    - targets: ['192.168.179.99:9100']
    relabel_configs:
    - action: labeldrop
      regex: "job"   #正则匹配标签名称
```

### keep

Keep 只有匹配的才会去采集数据，不匹配的就不采集。下面意思就是 pod 当中有些注解中声明了 prometheus_io_scrape 这个字段，那么就会把你纳入监控，如果没有声明就不会纳入监控。也就是 k8s 当中部署了这么多 pod，谁要监控，谁不要被监控，在部署 service 可以指定是否需要采集，如果需要采集需要在注解当中声明 prometheus_io_scrape: true

在 service 里面声明配置注解，那么就会采集注解里面含有这个值的

```yml
annotations:
  prometheus.io/scrape: 'true'
```

```vim
    # 带注解  prometheus.io/scrape: true  的才会被采集，不然不采集，不入库
    - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
      action: keep
      regex: true
```

### replace

处理监控 pod 连接的 ip 地址，api 接口，还有协议都需要重新标记默认的字段

```yml
      # 重命名采集目标协议
      - action: replace
        regex: (https?)
        source_labels:
        - __meta_kubernetes_service_annotation_prometheus_io_scheme
        target_label: __scheme__
      # 重命名采集目标指标URL路径
      - action: replace
        regex: (.+)
        source_labels:
        - __meta_kubernetes_service_annotation_prometheus_io_path
        target_label: __metrics_path__
      # 重命名采集目标地址
      - action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        source_labels:
        - __address__
        - __meta_kubernetes_service_annotation_prometheus_io_port
        target_label: __address__
```

这里就可以使用新的标签 kubernetes_namespace 在 promql 里面基于命名空间这个标签去查询了，因为 __meta_kubernetes_namespace 这个标签是不会被存储的

```yml
      # 生成命名空间标签
      - action: replace
        source_labels:
        - __meta_kubernetes_namespace
        target_label: kubernetes_namespace
```

```yml
    # 修改NodeIP:10250为APIServerIP:6443
    - action: replace
      regex: (.*)
      source_labels: ["__address__"]  源标签配匹为address
      target_label: __address__
      replacement: 192.168.31.61:6443
```

### labelmap

做上面这些事情是有两个阶段的，一个是采集之前，一个是采集之后，如果在采集之前重新定义标签没生效，那么可以使用采集之后的标签（因为使用的是 k8s 的服务发现，不管用的是哪个服务发现，默认带的都是源标签 __meta_kubernetes_node_label 比如 consul 那么就是以 consul 开头的，这些不同服务发现的标签就是为了新标签的生成，就是为了更加好的标识监控指标，源标签是不会入库的）

```yml
  relabel_configs:
    # 将标签(.*)作为新标签名，原有值不变（新的标签名字会被入库查询）
    - action: labelmap
      regex: __meta_kubernetes_node_label_(.*) 
```

(.*) 以其开头所有值匹配到，用这个匹配的值作为新的标签名字，新的标签名字就可以入库，就会被查询，因为元标签以下划线开头的是不会入库的，后面是用不了的/这样做的目的就是将后面 (.*) 匹配的值作为一个新标签，并且将原有值赋予新标签，后面可以基于这个新标签查询数据了

原文链接：https://blog.csdn.net/qq_34556414/article/details/113503945