---
title: MySQL基于GTID的主从复制
categories:
  - 数据库
tags:
  - MySQL
  - mysqld
  - 数据迁移
abbrlink: luwwdbjr
cover: 'https://s3.babudiu.com/iuxt/public/MySQL.svg'
date: 2024-04-13 00:43:22
---

没开启 GTID 的 MySQL 数据库增加从库请看：[优雅地给正在运行的MySQL添加从库](/posts/86a9c8f5/)

## 自动同步连接主库 (方法一)

适用于 master 也是新建不久的情况，如果你的 master 所有的 binlog 还在，可以安装 slave，slave 直接 change master to 到 master 端。原理是直接获取 master 所有的 GTID 并执行。

优点：简单方便。不需要备份主库再在从库还原。
缺点：如果 binlog 太多，数据完全同步需要时间较长。如果旧的 binlog 已经被清理了，则不能正常同步。

在从库执行：

```sql
CHANGE MASTER TO
MASTER_HOST='10.0.0.11',
MASTER_USER='root',
MASTER_PASSWORD='Vb6CAEJqqtcmKndiAkEl',
MASTER_PORT=3306,
MASTER_CONNECT_RETRY=10,
MASTER_AUTO_POSITION=1;
```

`master_auto_position=1` 从库自动找同步点

## 备份导入连接主库 (方法二)

适用于拥有较大数据的情况。（推荐）

通过 master 或者其他 slave 的备份搭建新的 slave。
原理：获取 master 的数据和这些数据对应的 GTID 范围，然后通过 slave 设置 `master_auto_position=1`,自动同步，跳过备份包含的 gtid。
缺点：相对来说有点麻烦。

### 主库使用 mysqldump 导出

```bash
mysqldump  -uroot -pVb6CAEJqqtcmKndiAkEl -hlocalhost -P3306 --triggers --routines --events --hex-blob --single-transaction --skip-tz-utc --all-databases > backup.sql
```

SQL 文件最后有一条：

```sql
SET @@GLOBAL.GTID_PURGED='aab83329-fb19-11ee-85e8-4e5363c108f2:1-689';
```

这是记录了当前的 SQL 对应的 GTID 位置？

### 从库数据导入数据

```bash
mysql -uroot -pVb6CAEJqqtcmKndiAkEl -hlocalhost -P3306 < backup.sql
```

如果导入报错 `@@GLOBAL.GTID_PURGED can only be set when @@GLOBAL.GTID_EXECUTED is empty` ， 需要在从库执行：

```sql
-- 查看当前的GTID
select @@global.gtid_executed\G;

stop slave;
reset slave all;

-- 清空本地的GTID
reset master;
```

### 从库连接主库

```sql
CHANGE MASTER TO
MASTER_HOST='10.0.0.11',
MASTER_USER='root',
MASTER_PASSWORD='Vb6CAEJqqtcmKndiAkEl',
MASTER_PORT=3306,
MASTER_CONNECT_RETRY=10,
MASTER_AUTO_POSITION=1;
```

从库启动复制线程

```sql
mysql> start slave;
```

### 从库查看复制状态

```sql
mysql> show slave status \G;
```

### 主库查看状态

```sql
show master status;
show slave hosts;
show global variables like '%gtid%';
```

### 其他命令

```sql
show binlog events;
show binlog events in 'master-bin.000001';
show master logs;
show processlist
show full processlist;
```