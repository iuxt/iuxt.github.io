---
title: 使用腾讯云CLS收集TKE（k8s）业务日志
categories:
  - 日志
tags: [腾讯云, 正则表达式]
abbrlink: t8hx7x
date: 2026-01-07 21:23:56
cover: ""
updated: 2026-01-07 21:55:27
---

使用 CLS 来采集业务日志的好处有
1. 运维方便，不用费劲搭建 ELK 系统，传统的 `filebeat` -> `kafka` -> `logstash` -> `ElasticSearch` 架构复杂
2. 费用便宜（和 ES、kafka 这一套相比）
3. 不用担心告警等（如 ES 磁盘使用率等）

## 开启采集

在集群管理界面，点击 日志 新增采集配置：

![PixPin_2026-01-07_21-38-41.png](https://s3.babudiu.com/iuxt/2026/01/9ee2c751e344af1e5287829328d20561.png)

然后选择日志源、元数据等，点击下一步，配置日志解析方式。

如果是纯 json 日志，就配置成 json 格式解析。业务日志是 Spring Boot，并且包含多行日志，所以选择 多行 - 完全正则 模式来匹配。

![PixPin_2026-01-07_21-30-40.png](https://s3.babudiu.com/iuxt/2026/01/317795f30f1c660c5a822356b73bbdcb.png)

点击完成后就完成了日志采集。

## 多行正则模式匹配

假设业务日志格式为：

```bash
2026-01-07 20:58:29.335  INFO [tsp-agent,517f1bd4b38282b2,e66be3ada6f121cf,true] [XNIO-1 task-7] c.ingeek.nub.webmvc.filter.PrintFilter   [145]: 响应
 ResponseHeader: 
    Transfer-Encoding: chunked
    Connection: keep-alive
    Date: Wed, 07 Jan 2026 12:58:29 GMT
    Content-Type: application/json
 Body: 
    {"code":0,"message":"成功","data":{"nkUserId":"158c440b431d482a8a738f82caf2f638","nkUserTicket":"2bb5003769864887a90f615a7381d253","expiresAt":1767790769}}
```

那么我们需要的日志字段有（按日志顺序）：
1. `2026-01-07 20:58:29.335` 日志时间
2. `INFO` 日志级别
3. `[服务名，TraceId， SpanId, 不知道是什么字段]`
4. `[XNIO-1 task-7]` XNIO：是 XNIO 框架的线程池 task-7：线程池中的第 7 个工作线程
5. `c.ingeek.nub.webmvc.filter.PrintFilter` 哪个类打印出来的
6. `[145]` 上面的 java 类的第 145 行打印的日志
7. 冒号 `:` 后面的是日志原文了，多行的

根据这个，写一个正则，然后点击提取验证。

```bash
(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})\s+(\w+)\s+\[([^,\]]*),([^,\]]*),([^,\]]*),[^,\]]*\]\s+\[[^\]]+\]\s+([^\s[]+)\s*\[\d+\]:\s*(.*)
```

需要的字段，用括号 `()` 包起来，点击提取验证，下面就会有示例：

![PixPin_2026-01-07_21-35-01.png](https://s3.babudiu.com/iuxt/2026/01/08cd7c5ffcec078c5c5498885d07530a.png)

给提取到的日志起个 Key 名

![PixPin_2026-01-07_21-36-00.png](https://s3.babudiu.com/iuxt/2026/01/c2dd553bab374319845662843ecad4ab.png)

然后到 CLS 日志 -> 检索分析里面，可以看到日志字段都成功解析了。

![PixPin_2026-01-07_21-37-40.png](https://s3.babudiu.com/iuxt/2026/01/67333f1c3c108711fc63b8ae9c8e6087.png)

## Ingress Nginx 访问日志采集

比如想采集 `ingress-nginx` 的访问日志，需要先配置 ingress controller 的日志输出格式（Nginx 同理）。然后再进行采集，日志解析格式为 json 即可。
