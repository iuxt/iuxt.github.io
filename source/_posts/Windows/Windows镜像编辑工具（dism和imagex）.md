---
title: Windows镜像编辑工具（dism和imagex）
abbrlink: a3a12a0e
categories:
  - Windows
tags: [Windows]
cover: 'https://s3.babudiu.com/iuxt/public/Windows-old.svg'
date: 2021-03-10 17:01:05
updated: 2025-09-07 21:25:07
---

> imagex 和 dism 都是 windows 官方处理 windows 安装镜像 wim 文件的工具，其中 dism 是自带的，imagex 是单文件，依赖简单

## imagex

> 以下以将 windows32 位安装镜像和 64 位安装镜像整合为例

### 镜像导出合并

> 将 64 位镜像导出写入到 32 位镜像里

```bat
imagex /export install64.wim 1 install32.wim "Win7 homebasic x64"
imagex /export install64.wim 2 install32.wim "win7 homepremium x64"
imagex /export install64.wim 3 install32.wim "win7 professional x64"
imagex /export install64.wim 4 install32.wim "win7 ultimate x64"
```

### 修改镜像描述信息

> 修改前可以使用 `imagex /info C:\xxxxx.wim` 查看镜像信息

```bat
imagex /info install32.wim 1 "Windows 7 STARTER X86" "Windows 7 简易版"
imagex /info install32.wim 2 "Windows 7 HOMEBASIC X86" "Windows 7 家庭普通版 32位"
imagex /info install32.wim 3 "Windows 7 HOMEPREMIUM X86" "Windows 7 家庭高级版 32位"
imagex /info install32.wim 4 "Windows 7 PROFESSIONAL X86" "Windows 7 专业版 32位"
imagex /info install32.wim 5 "Windows 7 ULTIMATE X86" "Windows 7 旗舰版 32位"
imagex /info install32.wim 6 "Windows 7 HOMEBASIC X64" "Windows 7 家庭普通版 64位"
imagex /info install32.wim 7 "Windows 7 HOMEPREMIUM X64" "Windows 7 家庭高级版 64位"
imagex /info install32.wim 8 "Windows 7 PROFESSIONAL X64" "Windows 7 专业版 64位"
imagex /info install32.wim 9 "Windows 7 ULTIMATE X64" "Windows 7 旗舰版 64位"
```

## dism

### 按大小拆分 wim 镜像

```powershell
dism /Split-Image /ImageFile:F:\sources\install.wim /SWMFile:D:\install.swm /FileSize:4096
```

### 镜像挂载卸载

```powershell
# 查看分卷信息
DISM /Get-WimInfo /WimFile:"C:\path\to\install.wim"

# 挂载镜像
DISM /Mount-Image /ImageFile:"C:\install.wim" /Index:1 /MountDir:"C:\Mount"

# 卸载镜像，并保存更改
DISM /Unmount-Image /MountDir:"C:\Mount" /Commit

# 卸载镜像，不保存更改
DISM /Unmount-Image /MountDir:"C:\Mount" /discard
```

### 检查 windows 健康度

For a quick check of an online image, you may be able to use the command: to scan and repair files. `sfc /scannow`
For a more extensive check that can repair issues with the store, use `DISM /Cleanup-Image`

Dism 操作如下:

```powershell
# 检查镜像是否可被修复
Dism /Online /Cleanup-Image /ScanHealth
Dism /Online /Cleanup-Image /CheckHealth

# 在线修复
DISM /Online /Cleanup-Image /RestoreHealth

# 离线修复, 需要指定安装源
Dism /Image:C:\offline /Cleanup-Image /RestoreHealth /Source:c:\test\mount\windows

# 在线修复挂载的其他系统(被挂载到本机硬盘, 比如是wim挂载的)
Dism /Online /Cleanup-Image /RestoreHealth /Source:c:\test\mount\windows /LimitAccess
```

### 导入导出驱动

```powershell
# 导出当前系统驱动
dism /online /export-driver /destination:D:\MyDrivers

# 导入驱动到当前系统
dism /online /add-driver /driver:D:\MyDrivers /recurse
```
