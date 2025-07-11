---
title: Prometheus中查询无数据提供默认值
categories:
  - 监控
abbrlink: sjaoe0
cover: 'https://s3.babudiu.com/iuxt/public/Prometheus.svg'
date: 2024-09-04 23:30:00
tags:
---

单一时间序列（时间戳）的样本。具体来说，`vector(0)` 将创建一个包含值 0 的瞬时向量（即在某个时间点的时间序列）。

```promql
sum(increase(nginx_ingress_controller_requests{status=~"4.*"}[3m])) or vector(0)
```

这里的 `vector(0)` 的作用是为查询结果提供一个默认值或回退值。当前面的 `sum(increase(...))` 查询没有返回任何结果时，整个查询将返回 `vector(0)` 生成的值，即 0。

