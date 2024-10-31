---
title: Fail2ban配合Docker使用解决暴力破解
categories:
  - 基础运维
tags:
  - fail2ban
  - cc攻击
  - iptables
  - docker
abbrlink: 7b28cbbc
cover: 'https://static.zahui.fan/public/fail2ban.png'
date: 2023-01-16 15:50:06
---

fail2ban 正常使用可以参考 [使用Fail2ban抵御暴力破解和cc攻击](/posts/c0880a78)，但是对于使用了 Docker host 网络的容器来说是不生效的。原因最后说， 我们先复原一下部署情况

## 环境现状

服务器是我自己的服务器，使用 Nginx 做入口，反向代理到不同的后端，后端服务和 Nginx 都是运行在 Docker 里，使用 Docker 的自定义网络进行互联。其中 Nginx 容器使用的是 Host 网络

## 配置 fail2ban

### 确定 Docker 版 Nginx 日志路径

Linux 内一切皆文件，Docker 会将日志写入到主机的一个日志文件中。通过

```bash
docker inspect nginx --format "{{.LogPath}}"
```

可以查看到容器的日志位置

### 创建配置文件 `/etc/fail2ban/jail.d/nginx-cc.conf`

```ini
[nginx-cc]
enabled = true
port = http,https
filter = nginx-cc
action = %(action_)s
maxretry = 50
findtime = 10
bantime = 86400
logpath = /var/lib/docker/containers/6fb54f7558d2c7f3c9cb9ce2928f746abd2ce5cd1a3f56fe4889ea3f336b08ff/6fb54f7558d2c7f3c9cb9ce2928f746abd2ce5cd1a3f56fe4889ea3f336b08ff-json.log
```

### 创建配置文件 `/etc/fail2ban/filter.d/nginx-cc.conf`

```ini
[Definition]
failregex = ^\{\"log\":\"<HOST> -.*- .*HTTP/1.* .* .*$
ignoreregex =
```

## 复现问题

照此配置后，多次访问后，查看 `fail2ban-client status nginx-cc`，此时 fail2ban 已经显示 ip 被 ban 了：

![fail2ban显示](https://static.zahui.fan/images/202301161607539.png)

查看 iptables 规则：

![iptables](https://static.zahui.fan/images/202301161608061.png)

也已经 REJECT 了，但是并没有效果。

### 原因分析

![架构图](https://static.zahui.fan/images/202301161608560.png)

原因是 fail2ban 作用于 INPUT 链，而 Docker Host 走的是 Forward 链。

## 解决方案

在 `/etc/fail2ban/jail.d/nginx-cc.conf` 里增加一行配置，指定作用于哪个链。

完整配置如下：

```ini
[nginx-cc]
enabled = true
chain = DOCKER-USER
port = http,https
filter = nginx-cc
action = %(action_)s
maxretry = 50
findtime = 10
bantime = 86400
logpath = /var/lib/docker/containers/6fb54f7558d2c7f3c9cb9ce2928f746abd2ce5cd1a3f56fe4889ea3f336b08ff/6fb54f7558d2c7f3c9cb9ce2928f746abd2ce5cd1a3f56fe4889ea3f336b08ff-json.log
```

执行

```bash
fail2ban-client reload
```

重新加载配置。此时发生 ban ip，再次查看 iptables 规则：

![更改后](https://static.zahui.fan/images/202301161632308.png)

已经作用于 DOCKER-USER 链

## allport 封禁不生效

在 docker 环境下, 需要对通过 docker 转发的所有端口进行封禁的操作, 可以指定作用于 forward 链

```conf
[gitea-docker]
enabled = true
filter = gitea
logpath = /var/lib/gitea/log/gitea.log
maxretry = 10
findtime = 3600
bantime = 900
action = iptables-allports[chain="FORWARD"]
```