---
title: ssh不能登录常见问题调试
categories:
  - 基础运维
tags: [OpenSSH]
abbrlink: t9lver
date: 2024-01-29 11:08:51
cover: ""
updated: 2026-02-02 19:39:33
---

## 常见问题

### 权限问题

1. 家目录的权限对不对，检查下是不是 `0755` 或更小权限
2. authorized_keys 文件的权限, 一般为： `0644`
3. 客户端的 `id_rsa` 私钥文件的权限，需要设置成 `600` ，太开放会被拒绝连接。

### 密钥类型兼容问题

比如在 OpenSSH 8.8+ 版本中，出于安全考虑，默认禁用了基于 ssh-rsa（SHA-1 签名）的公钥算法。这会导致旧的 RSA 密钥在连接时出现 no mutual signature algorithm 或认证失败的问题。

比如高版本客户端连接低版本服务端可以修改客户端指定的算法 `~/.ssh/config`

```bash
Host * # 第一行说明对所有主机生效
  PubkeyAcceptedKeyTypes=+ssh-rsa # 第二行是将ssh-rsa加会允许使用的范围, 没配置会提示no mutual signature supported.表示找不到匹配的签名算法
  # HostKeyAlgorithms +ssh-rsa # 第三行是指定所有主机使用的都是ssh-rsa算法的key, 我个人测试可以不写,如果仍不生效可以打开测试
```

## 客户端调试

```bash
ssh -vvv xx@1.1.1.1
```

## 服务器调试

### 打开 ssh 日志

systemd 管理的服务，需要修改 `/usr/lib/systemd/system/sshd.service` ， 修改 `ExecStart` 加上参数 `-E /var/log/ssh/sshd.log`

如：

```bash
[Unit]
Description=OpenSSH server daemon
Documentation=man:sshd(8) man:sshd_config(5)
After=network.target sshd-keygen.service
Wants=sshd-keygen.service

[Service]
Type=notify
EnvironmentFile=/etc/sysconfig/sshd
ExecStart=/usr/sbin/sshd -D -E /var/log/sshd.log $OPTIONS
ExecReload=/bin/kill -HUP $MAINPID
KillMode=process
Restart=on-failure
RestartSec=42s

[Install]
WantedBy=multi-user.target
```

然后再查看 sshd 的日志：

```bash
Server listening on 0.0.0.0 port 22.
Server listening on :: port 22.
Authentication refused: bad ownership or modes for directory /home/dong
Authentication refused: bad ownership or modes for directory /home/dong
Connection closed by 172.31.11.13 port 63852 [preauth]
Postponed publickey for dong from 172.31.11.13 port 64045 ssh2 [preauth]
Accepted publickey for dong from 172.31.11.13 port 64045 ssh2: ED25519 SHA256:VMoyA5QG4N6OT5nBn0AEpkJphdRo3x56dGFafSc6VLI
Received disconnect from 172.31.11.13 port 64045:11: disconnected by user
Disconnected from 172.31.11.13 port 64045
Postponed publickey for dong from 172.31.11.13 port 64068 ssh2 [preauth]
Accepted publickey for dong from 172.31.11.13 port 64068 ssh2: ED25519 SHA256:VMoyA5QG4N6OT5nBn0AEpkJphdRo3x56dGFafSc6VLI
Received disconnect from 172.31.11.13 port 64068:11: disconnected by user
Disconnected from 172.31.11.13 port 64068
Accepted publickey for root from 10.200.4.188 port 40420 ssh2: RSA SHA256:pBG0YSd54tYi9PnI6jv7D36HJ+IVeHkJLO0bFQ4u97w
```

这里提示：`Authentication refused: bad ownership or modes for directory /home/dong` 就是因为权限问题被拒绝，需要修改此目录为 755 权限。
