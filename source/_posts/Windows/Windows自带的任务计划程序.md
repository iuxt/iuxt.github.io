---
title: Windows自带的任务计划程序
categories:
  - Windows
tags:
  - Crontab
abbrlink: tatbjn
date: 2021-02-21 22:14:10
cover: ""
updated: 2021-02-21 22:14:25
---

```bat
schtasks /Delete /tn "MyScript" /f


schtasks /create /tn "MyScript" /tr "C:\Users\iuxt\Desktop\test\test.bat" /sc minute /mo 1 /ru "%USERNAME%" /rp "password" /rl HIGHEST /f

```

```bat
schtasks /create /tn "MyScript" /tr "C:\software\cron\start.bat" /sc minute /mo 1 /rl HIGHEST /f
```

一般情况下，这样配置即可
![image.png|334](https://s3.babudiu.com/iuxt/2025/12/f11fd354ef89483ad613ee323eceebc1.png)
![image.png|494](https://s3.babudiu.com/iuxt/2025/12/24ad5022bd3261d6e4785c839bc0d858.png)

![image.png|494](https://s3.babudiu.com/iuxt/2025/12/eb6e8f58ed29137c37e5c7c6f227fa6a.png)
![image.png|468](https://s3.babudiu.com/iuxt/2025/12/4001a16aa7a9e507be9b7d5303627fd9.png)

start.bat 脚本内容：

```bat
# 进入脚本所在目录
cd /d "%~dp0"

# 执行命令，并将stdout和stderr都输出到文件里。
python test.py >> log.txt 2>&1
```
