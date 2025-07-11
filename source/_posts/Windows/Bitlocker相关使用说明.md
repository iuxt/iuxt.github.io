---
title: Bitlocker相关使用说明
abbrlink: 55d95f5b
categories:
  - Windows
tags:
  - BitLocker
  - 加密
cover: 'https://s3.babudiu.com/iuxt/images/202210302313030.jpg'
date: 2022-10-10 22:00:43
---

## 解锁 bitlocker

```bat
manage-bde –unlock E: -RecoveryPassword ******
```

## 保存到 Microsoft 账户的 Bitlocker 秘钥

<https://account.microsoft.com/devices/recoverykey>

## 手动锁定 Bitlocker

```bat
%systemdrive%\Windows\System32\Manage-bde.exe –lock d:
```

如果有打开的文件，则会提示解锁不成功，这时可以加上强制选项：

```bat
%systemdrive%\Windows\System32\Manage-bde.exe -lock -fd d:
```
