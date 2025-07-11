---
title: macOS终端工具iTerm2配置lrzsz上传下载
categories:
  - 工具
tags:
  - lrzsz
  - OpenSSH
abbrlink: sgpjuj
cover: 'https://s3.babudiu.com/iuxt/images/202411221801168.png'
date: 2020-07-16 16:35:07
---

lrzsz 是个很古老的软件了， 上次更新是 1998 年， 距今已经 20 多年历史了，那为啥还要用这么古老的软件呢，lrzsz 利用终端来传输文件，相比于 scp、sftp 等来说方便倒是其次，想象一下 `我的电脑 --> 跳板机A --> 跳板机B --> 目标机器` 并且很多跳板机都有各种限制，不一定支持上传文件，这个时候通过终端来传文件就是唯一的选择了。

官方介绍：https://www.ohse.de/uwe/software/lrzsz.html

类似与 lrzsz 还有个软件叫 trzsz， 相比 lrzsz 更快，更方便。

## lrzsz 原理

- 下载文件
    在服务器上执行 sz（Send by ZMODEM），先在终端上输出 **B00000000000000，然后客户端在终端发送指令，表示拒绝，还是接收（接收的话，就在客户端运行 rz 指令与服务端交互）

- 上传文件
    在服务器上执行 rz（Receive by ZMODEM），先在终端上输出 rz waiting to receive.**B0100000023be50，然后客户端发送指令，表示取消，还是上传（上传的话，在客户端运行 sz 命令与服务端交互）。

可以看到在上述流程中，对 Terminal 的要求就是，遇到特殊指令，触发对应的操作（执行本地命令）

由于 macOS 自带的 Terminal.app 不支持这个，所以网上大部分教程都是使用 iTerm2

参考链接：<https://www.jianshu.com/p/d5bbb6009b05>

## 安装 lrzsz

要使用 lrzsz，自己的电脑和服务器上都需要安装 lrzsz 包，在 macOS 上可以使用 brew 来安装

```bash
brew install lrzsz
```

## 创建脚本

```bash
cat > iterm2-recv-zmodem.sh <<'EOF'
#!/bin/bash
# Author: Matt Mastracci (matthew@mastracci.com)
# AppleScript from http://stackoverflow.com/questions/4309087/cancel-button-on-osascript-in-a-bash-script
# licensed under cc-wiki with attribution required
# Remainder of script public domain

osascript -e 'tell application "iTerm2" to version' > /dev/null 2>&1 && NAME=iTerm2 || NAME=iTerm
if [[ $NAME = "iTerm" ]]; then
	FILE=$(osascript -e 'tell application "iTerm" to activate' -e 'tell application "iTerm" to set thefile to choose folder with prompt "Choose a folder to place received files in"' -e "do shell script (\"echo \"&(quoted form of POSIX path of thefile as Unicode text)&\"\")")
else
	FILE=$(osascript -e 'tell application "iTerm2" to activate' -e 'tell application "iTerm2" to set thefile to choose folder with prompt "Choose a folder to place received files in"' -e "do shell script (\"echo \"&(quoted form of POSIX path of thefile as Unicode text)&\"\")")
fi

if [[ $FILE = "" ]]; then
	echo Cancelled.
	# Send ZModem cancel
	echo -e \\x18\\x18\\x18\\x18\\x18
	sleep 1
	echo
	echo \# Cancelled transfer
else
	cd "$FILE"
	/usr/local/bin/rz --rename --escape --binary --bufsize 4096
	sleep 1
	echo
	echo
	echo \# Sent \-\> $FILE
fi
EOF

cat > iterm2-send-zmodem.sh <<'EOF'
#!/bin/bash
# Author: Matt Mastracci (matthew@mastracci.com)
# AppleScript from http://stackoverflow.com/questions/4309087/cancel-button-on-osascript-in-a-bash-script
# licensed under cc-wiki with attribution required
# Remainder of script public domain

osascript -e 'tell application "iTerm2" to version' > /dev/null 2>&1 && NAME=iTerm2 || NAME=iTerm
if [[ $NAME = "iTerm" ]]; then
	FILE=$(osascript -e 'tell application "iTerm" to activate' -e 'tell application "iTerm" to set thefile to choose file with prompt "Choose a file to send"' -e "do shell script (\"echo \"&(quoted form of POSIX path of thefile as Unicode text)&\"\")")
else
	FILE=$(osascript -e 'tell application "iTerm2" to activate' -e 'tell application "iTerm2" to set thefile to choose file with prompt "Choose a file to send"' -e "do shell script (\"echo \"&(quoted form of POSIX path of thefile as Unicode text)&\"\")")
fi
if [[ $FILE = "" ]]; then
	echo Cancelled.
	# Send ZModem cancel
	echo -e \\x18\\x18\\x18\\x18\\x18
	sleep 1
	echo
	echo \# Cancelled transfer
else
	/usr/local/bin/sz "$FILE" --escape --binary --bufsize 4096
	sleep 1
	echo
	echo \# Received "$FILE"
fi
EOF

```

## 配置 iTerm2

`Profiles` --> `Advanced` --> `Triggers` --> `Edit`

```bash
1.第一条
        Regular expression: rz waiting to receive.\*\*B0100
        Action: Run Silent Coprocess
        Parameters: /Users/iuxt/icloud/macOS/iterm2/iterm2-send-zmodem.sh
        Instant: checked

2.第二条
        Regular expression: \*\*B00000000000000
        Action: Run Silent Coprocess
        Parameters: /Users/iuxt/icloud/macOS/iterm2/iterm2-recv-zmodem.sh
        Instant: checked
```

## 另一种方式，使用 tssh

tssh 新版支持了 lrzsz 了，可以用 tssh 来替代 ssh， 可以同时支持 lrzsz 和 trzsz。配合 iTerm2 也不错。

```bash
brew install trzsz-ssh
```

然后用 `tssh --zmodem` 来替代 `ssh` ，比如配置 alias

使用 tssh 就不用配置 iTerm2 的 Triggers 了，并且上传下载的时候可以显示速度和传输的大小。

![image.png](https://s3.babudiu.com/iuxt/images/202407261625730.png)

