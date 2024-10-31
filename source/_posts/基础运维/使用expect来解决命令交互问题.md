---
title: 使用expect来解决命令交互问题
abbrlink: 751c3cf9
cover: 'https://static.zahui.fan/public/bash.svg'
categories:
  - 基础运维
tags:
  - Script
  - Bash
date: 2021-11-16 18:18:50
---

linux 里面很多命令都是需要人为交互的，对于做成脚本来说，有点不合适了，比如通过密码连接 SSH 必须要在控制台输入密码（安全起见还是用 rsa key），`expect` 是预期的意思，它可以实现我们预期的结果。

## 安装

```bash
# ubuntu/debian
sudo apt install -y expect
  
# centos/rhel
sudo yum install -y ecpect
```

## 解释器使用 expect

```bash
#!/usr/bin/expect

set IP     [lindex $argv 0] # 读取第1个参数设置为 IP 变量
set PASSWD [lindex $argv 1] # 读取第2个参数设置为 PASSWD 变量
set CMD    [lindex $argv 2] # 读取第3个参数设置为 CMD 变量

spawn ssh $IP $CMD # spawn 来给命令加壳，以便于断言输出
expect { # expect 是断言命令
  # 如果读取到屏幕上输出 (yes/no) 信息，则输入 "yes" 并按下回车键
  # exp_continue 是继续等待花括号内的断言, 如果不加这一句会直接跳出 expect
  "(yes/no)?" { send "yes\r"; exp_continue }

  "password:" { send "$PASSWD\r" } # 如果读取到屏幕上输出 password 信息，则输入 PASSWD 变量中的内容
  "*host " { exit 1 } # 如果读取到 "No route to host" 等内容， 就以非0状态退出
}
expect eof # 等待命令执行结束
```

这种方式由于解释器使用了 expect，所以只能使用有限的命令，不是很推荐

### 执行结果赋予变量

```bash
#!/usr/bin/expect

set result [exec hostname -I]
puts "本机IP地址是: $result"
```

## 解释器使用 bash

> 假设 certbot 不支持非交互使用

```bash
#!/bin/bash
export LC_CTYPE="en_US.UTF-8"
expect -c '
set timeout 3
spawn ssh user@<host> -p 60022
expect "password"
send "password\r"
interact
'
```

## 直接使用 expect 命令

> 这种和切换解释器类似， 类比于 `./test.sh` 和 `bash test.sh` 的关系。

vim test.sh

```bash
spawn ldapadd -x -D cn=Manager,dc=i,dc=com -W -f /vagrant/basedomain.ldif
expect {
"Enter LDAP Password:" {send "123456\n";exp_continue}
eof
}
```

```bash
expect test.sh
```

## 一些例子🌰

### 自动登录带两步验证码的跳板机

手动登录的方式：

![yuanshi.gif](https://static.zahui.fan/images/202408131814901.gif)

使用脚本自动登录，效果如下图：

脚本做了：
1. 自动输入密码
2. 自动输入两步验证码（谷歌验证器 6 位数字动态密码）

![test.gif](https://static.zahui.fan/images/202408131815193.gif)

totp.py 获取验证码的脚本

> 这个脚本需要接收一个参数，参数为 TOTP Seed，也就是二维码解析出来的内容。

```python
import pyotp
import sys

totp = pyotp.TOTP(sys.argv[1])
totp_password = totp.now()
print(totp_password, end='')
```

登录脚本：

```bash
#!/usr/bin/expect -f
# 捕获窗口大小变化的信号，并调整spawn进程的终端大小
trap {
  # 获取当前终端的行数和列数
  set rows [stty rows]
  set cols [stty columns]
  
  # 调整spawn进程的终端行数和列数
  stty rows $rows columns $cols < $spawn_out(slave,name)
} WINCH

set user root
set host 10.0.0.10
set password 123456
set timeout 30

spawn ssh $user@$host -p 60022

# 自动输入密码
expect {
    "yes/no" {send "yes\r"}
    "*assword:*" {send "$password\r"}
    # TOTP两步验证码，通过调用Python脚本获取到。
    "*OTP verification code*" {
        # expect_user -re "(.*)\n"
        # set veri_code $expect_out(1,string)
        # 上面那两行是手动输入，下面这个则是依靠自动计算
        set veri_code [ exec sh -c {python3 totp.py <totp_seed>} ]
        send "${veri_code}\r"
    }
}

# 进入交互模式，保持会话打开
interact
```