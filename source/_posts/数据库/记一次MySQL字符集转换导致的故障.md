---
title: 记一次MySQL字符集转换导致的故障
categories:
  - 数据库
tags: [踩坑记录]
abbrlink: sxl41q
date: 2025-06-09 18:34:38
cover: ""
updated: 2025-08-15 23:23:33
---

业务报错如下：

![image.png](https://s3.babudiu.com/iuxt/images/20250609183441693.png)

经过排查为 MySQL 字符集 utf8 ，当插入 emoji 表情包的时候，就会报错。

> 用 python 查看这是个什么：
>  `b'\xF0\x9F\x90\x92'.decode('utf-8')`
>  ![image.png](https://s3.babudiu.com/iuxt/2025/08/fb70f46de93a4c206abd70ac6642dc46.png)

尝试将表转换成 utf8mb4 字符集

```sql
ALTER TABLE vehicle_user_role CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

结果导致 数据库 CPU 飙升

于是进行回滚操作：

```sql
ALTER TABLE vehicle_user_role CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;
```

结果报错：

```sql
ERROR 1366 (HY000): Incorrect string value: '\xF0\x9F\x90\x92"}' for column 'EXT' at row 333582
```

原因是执行完这段时间已经有 emoji 数据写入到数据库了，找到这条数据：

```sql
SELECT * FROM vehicle_user_role WHERE HEX(`EXT`) LIKE '%F09F9092%' LIMIT 1;
```

清理不正确的数据：

```sql
UPDATE vehicle_user_role SET EXT = NULL WHERE ROLE_ID = 'df169ce2c1dd4574b014cb184b970f8e';
```

再次转换：

```sql
ALTER TABLE vehicle_user_role CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;
```

这个时候数据库还原成原始的样子。

转换了表的字符集导致跨表查询的时候索引失效了，正确处理方式：不改表只转换字段的字符集：

```sql
ALTER TABLE vehicle_user_role MODIFY COLUMN EXT varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```
