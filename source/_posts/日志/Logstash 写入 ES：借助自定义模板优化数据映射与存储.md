---
title: Logstash 写入 ES：借助自定义模板优化数据映射与存储
categories:
  - 日志
tags: [Elasticsearch, ES, logstash]
abbrlink: ss9srz
date: 2025-02-26 11:09:35
cover: ""
updated: 2025-02-26 11:41:19
---

我们的业务场景是 ES 存储的都是一些不太重要的日志，但是对存储比较敏感，但是查看了 ES 索引都是默认创建了一个副本的。这会造成存储空间翻倍。现在通过调整 logstash 配置来实现创建出来的索引应用自定义配置，比如可以实现 30 天前的日志自动清理，默认不创建副本等。

## 创建生命周期策略

在 ES 上创建一个生命周期策略，定义索引保留 14 天。

```json
PUT _ilm/policy/user_monitor_point-retention-policy
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
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

## 创建 ES 模板配置文件

准备一个 template 配置文件 `logstash-template.json`

```json
{
  "index_patterns": "user_monitor_point-*",
  "order": 1,
  "settings": {
    "index": {
      "lifecycle": {
        "name": "user_monitor_point-retention-policy"
      },
      "number_of_replicas": 0
    }
  }
}
```

这里定义了应用的模板规则，应用的生命周期规则，还有副本数。

logstash 配置文件 `logstash.conf`

```ruby
output {
  if [type] == "logstash_mixins" {
      elasticsearch {
        action   => "index"
        hosts    => ["http://10.20.20.2:9200", "http://10.20.20.3:9200","http://10.20.20.6:9200"]
        index    => "user_monitor_point-%{+YYYY.MM.dd}"
        user     => "elastic"
        password => "password"
        # 这个设置控制是否自动管理索引模板。设置为 true 时，Logstash 会自动创建和管理索引模板（包括字段映射和设置）
        manage_template => true
        # 如果已经存在相同名称的索引模板，设置 template_overwrite => true 会覆盖现有模板。
        template_overwrite => true
        template => '/etc/logstash-template.json'
     }
  }
}
```

这样使用 logstash 创建索引的时候就会自动应用模板规则。

当然也可以将 `manage_template` 设置成 `false` 转而使用 ES 来管理索引模板配置。
