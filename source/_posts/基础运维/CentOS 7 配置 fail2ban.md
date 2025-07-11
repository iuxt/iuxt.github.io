---
title: CentOS 7 配置 fail2ban
categories:
  - 基础运维
tags:
  - 自动化
  - 安全
abbrlink: shxj0z
cover: 'https://s3.babudiu.com/iuxt/public/fail2ban.png'
date: 2020-08-09 10:31:46
---

## 基本配置

```bash
systemctl disable --now firewalld
sed -i 's#SELINUX=enforcing#SELINUX=disabled#g' /etc/sysconfig/selinux && setenforce 0

yum install fail2ban -y

rm -f /etc/fail2ban/jail.d/00-firewalld.conf
```

## 开启 ssh 封禁规则

vim /etc/fail2ban/jail.d/ssh.conf

```ini
[DEFAULT]
# 封禁时间多久，单位是秒，也可以写 10m 表示 10 分钟。1h 表示 1 小时
bantime = 3600

# Override /etc/fail2ban/jail.d/00-firewalld.conf:
banaction = iptables-multiport

# 统计周期时间，默认单位是秒
findtime  = 10m

# 在一个周期内允许失败几次
maxretry = 5

[sshd]
enabled = true
mode = aggressive
```

`mode = aggressive` 配置是 为了将那些 使用错误 key 登录失败的一起禁用了。
