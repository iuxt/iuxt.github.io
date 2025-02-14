---
title: Nacos 2.0.3 集群升级为 2.1.0
categories:
  - 容器
tags: [nacos, Kubernetes]
abbrlink: srnwhe
date: 2025-02-14 15:22:25
cover: https://static.zahui.fan/public/Nacos.svg
updated: 2025-02-14 15:40:13
---

## 2.0.3 版本的 BUG

详细 bug 在 GitHub 上有，比如：
![image.png](https://static.zahui.fan/images/20250214153333408.webp)

issue 链接见：
<https://github.com/alibaba/nacos/issues/9332>
<https://github.com/alibaba/nacos/issues/8492>

我们遇到的 bug 简单一句话总结就是：集群方式部署的 nacos 其中一个节点重启后可能会有节点数据不一致的现象（服务注册与服务发现里面的服务数量不一致）比如说一个服务注册到了 nacos 中，我在 nacos 网页控制台 `服务管理` `服务列表` 里查看有 10 个服务注册进来，刷新下网页可能就变成了 9 个，再刷新又变成 10 个，这种情况就是 nacos 的多个节点数据不同步了（nacos 配置中心数据是从 MySQL 取的，不受这个 bug 的影响），这种情况可以直接将 nacos 副本数设置成 1 临时解决，想要彻底解决我们验证了升级到 2.1.0 就能修复。

## 升级数据库表结构

> nacos 官网文档写的太敷衍了，版本之间的差异需要自己找，哪怕你上个 flyway 也好啊。

其中有三个表（config_info、config_info_beta、his_config_info）都加了 encrypted_data_key 这个字段。 所以升级方法也很简单，在这三张表上都加上 encrypted_data_key 这个字段就行了。

```sql
ALTER TABLE nacos.config_info ADD encrypted_data_key TEXT NOT NULL; 
ALTER TABLE nacos.config_info_beta ADD encrypted_data_key TEXT NOT NULL; 
ALTER TABLE nacos.his_config_info ADD encrypted_data_key TEXT NOT NULL;
```

## 升级版本到 2.1.0

我们是部署在 Kubernetes 中的，只需要升级镜像版本就行了。一个镜像代理地址：`registry.cn-hangzhou.aliyuncs.com/iuxt/nacos-server:v2.1.0`

具体部署配置查看：[在Kubernetes中部署nacos 2.1.0](/posts/sebxm6/)
