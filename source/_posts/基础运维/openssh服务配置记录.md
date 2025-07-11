---
title: openssh配置记录
categories:
  - 基础运维
tags:
  - OpenSSH
  - 配置记录
abbrlink: 658a72d5
cover: 'https://s3.babudiu.com/iuxt/images/202411221801168.png'
date: 2023-06-13 10:43:40
---

## 优化登录速度

关闭 UseDNS 和 GSSAPIAuthentication 可以加速 SSH 登录, UseDNS 和 GSSAPIAuthentication 是什么？

每次登录 SSH 时总是要停顿等待一下才能连接上，,这是因为 OpenSSH 服务器有一个 DNS 查找选项 UseDNS 默认情况下是打开的。

> UseDNS 选项打开状态下，当客户端试图登录 SSH 服务器时，服务器端先根据客户端的 IP 地址进行 DNS，PTR 反向查询出客户端的主机名，然后根据查询出的客户端主机名进行 DNS 正向 A 记录查询，验证与其原始 IP 地址是否一致，这是防止客户端欺骗的一种措施，但一般我们的是动态 IP 不会有 PTR 记录，打开这个选项不过是在白白浪费时间而已，不如将其关闭。
>
> GSSAPI ( Generic Security Services Application Programming Interface) 是一套类似 Kerberos 5 的通用网络安全系统接口。该接口是对各种不同的客户端服务器安全机制的封装，以消除安全接口的不同，降低编程难度。但该接口在目标机器无域名解析时会有问题

编辑配置文件 `vim /etc/ssh/sshd_config`

找到 UseDNS 选项，去掉注释 `#UseDNS yes` 改为 `UseDNS no`
找到 GSSAPIAuthentication 选项，去掉注释 `#GSSAPIAuthentication yes` 改为 `GSSAPIAuthentication no`
保存配置文件

重启 OpenSSH 服务器

```bash
systemctl restart sshd
```
