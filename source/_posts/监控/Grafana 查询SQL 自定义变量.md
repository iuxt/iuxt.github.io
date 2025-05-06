---
title: Grafana 查询SQL 自定义变量
categories:
  - 监控
tags: []
abbrlink: svtyfb
date: 2025-05-06 16:04:22
cover: ""
updated: 2025-05-06 17:01:06
---

比如一个 dashboard 里面有很多通用的数据，不想每个 panel 面板都手动修改一遍，可以定义个全局的变量，所有面板都调用这个变量，后续需要修改的时候，直接改变量即可。

## 面板设置里添加变量

这里添加好了之后，先打开 show on dashboard 显示

![image.png](https://static.zahui.fan/images/20250506163411627.png)

然后选择自己需要的数据，保存的时候，勾选 update default variable values 保存当前选择的值
![image.png](https://static.zahui.fan/images/20250506163204899.png)
最后再把变量隐藏起来。

## 在查询的时候调用变量

```sql
SELECT
    `desc` AS '说明',
    CONVERT_TZ(time, '+08:00', '+00:00') AS '最近日期',
    vin,
    value AS '发生数量'
FROM
    granfana.metric
WHERE
    metric_name = 'active_fail'
    AND vin IN (${users})
ORDER BY
    最近日期 DESC
```

## 如何调试

点击面板设置上的 Query inspector 查询 里 可以看到原始的数据。
![image.png](https://static.zahui.fan/images/20250506165823095.png)
