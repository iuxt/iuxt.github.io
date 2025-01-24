---
title: Linux神奇的proc目录
categories:
  - 基础运维
tags: []
abbrlink: sqkrxr
date: 2023-01-24 12:17:51
cover: ""
updated: 2025-01-24 23:15:43
---

让我们看看/proc 里面都有什么
![image.png](https://static.zahui.fan/images/20250116150653346.png)

## 查看进程打开的文件

```bash
# 查看打开了什么文件
# 通过进程名
lsof -c more

# 通过PID
lsof -p 30149

# 也可以通过/proc查看
ls -al /proc/30149/fd
```

## 查看进程的环境变量

和 env 命令查看到的不同，env 查看的是系统的环境变量，可以理解为默认环境变量，但是进程的环境变量可能不一样，比如说：

```bash
A=B vim a.log
```

这种情况下 vim 进程是有 A 这个环境变量的，可以使用以下命令查看。

```bash
cat /proc/39564/environ |  tr '\0' '\n'  
```

## 启动命令行

```bash
cat cmdline | tr '\0' ' '
```

## 可执行文件

```bash
exe是运行的可执行文件，和上面有一些区别。
```

## limits

进程所受到的限制，比如最大文件打开数等。
