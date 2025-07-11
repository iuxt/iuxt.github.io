---
title: Windows 开机自启动配置位置
categories:
  - Windows
abbrlink: smvb2h
cover: 'https://s3.babudiu.com/iuxt/images/202411191004480.jpg'
date: 2024-11-13 10:32:40
tags:
---

## 注册表方式

#### 系统

```reg
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
```

#### 个人

```reg
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
```

#### 只运行一次

```reg
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce
```

> 新建字符串值 -- 数值名称任意,数值数据为要启动的程序路径,如 C:\Program Files (x86)\WinHotKey\WinHotKey.exe
> 或者命令行创建 `reg add "HKLM\Software\Microsoft\Windows\CurrentVersion\Run" /f /v "数值名称" /t REG_SZ /d "程序启动路径"`

## 文件方式

开机自启动也会显示在开始菜单的 startup 文件夹里。这里启动的话，是以用户身份启动，如果需要管理员权限的软件会弹窗。

#### 系统启动文件夹

```bat
C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup
```

#### 个人启动文件夹

```bat
C:\Users\你的Windows用户名\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
```

> 快速进入 startup 文件夹
> `win+r` 输入 `shell:startup`

## 服务方式

待完善

## 定时任务方式

定时任务方式启动有个好处，就是可以以管理员权限运行，不用用户授权，也就是不会 UAC 弹窗。按照如图配置即可。

![image.png|570](https://s3.babudiu.com/iuxt/images/202411191722190.png)
![image.png|586](https://s3.babudiu.com/iuxt/images/202411191723758.png)
![image.png](https://s3.babudiu.com/iuxt/images/202411191723472.png)

![image.png](https://s3.babudiu.com/iuxt/images/202411191724674.png)

![image.png](https://s3.babudiu.com/iuxt/images/202411191724869.png)
