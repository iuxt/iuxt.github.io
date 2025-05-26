---
title: Grafana中自定义Legend的名字和自定义value的显示
categories:
  - 监控
tags: [grafana, prometheus]
abbrlink: skf07c
cover: 'https://static.zahui.fan/public/Grafana.svg'
date: 2024-09-26 18:09:12
updated: 2025-05-26 14:52:02
---

## 针对 value 的值进行修改解释

举个例子：使用 `snmp_exporter` 对防火墙进行监控，端口状态监控值为 `1` 或 `2`（1 是启用，2 是未启用）， 在 Prometheus 中的原始数据是：

![image.png|841](https://static.zahui.fan/images/202409261819318.png)

在 `Grafana` 中显示效果为：
![image.png](https://static.zahui.fan/images/202409261942989.png)

其中：
`Value mappings` 控制数值对应的显示文字。
`Thresholds` 控制数值对应的显示颜色。

## 针对 Legend 修改描述文字

`Legend` 这里配置的是 `{{ifName}}` 显示出来就是类似 `ge0/2` 等，也就是 `Prometheus` 里原始数据的标签名。

如果我想根据这个名字来指定一个对应关系来显示，比如领导不知道 `ge0/2` 是什么意思（开玩笑的，没找到合适的例子），可以将 `ge0/2` 转换为：`第一排第二个网口`，可以这么配置：

![image.png](https://static.zahui.fan/images/202409261958842.png)

## 根据 value 值进行变色

如果只想针对某一列修改颜色
1. value mappings 添加对应的说明和颜色
![image.png](https://static.zahui.fan/images/20250526145105400.png)

2. 添加一个 override
![image.png](https://static.zahui.fan/images/20250526145049451.png)
