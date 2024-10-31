---
title: Linux常用命令之lsof
categories:
  - 基础运维
tags:
  - Linux
  - cli
  - bash
  - 命令行工具
  - 配置记录
abbrlink: ls0614ms
cover: 'https://static.zahui.fan/public/bash.svg'
date: 2021-01-30 17:38:01
---

lsof（list open files）是一个列出当前系统打开文件的工具。在 linux 环境下，任何事物都以文件的形式存在，通过文件不仅仅可以访问常规数据，还可以访问网络连接和硬件。

## 常用参数

| 参数 | 说明 |
| ---- | ---- |
| -p | 根据 pid 查找 |
| 直接加文件路径 | 查看这个文件被哪个进程打开了 |
| -c | 显示 COMMAND 列中包含指定字符的进程所有打开的文件 |
| lsof -u username | 显示所属 user 进程打开的文件 |
| -i | 用以显示符合条件的进程情况 |
| lsof -g gid | 显示归属 gid 的进程情况 |
| lsof +d /DIR/ | 显示目录下被进程打开的文件 |
| lsof +D /DIR/ | 同上，但是会搜索目录下的所有目录，时间相对较长 |
| lsof -d FD | 显示指定文件描述符的进程 |
| lsof -n | 不将 IP 转换为 hostname，缺省是不加上 -n 参数 |
| lsof -i | 用以显示符合条件的进程情况 |

## 一些例子

### 查看 java 程序打开的文件

```bash
lsof -c java
```

当然你也可以到 `/proc/<进程pid>/fd` 里面看到这个进程被打开的文件

### 查看一个文件被哪个程序打开

```bash
lsof /tmp/a.log
```

### 查看一个端口对应程序打开的文件

```bash
lsof -i :22
```

### 查看 root 用户打开的 txt 文件

```bash
lsof -a -u root -d txt
```

### 意外删除文件恢复

当系统中的某个文件被意外地删除了，只要这个时候系统中还有进程正在访问该文件，那么我们就可以通过 lsof 从/proc 目录下恢复该文件的内容。假如由于误操作将/var/log/messages 文件删除掉了，那么这时要将/var/log/messages 文件恢复的方法如下：

首先使用 lsof 来查看当前是否有进程打开/var/logmessages 文件，如下：

```bash
lsof |grep /var/log/messages
syslogd 1283 root 2w REG 3,3 5381017 1773647 /var/log/messages (deleted)
```

从上面的信息可以看到 PID 1283（syslogd）打开文件的文件描述符为 2。同时还可以看到/var/log/messages 已经标记被删除了。因此我们可以在 /proc/1283/fd/2 （fd 下的每个以数字命名的文件表示进程对应的文件描述符）得到所要恢复的数据。