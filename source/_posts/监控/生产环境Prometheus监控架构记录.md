---
title: 生产环境Prometheus监控架构记录
categories:
  - 监控
tags:
  - ''
abbrlink: sn6pu2
date: 2024-11-19 14:25:14
cover: ''
---

比如有 30 家客户，每一个客户都有自己的 Kubernetes 集群，部署方式千差万别，还有客户不使用 Kubernetes 的，使用虚拟机部署，那么怎么对这么多客户的机器、服务进行有效的监控，本文记录一下监控的架构方案。

## 监控架构图

## Prometheus Core

这个是核心的 Prometheus，其他客户的 Prometheus 通过联邦接入或者 远程写 (remote write) 的方式来写入数据到这个 Prometheus 中。Prometheus Core 可以更换成 [VictoriaMetrics](/posts/e59d8e32)

[[Prometheus监控架构图]]

