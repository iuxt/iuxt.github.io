---
date: 2025-01-16 14:18:57
updated: 2025-01-16 14:42:45
---

```bash
# 查看打开了什么文件
# 通过进程名
lsof -c more

# 通过PID
lsof -p 30149

# 也可以通过/proc查看
ls -al /proc/30149/fd
```
