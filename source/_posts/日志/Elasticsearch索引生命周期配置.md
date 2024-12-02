---
title: Elasticsearch索引生命周期配置
categories:
  - 日志
tags:
  - ''
abbrlink: snui2r
date: 2024-12-02 10:40:03
cover: ''
---

https://www.cnblogs.com/feifuzeng/p/13563430.html
https://blog.csdn.net/feiying0canglang/article/details/129789161

文章未完待续。。。

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


# 创建索引模板，保证新创建的索引都应用这个模板
PUT /_template/ingress-log-template
{
  "index_patterns": ["ingress-*"],
  "template": {
    "settings": {
      "index.lifecycle.name": "ingress-log-retention-policy",
      "index.lifecycle.rollover_alias": "ingress-log-alias"
    }
  }
}


GET /_cluster/settings

# 设置检查时间为60s
PUT _cluster/settings
{
  "persistent": {
    "indices.lifecycle.poll_interval":"60s"
  }
}




# 查询索引的ilm状态
GET ingress-2024.12.01/_ilm/explain

# 查询索引设置，比如查看是否绑定了ilm策略
GET ingress-2024.12.01/_settings

# 修改索引绑定的ilm策略
PUT ingress-2024.12.01/_settings
{
  "index": {
    "lifecycle.name": "ingress-log-retention-policy"
  }
}
```

ILM 策略只针对新创建的索引生效，老索引需要手动绑定到策略上。