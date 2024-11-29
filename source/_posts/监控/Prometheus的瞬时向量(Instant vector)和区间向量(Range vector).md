---
title: Prometheus的瞬时向量(Instant vector)和区间向量(Range vector)
categories:
  - 监控
tags:
  - prometheus
abbrlink: smrno6
cover: 'https://static.zahui.fan/public/Prometheus.svg'
date: 2024-11-11 11:14:30
---

在 Prometheus 的表达式语言中，表达式或子表达式包括以下四种类型之一：

- 瞬时向量（Instant vector） ： 一组时间序列，每个时间序列包含单个样本，它们共享相同的时间戳。也就是说，表达式的返回值中只会包含该时间序列中的最新的一个样本值。而相应的这样的表达式称之为瞬时向量表达式。
- 区间向量（Range vector） ： 一组时间序列，每个时间序列包含一段时间范围内的样本数据。
- 标量（Scalar） ： 一个浮点型的数据值。
- 字符串（String） ： 一个简单的字符串值。

## 瞬时向量

```bash
http_requests_total{job="prometheus"}
```

比如这样的，取值是一个值

## 区间向量

指的是指定时间段的所有瞬时向量

```bash
http_requests_total{job="prometheus"}[5m]
```

## PromQL 聚合操作

例如：sum，min，max，count 等聚合函数，只能作用于瞬时向量上。

```bash
# 这是错误的，因为count只能作用于瞬时向量，而这个查询本身返回的是区间向量
count(http_requests_total{job="prometheus"}[5m])

# 正确的如下
count(http_requests_total{job="prometheus"})
```