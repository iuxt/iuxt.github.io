---
title: MySQL进行文件操作
categories:
  - 数据库
abbrlink: sio0v4
cover: 'https://s3.babudiu.com/iuxt/public/MySQL.svg'
date: 2024-08-23 17:54:40
tags:
---

我执行了这条命令：

```sql
select concat('KILL ',id,';') from information_schema.processlist where  COMMAND='Query' AND time > 10 into outfile '/tmp/a.txt';
```

报错： `The MySQL server is running with the --secure-file-priv option so it cannot execute this statement`

查询 MySQL 的安全文件目录

```sql
mysql> show variables like '%secure%';
+--------------------------+-----------------------+
| Variable_name            | Value                 |
+--------------------------+-----------------------+
| require_secure_transport | OFF                   |
| secure_file_priv         | /var/lib/mysql-files/ |
+--------------------------+-----------------------+
2 rows in set (0.00 sec)
```

文件可以写入到这个目录，修改一下 SQL：

```sql
select concat('KILL ',id,';') from information_schema.processlist where  COMMAND='Query' AND time > 10 into outfile '/var/lib/mysql-files/a.txt';
```