---
title: 使用PowerShell操作Windows Defender
categories:
  - Windows
tags: [Windows, PowerShell, Command]
abbrlink: lqkgw2cy
date: 2022-12-25 13:18:00
updated: 2025-01-08 18:32:15
---

首先需要使用到管理员权限运行 PowerShell

## 查看排除列表

```powershell
$WDAVprefs = Get-MpPreference
$WDAVprefs.ExclusionPath
```

## 排除指定文件夹

```powershell
# 两种写法，Set-MpPreference 是直接修改，会覆盖之前的规则
powershell.exe -Command 'Set-MpPreference -ExclusionPath "C:\xxx", "D:\yyy"'

# Add-MpPreference 是追加配置。
Add-MpPreference -ExclusionPath "C:\Program Files (x86)\WinAgent\*"
```
