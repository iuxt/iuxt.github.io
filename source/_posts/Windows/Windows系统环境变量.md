---
title: Windows系统环境变量
abbrlink: 7468bc35
cover: 'https://s3.babudiu.com/iuxt/public/Windows.svg'
categories:
  - Windows
tags: [Windows]
date: 2021-05-22 10:49:40
updated: 2026-02-21 22:17:50
---

> 环境变量简单来说就是一个键值对，比较常见的是 `path` 环境变量，定义的是全局程序存放的位置

Windows 查看环境变量 使用 `echo %date%`

## 用户环境变量

注册表位置：`HKEY_CURRENT_USER\Environment` 用户环境变量只对当前用户起作用

## 系统环境变量

注册表位置：`HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Control\Session Manager\Environment`

### 常用系统自带变量

| 变量                      | 类似格式                                 |
| ------------------------- | ---------------------------------------- |
| %COMMONPROGRAMFILES%      | C:\Program Files\Common Files            |
| %COMMONPROGRAMFILES(x86)% | C:\Program Files (x86)\Common Files      |
| %PROGRAMFILES%            | C:\Program Files                         |
| %PROGRAMFILES(X86)%       | C:\Program Files (x86)                   |
| %COMSPEC%                 | C:\Windows\System32\cmd.exe              |
| %HOMEDRIVE%               | C:                                       |
| %HOMEPATH%                | C:\Users\iuxt                            |
| %SYSTEMROOT%              | C:\Windows                               |
| %WINDIR%                  | C:\Windows                               |
| %TMP%                     | C:\Users\iuxt\AppData\Local\Temp         |
| %TEMP%                    | C:\Users\iuxt\AppData\Local\Temp         |
| %CD%                      | 当前目录                                 |
| %DATE%                    | 当前日期                                 |
| %TIME%                    | 时间                                     |
| %APPDATA%                 | C:\Users\iuxt\AppData\Roaming            |
| %LOCALAPPDATA%            | C:\Users\iuxt\AppData\Local              |
| %SYSTEMDRIVE%             | C:                                       |
| %USERNAME%                | iuxt                                     |
| %USERPROFILE%             | C:\Users\iuxt                            |
| %ONEDRIVE%                | C:\Users\iuxt\OneDrive                   |
| %ERRORLEVEL%              | 上一个命令的错误码， 类似于 linux 里面的 $? |
| %PROGRAMDATA%             | C:\ProgramData                           |
| %PUBLIC%                  | C:\Users\Public                          |
| %COMPUTERNAME%            | 计算机名                                 |
| %RANDOM%                  | 随机数（0-32767）                        |

## 修改环境变量

### PowerShell

永久生效（写入注册表，User 级别，不需要管理员权限。Machine 级别的需要管理员权限）

```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Users\xxx\bin", "User")

[Environment]::SetEnvironmentVariable("KUBECONFIG", "C:\Users\xxx\kubeconfig\prod1-kubeconfig.txt", "User")
[Environment]::SetEnvironmentVariable("KUBECONFIG", "C:\Users\xxx\kubeconfig\prod2-kubeconfig.txt", "User")
[Environment]::SetEnvironmentVariable("KUBECONFIG", "C:\Users\xxx\kubeconfig\staging-kubeconfig.txt", "User")

```

关闭命令行窗口，重新打开即可生效。

在当前控制台生效：

```powershell
$env:KUBECONFIG = "C:\Users\xxx\kubeconfig\prod1-kubeconfig.txt"

```
