---
date: 2026-02-03 11:56:51
updated: 2026-02-03 11:57:15
---

```sql
-- 开启事务，确保两步操作要么都成功，要么都回滚
START TRANSACTION;

-- 步骤1：修改原表名（添加后缀如 _bak/old 区分，避免冲突）
ALTER TABLE vos_portal.vos_vehicle_operation_log 
RENAME TO vos_portal.vos_vehicle_operation_log_bak;

-- 步骤2：创建结构完全一致的空表（含字段、类型、主键、索引、非空/默认值，无数据）
CREATE TABLE vos_portal.vos_vehicle_operation_log 
LIKE vos_portal.vos_vehicle_operation_log_bak;

-- 提交事务（确认操作无误后执行，若出错执行 ROLLBACK; 回滚）
COMMIT;
```
