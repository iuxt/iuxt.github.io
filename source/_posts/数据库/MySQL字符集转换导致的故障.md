---
title: MySQL字符集转换导致的故障
categories:
  - 数据库
tags: [踩坑记录]
abbrlink: sxl41q
date: 2025-06-09 18:34:38
cover: ""
updated: 2025-06-10 19:34:42
---

![image.png](https://s3.babudiu.com/iuxt/images/20250609183441693.png)

```sql
ALTER TABLE vehicle_user_role CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

导致 CPU 飙升

回滚的时候：

```sql
ALTER TABLE vehicle_user_role CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;
```

报错：

```sql
ERROR 1366 (HY000): Incorrect string value: '\xF0\x9F\x90\x92"}' for column 'EXT' at row 333582
```

找到这条数据：

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

只转换字段。

```sql
ALTER TABLE vehicle_user_role MODIFY COLUMN EXT varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```
