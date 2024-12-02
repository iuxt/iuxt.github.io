---
title: Elasticsearch常用API操作
abbrlink: ee708f6b
description: Elasticsearch常用API操作，比如通过api进行查看索引、删除索引、增加用户、修改密码等。
categories:
  - 日志
tags:
  - Elasticsearch
  - log
cover: 'https://static.zahui.fan/public/elasticsearch.svg'
date: 2022-04-25 10:26:56
---

如果有 Kibana 的话，以下所有操作都可以在 Kibana 的 DevTools 页面进行调试，可以免去认证操作。

![Kibana调试查看索引接口](https://static.zahui.fan/images/20220425224238.png)

| 接口                    | 功能                  |
| --------------------- | ------------------- |
| /_cat/health?v        | 集群健康状态              |
| /_cat/shards          | 分片信息                |
| /_cat/nodes           | 节点信息                |
| /_cat/indices         | 索引信息                |
| /_cat/allocation?v    | 磁盘占用                |
| /索引名字/_mapping?pretty | 查看 mapping（索引字段类型等） |

`?v` 是详细信息输出

## 索引

```bash
# 查看有哪些索引
curl -u elastic:password localhost:9200/_cat/indices

# 创建索引
curl -u elastic:password -X PUT "localhost:9200/索引名字?pretty"

# 删除索引
curl -u elastic:password -s -XDELETE 10.0.0.127:9200/索引名字
```

> 索引名字可以通过查看索引接口查看

## 修改密码

```bash
curl -H "Content-Type:application/json" -XPOST -u elastic:password 'http://127.0.0.1:9200/_xpack/security/user/elastic/_password' -d '{ "password" : "123456" }'
```

## 添加角色

```bash
curl -XPOST -H 'Content-type: application/json' -u elastic:password 'http://1.1.1.1:9600/_xpack/security/role/admin?pretty' -d '{
"run_as":["elastic"],
"cluster":["all"],
"indices":[
 {
  "names":["*"],
  "privileges":["all"]
 }
]
}'
```

## 查看角色

```bash
curl -XGET -H 'Content-type: application/json' -u elastic:password 'http://1.1.1.1:9600/_xpack/security/role/admin?pretty'
```

## 允许自动创建索引

```bash
curl -XPUT -H "Content-Type:application/json" -u "admin:password" https://1.1.1.1:9200/_cluster/settings -d '{"persistent":{"action.auto_create_index":"true"}}' -k
```

## 查看设置

```bash
curl -XGET -u "admin:password" https://1.1.1.1:9200/_cluster/settings -k
```

## 修改设置

```bash
curl -u elastic:password 1.1.1.1:9200/_cluster/settings -X PUT -H "Content-Type: application/json" -d '{
  "persistent" : {
    "cluster" : {
      "max_shards_per_node" : "900000"
    },
    "indices" : {
      "breaker" : {
        "total" : {
          "limit" : "95%"
        }
      }
    },
    "xpack" : {
      "monitoring" : {
        "collection" : {
          "enabled" : "true"
        }
      }
    }
  }

}'
```

### 修改单个 node 最大分片数

```bash
# es 支持永久修改配置与临时修改配置, 如果想要临时修改:  "transient" : {"cluster" : {"max_shards_per_node" : "900000"}}
curl -X PUT localhost:9200/_cluster/settings -H "Content-Type: application/json" -d '{ "persistent": { "cluster.max_shards_per_node": "3000" } }'

# 查看未分配的分片数
curl -XGET http://localhost:9200/_cluster/health\?pretty | grep unassigned_shards
```