---
title: Linux的crontab无法执行的一些问题
abbrlink: 63d10d9c
categories:
  - 基础运维
tags:
  - Crontab
  - Linux
cover: 'https://static.zahui.fan/public/bash.svg'
date: 2022-01-06 16:50:41
---

crontab 是 linux 平台的定时任务系统，不过有时候可以运行的命令或脚本在 crontab 里面就是不运行，下面找了一些可能的原因以及解决方案。

## 看不到日志

一般来说，crontab 的任务控制台输出会打到 `/var/spool/mail/<username>` 里面，然后通过 email 发出去
`crontab` 服务的运行的日志一般都在 `/var/log/cron` 里面，这个日志可以看到任务有没有执行

如果想将命令输出内容重定向到其他文件，可以在命令后添加 ` >> xxx.log 2>&1`, 不加 `2>&1` 错误日志看不到

```bash
* * * * * date >> /tmp/cron.log 2>&1
```

## 环境变量的问题

crontab 环境变量和登录 shell 查看的环境变量是不同的，比如

```bash
* * * * * env >> /tmp/env.log 2>&1
```

查看一下：

```ini
HOME=/home/iuxt
LOGNAME=iuxt
PATH=/usr/bin:/bin
LANG=C.UTF-8
SHELL=/bin/sh
PWD=/home/iuxt
```

比系统的环境变量要少很多，比如 PATH 只有 `/usr/bin` 和 `/bin`， 安装在其他位置的程序是会 `command not found` 的，解决方法有两个：

1. 写绝对路径

    ```bash
    * * * * * /usr/bin/env >> /tmp/env.log 2>&1
    ```

    > 但是这个方法对于很多脚本比较麻烦，因为脚本里面可能用的是相对路径也会 `command not found` 的

2. crontab 的首部添加需要的环境变量

    ```bash
    PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
    SHELL=/bin/bash
    LANG=en_US.UTF-8
    * * * * * env >> /tmp/env.log 2>&1
    ```

3. 在命令的前方添加环境变量

    ```crontab
    * * * * * TEST=XXX env >> /tmp/env.log 2>&1
    ```

4. 把命令放进 shell 脚本里，在脚本顶部声明环境变量

    ```bash
    #!/bin/bash
    PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
    ```

## 权限问题

这个比较好理解了，crontab 也是分用户执行的
cron 配置文件在 `/var/spool/cron/用户名`(redhat 系)，没有权限访问可执行文件，或者没有权限生成临时文件等都会导致 crontab 执行失败。

使用 crontab 编辑的时候可以指定用户

```bash
crontab -u iuxt -e
```

## 换行符

这个比较坑了，man crontab 解释如下：

```text
Although cron requires that each entry in a crontab end in a newline character, neither the crontab command nor the cron daemon will detect this error. Instead, the crontab will appear to load normally. However, the command will never run. The best choice is to ensure that your crontab has a blank line at the end.

4th Berkeley Distribution 29 December 1993 CRONTAB(1)
```

每一条 cron 表达式都要以换行符结尾，保险起见 crontab 最后留一个空行吧。

## 服务没启动

crontab 服务 crond 没有启动

启动 `servicd crond start`

## 时区问题

修改时区后需要重启 crond 服务才能以新的时区为准。

## 路径问题

脚本里面写绝对路径没问题，写相对路径就会造成脚本执行不对，比如一个脚本会写入文件：

```bash
#!/bin/bash

# 进入脚本所在目录
cd "$(dirname "$0")"

NOW=$(date +'%Y-%m-%d %H:%M:%S')
echo $NOW >> log.log
```

如果不加 `cd "$(dirname "$0")"` 那么 crontab 会将 log.log 文件写入到 Home 目录，加上 `cd "$(dirname "$0")"` 会先进入到脚本所在目录再执行。