---
title: 管理Redis内存占用
categories:
  - 数据库
tags: [redis, 性能优化]
abbrlink: spcjoj
date: 2024-12-31 15:04:50
cover: https://s3.babudiu.com/iuxt/public/Redis_Logo.png
updated: 2025-07-24 18:21:12
---

## 淘汰策略

如果设置了合适的淘汰策略，Redis 会根据以下几种策略选择性地移除某些键，腾出内存空间（淘汰策略需要和内存限制配合使用）

常用淘汰策略说明

| 策略              | 说明                                  |
| --------------- | ----------------------------------- |
| volatile-lru    | 从设置了过期时间的键中，移除最近最少使用（LRU）的键。        |
| allkeys-lru     | 从所有键中，移除最近最少使用（LRU）的键。              |
| volatile-random | 从设置了过期时间的键中，随机移除键。                  |
| allkeys-random  | 从所有键中，随机移除键。                        |
| volatile-ttl    | 从设置了过期时间的键中，移除即将过期的键（优先移除 TTL 短的键）。 |
| noeviction      | 当内存超过限制时，直接返回错误，不再执行新增操作（这是默认策略）。   |

设置方法： 在 redis.conf 文件中添加或修改：

```conf
maxmemory-policy allkeys-lru
```

或通过命令行动态设置：

```bash
redis-cli config set maxmemory-policy allkeys-lru
```

## 内存限制

设置 maxmemory

```conf
maxmemory 4gb
# maxmemory 4G
# maxmemory 4294967296
```

通过命令行动态设置：

```bash
redis-cli config set maxmemory 4294967296
```

## 持久化设置

如果缓存数据可丢失，可以禁用持久化（RDB 和 AOF）以减少磁盘 IO 开销：

```bash
save ""
appendonly no
```
