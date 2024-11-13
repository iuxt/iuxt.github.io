---
title: Windows常见注册表位置
categories:
  - Windows
tags: 
abbrlink: smvadg
date: 2024-11-13 10:17:40
cover: ""
---

## oem 信息

### 添加 oem 信息

```bat
@echo off
%1 mshta vbscript:CreateObject("Shell.Application").ShellExecute("cmd.exe","/c %~s0 ::","","runas",1)(window.close)&&exit
cd /d "%~dp0"

copy logo.bmp %windir%\media\logo.bmp

reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\OEMInformation" /f /v "SupportURL" /t REG_SZ /d "http://blog.sina.com.cn/iuxt"
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\OEMInformation" /f /v "Model" /t REG_SZ /d "iuxt"
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\OEMInformation" /f /v "SupportHours" /t REG_SZ /d "8:00-22:00"
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\OEMInformation" /f /v "SupportPhone" /t REG_SZ /d "17621268822"
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\OEMInformation" /f /v "Logo" /t REG_SZ /d "C:\Windows\Media\logo.bmp"
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\OEMInformation" /f /v "Manufacturer" /t REG_SZ /d "张理坤"
```

### 删除 OEM 信息

```bat
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\OEMInformation" /f
```

## 侧边栏的网盘链接（OneDrive 等）

```reg
HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Desktop\NameSpace
```

## 开机自启动注册表配置

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

## 登录界面不显示用户

```reg
[HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon\SpecialAccounts\UserList]
"administrator"=dword:00000000
```

## IE 主页

### 个人主页

```bat
reg add "HKEY_CURRENT_USER\Software\Microsoft\Internet Explorer\Main" /v "Start Page" /t reg_sz /d http://www.2345.com/?k393991732 /f
```

### 系统主页

```bat
reg add "HKU\.DEFAULT\Software\Microsoft\Internet Explorer\Main" /f /v "Start Page" /t REG_SZ /d "http://www.2345.com/?k393991732"
```

### 默认主页

```bat
reg add "HKEY_CURRENT_USER\Software\Microsoft\Internet Explorer\Main" /v "Default_Page_URL" /t reg_sz /d http://www.2345.com/?k393991732 /f
```

## Windows Defender

关闭 Windows Defender

```bat
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Windows Defender" /v "DisableAntiSpyware" /d 1 /t REG_DWORD /f
```

> 这种方法和直接修改组策略是一样的，家庭版不支持组策略可以使用这种方式
