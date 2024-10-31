---
title: linux用户管理
categories:
  - 基础运维
tags:
  - Shell
  - 命令行工具
  - Linux
  - 常用操作
abbrlink: sd9in4
cover: 'https://static.zahui.fan/public/bash.svg'
date: 2021-05-10 17:06:40
---

## 增加用户

useradd [选项] 用户名

| 选项  | 说明                                                                                      |
| --- | --------------------------------------------------------------------------------------- |
| -g  | 指定用户的用户主组,（查看用户属于哪个组直接从 passwd 文件查看）                                                      |
| -G  | 指定用户的附加组     （查看用户属于哪个附加组直接从 group 文件查看）                                                  |
| -u  | 指定用户 ID，即指定用户标识符 ((ID 是唯一的),不想使用系统默认指定的 ID 则可以使用 -u 指定 ID,默认 Centos6.x500 之后递增，Centos7.x 从 1000 之后递增 |
| -d  | 自定义用户的家目录,不要系统默认创建的家目录                                                                  |
| -m  | 创建用户的家目录                                                                                |
| -M  | 不创建家目录                                                                                  |
| -c  | 备注信息,可写可不写                                                                              |
| -s  | 指定用户登录的 shell,不写默认是/bin/sh,通常会给程序创建一个不允许登陆的账号 -s /sbin/nologin 或 -s /bin/false             |
| -r  | 创建一个系统账号,centos7 系统账号的 UID 是从 1-999 之间的,centos6 是从 1-499 之间的                                    |

常用格式：

```bash
useradd -m -s /bin/bash iuxt            # 常用操作，创建用户和家目录。
useradd iuxt							#创建iuxt用户和自动默认创建同名的iuxt组，默认分配用户ID
useradd -M -s /sbin/nologin nginx		#创建一个没有家目录及不能登录的nginx用户
useradd -g 1001 -G 1002 -u 8989 -d /home/iuxt -s /bin/bash iuxt
```

## 修改用户信息

usermod 修改用户信息
usermod 命令用于修改用户信息，其语法格式如下：

usermod [选项] 用户名

| 选项  | 说明  |
| --- | --- |
|-g   |	修改用户的用户组,其后可接组名或 gid（查看用户属于哪个组直接从 passwd 文件查看）（一个用户只能有一个主组）|
|-G		|修改用户的附加组,其后可接组名或 gid（查看用户属于哪个附加组直接从 group 文件查看）（一个用户可以有多个附属组,换句话说,一个组可以有多个用户,但这个组对用户来说必须是附加组）|
|-u		|修改用户 ID，即修改用户标识符|
|-l    	|修改用户名（usermod -l new_name old_name）|
|-s		|修改用户登录的 shell|
|-L		|锁住用户|
|-U		|解锁用户|
|-d		|修改用户的家目录|
|-m		|必须与 -d 一起使用，表示移动家目录里面文件|

常用操作

```bash
usermod -l iuxt old_name     		# 将用户名old_name改为iuxt,仅仅是修改用户名,家目录名old_name或默认组old_name并没有被修改
usermod -L iuxt						# 锁住用户iuxt
usermod -md /home/iuxt1 iuxt		# 修改用户iuxt的家目录,iuxt1目录必须实现创建,而且创建后注意属主属组权限
usermod -s /sbin/nologin iuxt		# 修改用户的登录shell
usermod -g 6688 iuxt				# 修改用户的主组
usermod -G zhangsan,zabbix lisi		# -G指定修改lisi附属组为zhangsan，zabbix
id lisi								# 查看lisi的信息
```

说明：
一个用户只能有一个主组，但可以有多个附加组。使用 id user_name 来查看。
修改用户家目录必须使用参数 -md 配合使用。

## 删除用户

userdel 删除用户
userdel 命令用于删除用户，其语法格式如下：

userdel [选项] 用户名

|  选项   |  说明   |
| --- | --- |
|-f	|			强制删除,即使用户正在登录|
|-r	|			删除用户,其家目录和 mail spool 也一并删除|
