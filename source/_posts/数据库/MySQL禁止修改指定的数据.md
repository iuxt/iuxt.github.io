---
title: MySQL禁止修改指定的数据
categories:
  - 数据库
tags: 
abbrlink: sxc6sn
date: 2023-06-04 22:55:35
cover: ""
updated: 2025-06-04 23:01:09
---

比如有个字段，不想让程序修改它的值，但是精确到表中的数据，不能简单粗暴的通过权限来控制。

## 添加触发器

```sql
DELIMITER //
CREATE TRIGGER prevent_blogname_change
BEFORE UPDATE ON wp_options
FOR EACH ROW
BEGIN
    IF NEW.option_name = 'blogname' AND NEW.option_value != OLD.option_value THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'blogname cannot be modified';
    END IF;
END//
DELIMITER ;
```

## 测试验证

```sql
UPDATE wp_options
SET option_value = '新标题'
WHERE
	option_name = 'blogname';
```

生效的话，会提示：
![image.png](https://s3.babudiu.com/iuxt/images/20250604230002963.png)
