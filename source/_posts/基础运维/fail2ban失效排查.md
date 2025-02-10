---
title: fail2ban失效排查
categories:
  - 基础运维
abbrlink: sjcnkn
cover: https://static.zahui.fan/public/fail2ban.png
date: 2024-09-06 01:07:35
tags:
updated: 2025-02-10 19:10:08
---

## selinux

容易忽略的一点，selinux 会限制 fail2ban 的执行， 手动运行 `/usr/bin/fail2ban-server -xf start` 可以正常运行，但是 systemd 就是无法启动，会报错找不到日志文件，这种情况可以将 selinux 禁用再测试。

```bash
Sep 09 10:44:01 zhangfei fail2ban-server[1795]: 2024-09-09 10:44:01,134 fail2ban                [1795]: ERROR   Failed during configuration: Have not found any log file for nginx-http-cc jail
Sep 09 10:44:01 zhangfei fail2ban-server[1795]: 2024-09-09 10:44:01,134 fail2ban                [1795]: ERROR   Async configuration of server failed
```

## 使用 fail2ban-regex 排查规则

```bash
fail2ban-regex /var/log/xxx.log /etc/fail2ban/filter.d/xxx.conf
```

![image.png](https://static.zahui.fan/images/202409101104574.png)

## IndexError

使用 fail2ban 分析日志，将恶意 IP 封锁，通过 fail2ban-regex 验证，报错： `IndexError: string index out of range`

日志是经过 docker 处理过的，格式如下：

```json
{"log":"\u001b[0m\u001b[1;34m2024-09-06 00:35:39.125 [I] [proxy/proxy.go:204] [83f2b08de40a51a0] [test.rdp] get a user connection [1.1.1.1:2276]\n","stream":"stdout","time":"2024-09-05T16:35:39.125745206Z"}
```

filter 文件：

```ini
[Definition]
failregex = ^.*get a user connection \[<HOST>:[0-9]*\]
            ^.*get a new work connection: \[<HOST>:[0-9]*\]
ignoreregex =
```

fail2ban-regex 报错如下：

![image.png](https://static.zahui.fan/images/202409060106166.png)

问题原因：日志中存在日期字段，docker 又给添加了一个日期字段，导致存在两个日期字段，fail2ban 无法解析。

解决方法： 指定日期格式

修改 filter 文件，增加一行：（`%%` 表示 `%`）

```ini
datepattern = %%Y-%%m-%%d %%H:%%M:%%S
```

## 防火墙

我都是把系统自带的防火墙工具关掉的，避免防火墙管理工具影响到 fail2ban 的正常运行，如果需要用到防火墙，直接使用 iptables 命令就行。

```bash
# for CentOS
systemctl disable --now firewalld

# for Ubuntu
systemctl disable --now ufw
```

然后删除兼容 firewalld 的配置

```bash
mv /etc/fail2ban/jail.d/00-firewalld.conf{,.bak}
```

## Ubuntu 的问题

建议不要用 Ubuntu，我用了就有些莫名其妙的问题，用 `fail2ban-regex` 检测都没有问题，能正常识别到日志，但是正常启动 fail2ban 就不能正常识别异常日志，换成 AlmaLinux (RedHat 系) 就没问题了