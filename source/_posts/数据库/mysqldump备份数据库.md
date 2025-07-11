---
title: Mysqldump备份数据库
abbrlink: 913ca09b
cover: 'https://s3.babudiu.com/iuxt/public/MySQL.svg'
categories:
  - 数据库
tags:
  - MySQL
date: 2022-09-30 10:10:41
---

mysqldump 是 [MySQL](/tags/mysql) 数据库自带的导出 sql 工具，可以导出原生 sql，方便后续使用。

## 创建备份用户

```sql
CREATE USER 'backup'@'%' IDENTIFIED BY 'password';

/* Grant all privileges on *.* to 'backup'@'%' with grant option; */

Grant select,lock tables,show view,trigger,event on database.* to 'backup'@'%';

ALTER USER 'backup'@'%' IDENTIFIED BY 'password';
```

## 备份格式

```bash
mysqldump -h主机名 -P端口 -u用户名 -p密码 --databases 数据库名 > 文件名.sql
```

## 备份压缩

mysql 导出的文件是字节流，可以通过管道进行压缩。

```bash
mysqldump -h主机名 -P端口 -u用户名 -p密码 --databases 数据库名 | gzip > 文件名.sql.gz
```

解压：

```bash
gzip < 文件名.sql.gz > 文件名.sql
```

如果 cpu 性能比较差，建议不压缩，或者备份完成后再压缩，不然备份速度非常慢

## 备份指定库

```bash
mysqldump -h主机名 -P端口 -u用户名 -p密码 --databases 数据库名1 数据库名2 数据库名3 > 文件名.sql
```

## 备份同个库多个表

```bash
mysqldump -h主机名 -P端口 -u用户名 -p密码 --databases 数据库名 --tables 表1 表2 .... > 文件名.sql
```

## 备份所有库

```bash
mysqldump -h主机名 -P端口 -u用户名 -p密码 --all-databases > 文件名.sql
```

## 附带 drop 表或库的备份

```bash
# 默认情况下备份的 sql 也会带 drop table 的
mysqldump -h主机名 -P端口 -u用户名 -p密码 --add-drop-table --add-drop-database 数据库名 > 文件名.sql
```

这样导入的时候，如果存在对应的库或表，会被先删除再导入。

## 备份结构，不备份数据

```bash
mysqldump -h主机名 -P端口 -u用户名 -p密码 --no-data --databases 数据库名1 数据库名2 数据库名3 > 文件名.sql
```

## 备份不锁表，记录 binlog 位置

```bash
mysqldump -uroot -ppassword -hlocalhost -P3306 --master-data=2 --single-transaction --skip-tz-utc --all-databases > /tmp/db.sql
```

## 备份数据库， 不带 drop 语句

默认备份的类似于：

```sql
--
-- Table structure for table `db_sms_auth_code`
--

DROP TABLE IF EXISTS `db_sms_auth_code`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `db_sms_auth_code` (
  `CID` varchar(32) NOT NULL,
  `TEXT` varchar(255) DEFAULT NULL,
  `CODE` int(11) DEFAULT NULL,
  `MOBILE_NO` varchar(20) DEFAULT NULL,
  `CREATE_DATE` datetime DEFAULT NULL,
  `STATUS` int(2) DEFAULT NULL,
  `PR_ID` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`CID`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='短信校验码';
/*!40101 SET character_set_client = @saved_cs_client */;
```

考虑到安全问题，不想要 DROP 语句，可以增加 `--skip-add-drop-table` 参数

## 拆分 insert 语句

默认 mysqldump 备份的文件会在一条 insert 语句中插入很多条数据，这样可以缩小 sql 文件的大小，还能增加导入时候的速度，但是在某些场景下，我们还是希望一条 insert 对应一条数据。那么可以增加 `--skip-extended-insert` 参数

![](https://s3.babudiu.com/iuxt/images/202402071656925.png)

## 备份脚本

```bash
#!/bin/bash
set -euo pipefail

MYSQL_HOST='127.0.0.1'
MYSQL_USER='root'
MYSQL_PASSWORD='com.012'
MYSQL_PORT='3306'
SQL_PATH='/tmp/backup.sql.gz'
EXCLUDE_DATABASES='information_schema|performance_schema|sys|mysql'


mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} -h${MYSQL_HOST} -P${MYSQL_PORT} -N -e "show databases;" | grep -Ev ${EXCLUDE_DATABASES} | xargs mysqldump -u${MYSQL_USER} -p${MYSQL_PASSWORD} -h${MYSQL_HOST} -P${MYSQL_PORT} --single-transaction --master-data=2 --triggers --routines --events --hex-blob --skip-tz-utc --databases | gzip > ${SQL_PATH}

```

注： gz 文件解压： `gzip -d backup.sql.gz`
