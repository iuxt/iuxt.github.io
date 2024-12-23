---
title: Grafana表格绘制
categories:
  - 监控
tags:
  - grafana
abbrlink: so9bdi
date: 2024-12-10 10:39:17
cover: https://static.zahui.fan/public/Grafana.svg
---

## 选择一个关联标签

`instance` 是机器 ip，不会重复，所以我用这个做关联字段。
第一个查询我会保留多一些标签，（可以使用 `sum by ... (instance)` 保留想要的标签）其他的查询尽量只保留关联字段。

默认配置了多个查询，并将 Grafana 图表类型设置成 table 后，再将查询的格式设置成 Table，显示如下，有以下几个问题：

![image.png|918](https://static.zahui.fan/images/20241210104651576.png)

## 整合多个查询在一张表里面

现在显示的是 3 个查询，通过一个选框来切换的，我们想要让这 3 个查询显示在一个框中，可以在 Grafana 的 `Transform data` 中增加一个 `Join by field`， 我这里以 instance 这个字段做关联，也就是说同样的 instance 认为是一条数据。可以看到展示出来只有一条数据了，并且选框没有了。
![image.png|970](https://static.zahui.fan/images/20241210104917046.png)

## 移除不想展示的字段

上面可以看到数据已经被关联成了一条，但是有很多不想显示的字段，在 `Transform data` 中增加一个 `Organize fields by name`，经过调整后

![image.png|937](https://static.zahui.fan/images/20241210105622474.png)

## 修改字段单位

上面的运行时间，单位是秒，需要调整一下单位，在 Override 中调整：

![image.png|1008](https://static.zahui.fan/images/20241210105842096.png)

## 给表格分配颜色

![image.png|1051](https://static.zahui.fan/images/20241223164145064.png)

这里的 unit 单位是 percent 0-1 所以下面的阈值也应该设置为 0-1 之间，比如超过 95% 设置成红色，超过 80% 设置成黄色。
