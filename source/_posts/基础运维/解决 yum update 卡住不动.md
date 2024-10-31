---
title: 解决 yum update 卡住不动
categories:
  - 基础运维
tags:
  - 配置记录
abbrlink: si7e5o
cover: 'https://static.zahui.fan/public/CentOS.svg'
date: 2020-08-14 18:22:36
---

如果是低内存机器，有可能是内存不够了，增加一些 swap 试试。

```bash
# 强制结束yum进程
kill -9 <pid>

# 删除rpm数据文件
rm -f /var/lib/rpm/__db.00*

# 重建rpm数据文件
rpm -vv --rebuilddb

# 清空缓存后再重新缓存
yum clean all 
yum makecache
```