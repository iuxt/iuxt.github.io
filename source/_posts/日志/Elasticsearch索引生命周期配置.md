---
title: Elasticsearch索引生命周期配置
categories:
  - 日志
tags: [ES, 常用操作]
abbrlink: snui2r
date: 2024-12-02 10:40:03
cover: https://s3.babudiu.com/iuxt/public/elasticsearch.svg
updated: 2025-02-26 11:53:02
---

参考
<https://www.cnblogs.com/feifuzeng/p/13563430.html>
<https://blog.csdn.net/feiying0canglang/article/details/129789161>

这里以 `Elasticsearch 7.17.14` 为例，7.8 版本之前与之后有一点区别。7.8 之后的 API 是：`_index_template`，7.8 之前的命令是：`_template`

## 设置索引模板

模板是为了让创建的索引按照一定的规则，比如索引按天分割，手动给每个索引做配置太麻烦

## 创建生命周期策略

```bash
# 设置ingress日志保留14天，超过14天删除。
PUT _ilm/policy/ingress-log-retention-policy
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {}
      },
      "delete": {
        "min_age": "14d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

## 创建索引模板

索引模板引用上面创建的生命周期策略

```bash
# 创建索引模板，保证新创建的索引都应用这个模板
PUT /_index_template/ingress-log-template
{
  "index_patterns": ["ingress-*"],
  "template": {
    "settings": {
      "number_of_replicas": 0,
      "index": {
        "lifecycle": {
          "name": "ingress-log-retention-policy",
          "rollover_alias": "ingress-log-alias"
        }
      }
    }
  }
}
```

## 检查是否生效

```bash
# 查询索引的ilm状态
GET ingress-2024.12.01/_ilm/explain

# 查询索引设置，比如查看是否绑定了ilm策略
GET ingress-2024.12.01/_settings
```

## 修改系统配置

Elasticsearch 不会实时检测，可以修改检测时间间隔

```bash
# 查看集群的设置
GET /_cluster/settings

# 设置检查时间为60s
PUT _cluster/settings
{
  "persistent": {
    "indices.lifecycle.poll_interval":"60s"
  }
}
```

## 手动修改现存的索引

因为我们创建了索引模板，只能在下次创建新索引才能生效，老索引需要手动绑定到策略上。

```bash
# 手动修改索引绑定的ilm策略
PUT ingress-2024.12.01/_settings
{
  "index": {
    "lifecycle.name": "ingress-log-retention-policy"
  }
}
```

## 对于 logstash

logstash 会创建自己的默认 template，所以想要应用 template 需要禁用 logstash 的 manage_template

`logstash.conf`

```conf
input {
  kafka {
    bootstrap_servers => "10.10.10.10:9092,10.10.10.11:9092,10.10.10.12:9092"
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
          manage_template => false
          hosts    => ["http://10.10.10.21:9200","http://10.10.10.22:9200","http://10.10.10.23:9200"]
          index    => "%{[fields][type]}-%{+YYYY.MM.dd}"
          user     => "elastic"
          password => "password"
      }
  }
}
```

需要在 output 中添加一行：`manage_template => false`
