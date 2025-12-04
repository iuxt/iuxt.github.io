---
title: 使用s6-Overlay来管理多进程容器
abbrlink: ea811085
categories:
  - 容器
tags: [Container, Crontab]
date: 2021-12-30 18:21:43
updated: 2025-12-04 18:53:21
---

容器使用最佳实践是：一个容器运行一个进程，进程退出容器也就退出，很优雅是不是？但是...在日常工作中总有一些你懂的的原因，就需要多个进程塞在一个容器里面，那么我们可以怎么来管理容器内进程呢？这个时候容器内的进程管理工具就派上用场了。s6-Overlay 就是其中之一
s6-Overlay 官方 github 地址：<https://github.com/just-containers/s6-overlay>

v2 和 v3 有配置区别，这里以 v3 版本为例。

## 安装

容器是通过判断 pid=1 的进程来判断容器是否工作正常的，也就是说 s6-Overlay 进程 pid 为 1

通过官方安装脚本来安装， 在 Dockerfile 里加上这些配置：

> 需要安装 xz 解压缩工具，不然 docker build 的时候会报错。

```dockerfile
ARG S6_OVERLAY_VERSION=3.2.1.0
RUN curl -sSL https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-noarch.tar.xz | tar -xJvf - -C /
RUN curl -sSL https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-x86_64.tar.xz | tar -xJvf - -C /

# 这里拷贝你的配置文件
ADD s6-rc.d /etc/s6-overlay/s6-rc.d

ENTRYPOINT ["/init"]
```

## 目录结构

```tree
/etc/
   └──s6-overlay/
       └──s6-rc.d/
           |-- app1/               # 服务应用1
           |   |-- dependencies    # 依赖服务，文件内容：init
           |   |-- log
           |   |   └── run         # 收集控制台日志的配置
           |   |-- finish          # 服务结束脚本（可选）
           |   |-- run             # 服务启动脚本
           |   └── type            # 服务类型，文件内容：longrun
           |-- app2/               # 服务应用2
           |   |-- dependencies
           |   |-- finish
           |   |-- run
           |   └── type
           |-- init/               # 服务3，用于容器初始化
           |   |-- type            # 服务类型 oneshot
           |   └── up              # 初始化脚本
           └── user/               # 用户服务集
               └── contents.d/
                   |-- app1        # 空文件，表示 app1 属于 user bundle
                   |-- app2        # 空文件
                   └── init        # 空文件
```

其中 run 和 finish 都是可执行文件（bash 或 python 或二进制等），容器启动会运行 run 程序，如果 run 意外退出则会运行 finish，并且会被自动拉起。整个过程容器不会退出。

type 文件的内容可以是 `oneshot` (执行一次就退出) 或 `longrun` （长期前台运行）

run 文件里面运行程序，需要加上 `exec `

## 举个栗子

### 容器里面运行 crontab

```bash
apt-get install -y cron
```

然后容器里面编写服务启动脚本 run， 前面加上 `exec` ，`-f` 参数让 cron 前台运行。

```bash
#!/bin/bash
exec cron -f
```

服务结束脚本 finish， 用于清理日志等善后操作。

```bash
#!/bin/bash
rm -f /var/log/xxx.log
exit 0
```

然后在 `/etc/s6-overlay/s6-rc.d/user/contents.d` 里面创建一个空文件 `cron` ， 这样就可以在容器里面运行 crontab 了，多个程序需要都写到这个目录下。
