---
title: Windows家庭版打开Hyper V虚拟机
abbrlink: b428e1a3
categories:
  - Windows
tags:
  - Hyper-V
  - 虚拟化
  - VirtualMachine
cover: 'https://static.zahui.fan/public/Windows.svg'
date: 2022-10-10 21:35:54
---

家庭版系统不可以在系统程序和功能里面添加 Hyper-V 功能的， 不过微软并没有禁止通过 dism 增加包的方式添加 Hyper-V 功能，所以可以使用这种方式来使用 Hyper-V

操作需要使用管理员权限来执行

## 打开 Hyper-V

```bat
pushd "%~dp0"
dir /b %SystemRoot%\servicing\Packages\*Hyper-V*.mum >hyper-v.txt

for /f %%i in ('findstr /i . hyper-v.txt 2^>nul') do dism /online /norestart /add-Package:"%SystemRoot%\servicing\Packages\%%i"

del hyper-v.txt

Dism /online /enable-feature /featurename:Microsoft-Hyper-V-All /LimitAccess /ALL

```

## 关闭 Hyper-V

### 删除 Hyper-V 组件

```bat
pushd "%~dp0"
dir /b %SystemRoot%\servicing\Packages\*Hyper-V*.mum >hyper-v.txt

for /f %%i in ('findstr /i . hyper-v.txt 2^>nul') do dism /online /norestart /Remove-Package:"%SystemRoot%\servicing\Packages\%%i"

del hyper-v.txt

Dism /online /disable-feature /featurename:Microsoft-Hyper-V-All /LimitAccess /ALL
```

### 关闭需要修改启动配置

```bat
bcdedit /set hypervisorlaunchtype off

# 恢复配置
# bcdedit /set hypervisorlaunchtype auto
```