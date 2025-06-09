---
title: MySQL字符集转换导致
categories:
  - 数据库
tags: ['']
abbrlink: sxl41q
date: 2025-06-09 18:34:38
cover: ''
updated: 2025-06-09 18:35:00
---

![image.png](https://static.zahui.fan/images/20250609183441693.png)

ALTER TABLE vehicle_user_role CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
导致 CPU 飙升

回滚的时候：
ALTER TABLE vehicle_user_role CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;

报错：
ERROR 1366 (HY000): Incorrect string value: '\xF0\x9F\x90\x92"}' for column 'EXT' at row 333582

找到这条数据：
SELECT * FROM vehicle_user_role WHERE HEX(`EXT`) LIKE '%F09F9092%' LIMIT 1;

清理不正确的数据：
UPDATE vehicle_user_role SET EXT = NULL WHERE ROLE_ID = 'df169ce2c1dd4574b014cb184b970f8e';

再次转换：
ALTER TABLE vehicle_user_role CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;

只转换字段。
ALTER TABLE vehicle_user_role MODIFY COLUMN EXT varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
