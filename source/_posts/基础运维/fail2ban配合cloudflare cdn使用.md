---
title: fail2ban配合cloudflare cdn使用
categories:
  - 基础运维
tags:
  - cdn
  - fail2ban
  - cc攻击
  - 反向代理
abbrlink: lrt00szc
cover: 'https://s3.babudiu.com/iuxt/public/Cloudflare.svg'
date: 2024-01-25 17:15:25
---

Cloudflare 是一家全球最著名的 CDN 加速服务商，提供了免费和付费的网站加速和保护服务。即使是免费版，也提供了比较全面和强大的功能，非常不错。

通过使用 Cloudflare CDN 服务提供的全球节点，一方面可以提高网站响应速度和性能，节省源站资源；另一方面也可以保护站点抵御攻击，保证网站长期稳定在线。

fail2ban 是一个开源工具, 它通过分析日志, 将不满足要求的访问 (比如 cc 攻击、对网站进行扫描等) 的 ip 获取到, 通过自带防火墙 (iptables 等) 进行封禁.

问题一: 如何让 fail2ban 获取真实 IP

想要通过 fail2ban 来封禁 ip, 那么先要获取到用户 (或黑客) 的 ip, 如果不进行处理, 那么大概率你获取到的是 cloudflare 请求你用的 ip, 封禁这个 ip 是没有意义的...

我的服务架构是 cloudflare --> nginx --> 后端服务

在 nginx 上面配置

```conf
server {
  ...

  # 这里设置一下Real_IP变量, 用于存储真实IP
  set $Real_IP $http_x_forwarded_for;


  # 设置代理 Header
  proxy_set_header X-Real-IP $Real_IP;

  location / {
    proxy_pass http://xxx;
  }
}

```

后端也要配置打印在日志里的 ip 字段为 `X-Real-IP`, 如果读取的是 Nginx 日志, 那配置一下 Nginx 的日志格式即可.

问题 2: 封禁了用户 ip, 但是请求是通过 cloudflare 请求过来的, 封禁没有效果

可以使用 jail 配置

```ini
[vaultwarden]
enabled = true
filter = vaultwarden
logpath = /home/ubuntu/quickstart/vaultwarden/vaultwarden_data/vaultwarden.log
maxretry = 5
bantime = 1d
findtime = 1h
action = cloudflare
         iptables-allports[chain="DOCKER-USER"]
```

修改 cloudflare 的 action 配置

/etc/fail2ban/action.d/cloudflare.conf

```bash
cftoken  =  cloudflare全局key
cfuser   =  你的邮箱
```

后续封禁是在 cloudflare 上封禁的, 可以在控制台查看到

![image.png](https://s3.babudiu.com/iuxt/images/202401251813392.png)
