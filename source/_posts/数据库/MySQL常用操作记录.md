---
title: MySQL常用操作记录
abbrlink: fa013442
cover: 'https://s3.babudiu.com/iuxt/public/MySQL.svg'
categories:
  - 数据库
tags:
  - MySQL
  - SQL
  - 配置记录
date: 2022-04-22 00:43:48
---

记录一下日常工作中常用到的 MySQL 语句和一些配置等，方便日后查询

## 用户授权相关

### 创建用户

```sql
-- CREATE USER 'root'@'%' IDENTIFIED BY '123456';

CREATE USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '123456';
```

### 修改密码

```sql
-- ALTER USER 'root'@'%' IDENTIFIED BY '123456';

ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '123456';
```

### 授权

```sql
Grant all privileges on *.* to 'root'@'%' with grant option;
```

### 授权的同时修改密码

```sql
Grant all privileges on *.* to 'root'@'%' identified by '123456' with grant option;
```

### 创建只读账号

```sql
GRANT SElECT ON *.* TO 'read_only'@'ip' IDENTIFIED BY "password"

/* 
CREATE USER 'read_only'@'ip' IDENTIFIED BY 'password';
GRANT SELECT ON *.* TO 'read_only'@'ip' WITH GRANT OPTION;
*/

/* 删除权限 */
/* REVOKE all privileges ON *.* FROM 'read_only_user'@'ip'; */
```

### 创建业务账号

```sql
CREATE USER 'username'@'%' IDENTIFIED BY 'password';
GRANT Alter, Create, Create View, Delete, Index, Insert, Lock Tables, Select, Show Databases, Show View, Update ON *.* TO `username`@`%`;
```

## 库相关

### 建库

```sql
CREATE DATABASE `idp_app` CHARACTER SET 'utf8' COLLATE 'utf8_general_ci';
CREATE DATABASE `idp_sdk` CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_general_ci';
```

## 配置文件相关

apt 安装的 mysql 配置文件在 `/etc/mysql/mysql.conf.d/mysqld.cnf`

### 初始化密码

> ubuntu 系统通过 apt 安装的 mysql，需要切换到 root，然后执行 mysql 命令就可以登录（不用密码），对应的用户是 `root@localhost`
> 当然也可以 `cat /etc/mysql/debian.cnf` 查看密码。

### 表名强制转换为小写

仅适用于 MySQL 5.7 及以下版本，到了 8.0，只支持初始化时指定该参数，初始化之后，如果修改了该参数，启动就会报错。

配置文件在 [mysqld] 下面新增一行

```ini
[mysqld]
lower_case_table_names = 1
```

可以通过执行 sql 查看是否设置成功

```sql
show variables like 'lower_case_table_names';
```

### 查看建库建表语句

```sql
show create database django;
show create table django.auth_user;
```

## binlog

查看 binlog 状态

```sql
MySQL [(none)] > show variables like 'log_bin%';
+---------------------------------+------------------------------------+
| Variable_name                   | Value                              |
+---------------------------------+------------------------------------+
| log_bin                         | ON                                 |
| log_bin_basename                | /data/mysql/binlog/mysql_bin       |
| log_bin_index                   | /data/mysql/binlog/mysql_bin.index |
| log_bin_trust_function_creators | OFF                                |
| log_bin_use_v1_row_events       | OFF                                |
+---------------------------------+------------------------------------+
5 rows in set (0.02 sec)

```

查看 binlog 模式

```sql
MySQL [(none)] > show variables like '%binlog_format%';
+---------------+-------+
| Variable_name | Value |
+---------------+-------+
| binlog_format | ROW   |
+---------------+-------+
1 row in set (0.00 sec)
```

binlog 配置文件

```ini
[mysqld]
server_id = 1
log_bin = /var/log/mysql/mysql-bin.log
max_binlog_size = 1G
binlog_format = row
binlog_row_image = full
```

## 排序

```sql
SELECT * from runoob_tbl ORDER BY submission_date ASC;  # 升序
SELECT * from runoob_tbl ORDER BY submission_date DESC;   # 降序
```

## 批量 kill 慢查询

```sql
-- 查询哪些查询时间大于20秒
select *  from information_schema.processlist where COMMAND='Query' AND time > 20;

-- 生成kill慢查询的语句（不执行kill）
select concat('KILL ',id,';') from information_schema.processlist where COMMAND='Query' AND time > 20;
```

自动 kill 慢 SQL 脚本，并记录日志到文件

```bash
#!/bin/bash

MYSQL_CMD="mysql -uroot -pxxxxx -h 192.168.10.10"
NOW=$(date +'%Y-%m-%d %H:%M:%S')
SLOWLOG=$(${MYSQL_CMD} -e "select * from information_schema.processlist where COMMAND='Query' AND time > 10;" 2>/dev/null | sed '1d' )

if [ -n "${SLOWLOG}" ];then
    echo ${NOW}
    echo ${SLOWLOG}
    ${MYSQL_CMD} -e "select id from information_schema.processlist where COMMAND='Query' AND time > 10;" 2>/dev/null | sed '1d' | xargs -I {} echo "${MYSQL_CMD} -e 'kill {};'" | bash 2>/dev/null
fi
```

crontab 配置

```bash
* * * * * bash /root/slowlog.sh >> /root/slowlog.txt 2>&1
```

## 查看版本

### 查看变量的方式

```sql
show variables like '%version%';
```

### mysql 命令行执行命令的方式

```sql
status
```

### 使用 MySQL 函数方式：

```sql
select version();
```

## 查看哪些库使用的是 MyISAM 引擎

查询哪些表引擎是 MyISAM

```sql
SELECT TABLE_SCHEMA as DbName ,TABLE_NAME as TableName ,ENGINE as Engine FROM information_schema.TABLES WHERE ENGINE='MyISAM' AND TABLE_SCHEMA NOT IN('mysql','information_schema','performance_schema');
```

生成 `ALTER` 语句来转换到 `InnoDB`

```sql
SELECT CONCAT('ALTER TABLE ', TABLE_SCHEMA,'.',TABLE_NAME, ' ENGINE = InnoDB;') FROM information_schema.TABLES WHERE ENGINE='MyISAM' AND TABLE_SCHEMA NOT IN('mysql','information_schema','performance_schema');
```

## 查看语句使用的索引

```sql
-- EXPLAIN select 语句;
mysql> explain select * from emp where e_name='Mark'\G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: emp
   partitions: NULL
         type: ref
possible_keys: idx_ename
          key: idx_ename
      key_len: 81
          ref: const
         rows: 1
     filtered: 100.00
        Extra: NULL
1 row in set, 1 warning (0.00 sec)


```

说明

```vim
（1）  id：SELECT 识别符
（2）  select_type：SELECT 查询的类型
（3）  table：数据表的名字
（4）  partitions：匹配的分区
（5）  type：访问表的方式
（6）  possible_keys：查询时可能使用的索引
（7）  key：实际使用的索引
（8）  key_len：索引字段的长度
（9）  ref：连接查询时，用于显示关联的字段
（10） rows：需要扫描的行数(估算的行数)
（11） filtered：按条件过滤后查询到的记录的百分比
（12） Extra：执行情况的描述和说明
```

## 只读模式

### 设置为只读模式

```sql
flush tables with read lock;
set global read_only=on;
```

### 设置为可读写模式

```bash
set global read_only=off;
unlock tables;
```
