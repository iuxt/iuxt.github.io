---
title: Windows 开机自启动配置位置
categories:
  - Windows
tags: 
abbrlink: smvb2h
date: 2024-11-13 10:32:40
cover: https://static.zahui.fan/public/Windows.svg
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

开机自启动也会显示在开始菜单的 startup 文件夹里。

#### 系统启动文件夹

```reg
C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup
```

#### 个人启动文件夹

```reg
C:\Users\你的Windows用户名\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
```

> 快速进入 startup 文件夹
> win+r 输入 shell:startup

## 服务方式

待完善

## 定时任务方式

待完善