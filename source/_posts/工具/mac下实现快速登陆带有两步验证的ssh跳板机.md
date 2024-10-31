---
title: mac下实现快速登陆带有两步验证的ssh跳板机
categories:
  - 工具
tags:
  - mac
  - python
  - pyotp
  - 效率工具
abbrlink: ee380870
cover: 'https://static.zahui.fan/images/202308242224563.png'
date: 2023-08-24 18:19:01
---

我们有个堡垒机当前的登陆流程是： ssh username@ip -p port --> 输入密码 --> 打开手机 --> 查看两部验证码 --> 输入 --> 连接成功

## 解决输入密码的问题

mac 因为安全问题使用 brew 已经无法安装 sshpass 这个包了， 我们可以使用 ssh key 来进行免密登陆并提高安全性。不同的跳板机平台设置方式不太一样，一般都是在个人信息设置里面增加 ssh 公钥。

输入密码还可以用一个叫 tssh 的开源工具来实现（兼容 openssh 且支持 lrzsz）

## 解决输入两步验证码的问题

两步验证码就是 TOTP，基于生成的 6 位数字， 30s 更换一次， 我们需要先拿到 TOTP 的 seed， 一般都会给一个二维码，用二维码解析工具解析， 解析出来的内容大致类似于：

```vim
otpauth://totp/Microsoft:iuxt@outlook.com?secret=XUHHW5TKKTYGMJYM&issuer=Microsoft
```

secret= 后面的内容就是 TOTP 的 seed

### 使用脚本来生成两步验证码

可以使用 python 的 pyotp 包

```python
import pyotp
import sys
totp = pyotp.TOTP(sys.argv[1])
totp_password = totp.now()
print(totp_password)
```

### 写入剪切板

```bash
python3 ~/code/tools/totp.py XUHHW5TKKTYGMJYM | pbcopy
```

然后登陆的时候直接粘贴就可以了。

## 最终效果

~/.zshrc 里面的内容：

```bash
alias test='python3 ~/code/tools/totp.py XUHHW5TKKTYGMJYM | pbcopy && ssh xxx@x.x.x.x -p 60022'
```

需要连接跳板机的时候， 直接执行 test， 然后粘贴即可。 虽然没有完全自动化， 但是也不用低头打开手机查看验证码了。

iterm2 带有 action， 可以根据屏幕显示来执行命令， 理论上可以自动填充 TOTP，暂时没有时间测试。