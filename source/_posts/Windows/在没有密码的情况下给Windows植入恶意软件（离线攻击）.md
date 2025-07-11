---
title: 在没有密码的情况下给Windows植入恶意软件（离线攻击）
categories:
  - Windows
abbrlink: shtwtk
cover: ''
date: 2021-08-07 11:39:20
tags:
---

什么是离线攻击，通俗点说就是电脑主人离开了电脑，黑客跑到电脑面前进行破解的方法🤣。这种破解方式主要是通过修改 Windows 的 SAM 文件来达到获取权限的目的。

## Windows 的 SAM 文件

Windows 的 SAM 文件（Security Accounts Manager）是一个用于存储本地用户账户和密码散列值的数据库文件。它在 Windows 操作系统中扮演着至关重要的角色，用于管理本地安全和账户信息。SAM 文件通常位于 C:\Windows\System32\config 目录中。

SAM 文件的原理

- 账户信息存储：SAM 文件包含了本地用户账户的信息，包括用户名和相关的安全标识符（SID）。每个用户都有一个唯一的 SID，用于标识用户和控制访问权限。
- 密码存储：为了安全起见，SAM 文件不直接存储用户的明文密码，而是存储密码的散列值。Windows 使用 NTLM（NT LAN Manager）协议生成这些散列值。具体而言，NTLM 采用 MD4 散列算法对用户密码进行散列。
- 加密保护：为了进一步保护 SAM 文件中的数据，Windows 对其进行加密。加密密钥存储在一个名为 SYSTEM 的文件中。攻击者需要同时访问 SAM 和 SYSTEM 文件才能解密和破解密码散列值。
- 注册表访问：在系统运行时，SAM 文件作为 Windows 注册表的一部分，通过 `HKEY_LOCAL_MACHINE\SAM` 路径访问。由于安全原因，只有具有系统级权限的用户（如 SYSTEM 账户）才能直接访问该路径。

## 提前要求

 - 物理接触，能摸到电脑，可以插入 U 盘
 - BIOS/UEFI 不能设置密码，可以通过 U 盘启动电脑
 - Windows 系统盘不能开启 BitLocker 磁盘加密

满足这些条件后，可以尝试进行植入木马病毒。

## 确定下使用的账户

一般来说一台电脑只有一个 Windows 用户，记录下日常使用的用户名。

## 使用 U 盘进入 PE 系统

进入 PE 系统，将 SAM 文件备份（用于之后恢复密码）
![image.png](https://s3.babudiu.com/iuxt/images/202408071251917.png)

用 NTPWEdit 或者 Dism++ 修改账户密码
![image.png](https://s3.babudiu.com/iuxt/images/202408071253647.png)

保存重启后，即可正常进入桌面。植入木马程序后，再次重启进入 PE， 将上面备份的 SAM 文件恢复到原始位置。
