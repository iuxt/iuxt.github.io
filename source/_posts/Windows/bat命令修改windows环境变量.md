---
title: bat命令修改windows环境变量
categories:
  - Windows
tags: [cmd, bat, Script, 脚本]
abbrlink: lqgfuqik
cover: 'https://s3.babudiu.com/iuxt/public/Windows-old.svg'
date: 2023-12-22 17:37:53
updated: 2026-02-21 22:22:14
---

在 bat 下修改环境变量有几种方式, 比如 `set` `setx` `vmic ENVIRONMENT`

## set

windows 的 set 和 bash 里面直接赋值类似, 只在当前脚本中生效, 比如

```bat
set a=b

echo %a%
b
```

## vmic

### wmic 常用命令

```bat
# 创建系统变量
wmic ENVIRONMENT create name="PPTV_HOME",username="<system>",VariableValue="%home%"

# 创建用户变量(替换一下计算机名和用户名)
wmic ENVIRONMENT create name="PPTV_HOME",username="计算机名\\用户名",VariableValue="%home%"

# 查看环境变量
wmic environment where "name='Path'" get UserName,VariableValue

# 删除环境变量
wmic ENVIRONMENT where "name='PPTV_HOME'" delete
```

### 举个例子

```bat
REM 设置一下需要添加环境变量的目录
SET DestFile="%USERPROFILE%\bin"

REM 增加bin环境变量
set path | findstr "%DestFile%" >nul && (
    echo 环境变量已存在
) || (
    echo 环境变量不存在
    wmic ENVIRONMENT where "name='Path' and username='%USERDOMAIN%\\%USERNAME%'" set VariableValue="%Path%;%DestFile%"
)
```

## 注册表方式

### 当前用户环境变量

```reg
Windows Registry Editor Version 5.00

[HKEY_CURRENT_USER\Environment]
"a"="b"
```

### 系统环境变量

```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Environment]
"c"="d"
```
