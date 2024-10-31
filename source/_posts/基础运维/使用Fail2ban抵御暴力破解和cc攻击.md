---
title: 使用Fail2ban抵御暴力破解和cc攻击
categories:
  - 基础运维
tags:
  - fail2ban
  - cc攻击
  - iptables
abbrlink: c0880a78
cover: 'https://static.zahui.fan/public/fail2ban.png'
date: 2023-01-16 11:08:46
---

fail2ban 是一款防止暴力破解和 cc 攻击的开源工具，采用 Python 编写。

## 常用组件

| 工具            | 作用         |
| --------------- | ------------ |
| fail2ban-client | 客户端工具   |
| fail2ban-regex  | 验证正则匹配 |

```bash
# 查看启用的规则
fail2ban-client status

# 查看规则详情
fail2ban-client status sshd

# 重新加载配置
fail2ban-client reload

# 手动解禁IP
fail2ban-client set sshd unbanip 192.168.1.1
```

| 配置文件目录           | 作用                                      |
| ---------------------- | ----------------------------------------- |
| /etc/fail2ban/jail.d   | ban 的规则，如多少次触发，触发后封禁多久等 |
| /etc/fail2ban/filter.d | 过滤规则，匹配日志的正则配置              |

## 规则测试

创建配置文件 `/etc/fail2ban/jail.d/nginx-cc.conf`

```ini
[nginx-cc]
enabled = true
port = http,https
filter = nginx-cc
action = %(action_mwl)s
maxretry = 20
findtime = 10m
bantime = 2h
logpath = /var/log/nginx/access.log
```

| 配置 | 说明 | 备注 |
| ---- | :--- | ---- |
| enabled | 是否开启检测 |  |
| port | 检查的端口 | 多个端口 , 分隔 |
| ignoreip | 忽略 IP 地址（CIDR 格式）或机器名，以空格分隔。 |  |
| bantime | 主机被禁止时长，默认 600 秒。 | 高版本 Fail2ban 支持 s （秒）, m （分）和 d （天）作为时间单位，如 10m 和 1d |
| maxretry | 在 findtime 时间窗口中，允许主机认证失败次数。达到最大次数，主机将被禁止。 | 在 findtime 时间段内，发生 maxretry 次，就会触发封禁。 |
| findtime | 查找主机认证失败的时间间隔。 不意味着每隔 findtime 时间扫描一次日志。 | 高版本 Fail2ban 支持 s （秒）, m （分）和 d （天）作为时间单位，如 10m 和 1d |
| logpath | 扫描的日志文件 | fail2ban 按行扫描此文件，根据 filter 规则匹配失败的项目并统计 |
| action | 用什么方式来封禁, iptables 或 ufw 或 firewalld 等 |  |
| action = %(action_)s | 只封禁, 不发送邮件 |  |
| action = %(action_mw)s | 发邮件通知 |  |
| action = %(action_mwl)s | 发邮件通知并带上日志 |  |

创建配置文件 `/etc/fail2ban/filter.d/nginx-cc.conf`

```ini
[Definition]
failregex = <HOST> -.*- .*HTTP/1.* .* .*$
ignoreregex =
```

### fail2ban-regex 测试

```bash
# 正则规则检查
fail2ban-regex /var/log/nginx/access.log "<HOST> -.*- .*HTTP/1.* .* .*$"

# 根据配置文件检查
fail2ban-regex /var/log/nginx/access.log /etc/fail2ban/filter.d/nginx-cc.conf
```

## 常见问题

### ubuntu 启动报错

```bash
 ERROR   Failed during configuration: Have not found any log file for sshd jail
```

原因应该是 fail2ban 默认开启 ssh 监控，但是找不到 ssh 的日志。
网上搜索发现有人在 GitHub 上给出了解决方案。在 jail 设置里面加上以下内容即可顺利启动：

`vim /etc/fail2ban/jail.d/defaults-debian.conf` 在最上面加上:

```ini
[DEFAULT]
backend = systemd
```

或者安装 `rsyslog`

```bash
sudo apt install -y rsyslog
```

### SSH 错误密钥不封禁

fail2ban 安装完成后默认就会对 ssh 进行封禁（debian 系），配置文件见 `/etc/fail2ban/jail.d/defaults-debian.conf`, 默认对密码错误、密钥登陆的用户名错误都有封禁效果，但是用户名是正确的但是 key 错了是不封禁的， 可以通过修改 `/etc/fail2ban/jail.d/defaults-debian.conf`

```ini
[sshd]
mode   = aggressive
enabled = true
```

配置 `mode   = aggressive` 可解决此问题

