---
title: Windows常用命令记录
abbrlink: 801c62c9
cover: 'https://static.zahui.fan/public/Windows-old.svg'
categories:
  - Windows
tags:
  - Windows
  - 配置记录
date: 2021-03-10 19:04:51
---

## smb 操作

### 挂载 smb

```bat
net use z: \\192.168.10.163\share /user:"<计算机名\用户名>" "<密码>"
```

### 卸载 smb

```bat
net use z: /del /y
```

## 写入剪切板

从文件写入

```bat
clip < C:\Users\iuxt\.ssh\id_rsa.pub
```

直接写入

```bat
echo 222 | clip
```

## 用户操作

### 启用 Administrator

```bat
net user administrator Office@2015 /active:yes
```

### 新建用户

新建用户 IT,密码为 123456,密码 * 为手动输入,不能改密码,密码永不过期

```bat
net user IT 123456 /add /passwordchg:no /expires:never
```

### 将用户加入组

```bat
net localgroup Administrators IT /add
```

### 新建用户组

```bat
net localgroup 组名 /add
```

### 其他命令

| 参数              | 说明      |
| --------------- | ------- |
| /active:no      | 启用或禁用用户 |
| /comment:"Text" | 用户描述    |

## 内置用户

### system 用户

服务默认的执行用户，如果一个程序在 windows 上直接运行和通过服务来运行效果不一样，可以考虑下服务执行的用户是不是当前用户，比如我用 syncthing ，直接运行配置好了一会，使用 always up 来运行配置丢失了，原因是配置文件被写入当前用户，而用 always up 默认使用的是 system 用户，其中 system 用户的用户文件夹在：

```bat
C:\Windows\System32\config\systemprofile\
```

# win + R 速查

| 命令                                | 说明          |
| --------------------------------- | ----------- |
| certmgr.msc                       | 证书管理        |
| compmgmt.msc                      | 计算机管理       |
| control                           | 控制面板        |
| control userpasswords             | 用户账户        |
| devmgmt.msc                       | 设备管理器       |
| diskmgmt.msc                      | 磁盘管理        |
| eventvwr                          | 事件查看器       |
| explorer                          | 资源管理器       |
| gpedit.msc                        | 组策略编辑器      |
| fsmgmt.msc                        | 共享文件夹       |
| iexplore                          | IE 浏览器       |
| lusrmgr.msc                       | 本地用户和组      |
| msconfig                          | 系统配置        |
| mspaint                           | 画图          |
| mstsc                             | 远程桌面连接      |
| osk                               | 屏幕键盘        |
| perfmon.msc                       | 性能监视器       |
| netplwiz                          | 打开账户管理窗口 2   |
| control userpasswords2            | 打开账户管理窗口 2   |
| rundll32 netplwiz.dll,UsersRunDll | 打开账户管理窗口 2   |
| gpmc.msc                          | 域控组策略       |
| taskschd.msc                      | 任务计划程序      |
| ncpa.cpl                          | 控制面板 - 网络管理 |
| systempropertiesprotection        | 系统保护设置页面    |
| sysdm.cpl                         | 系统属性页面      |
