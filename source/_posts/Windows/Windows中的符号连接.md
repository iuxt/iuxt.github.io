---
title: Windows中的符号连接
categories:
  - Windows
tags: []
abbrlink: so24vr
date: 2023-12-06 13:35:51
cover: ""
updated: 2025-06-12 16:21:55
---

## mklink 命令

```bat
mklink  链接文件    原始文件/目录
/D      创建目录符号链接。默认为文件符号链接。
/H      创建硬链接而非符号链接。
/J      创建目录联接。
```

| 特性         | `/H`（硬链接）        | `/D`（符号链接）     | `/J`（目录链接） |
| ---------- | ---------------- | -------------- | ---------- |
| **支持目标类型** | 仅文件              | 文件或目录          | 仅目录        |
| **跨分区支持**  | 否                | 是              | 否          |
| **网络路径支持** | 否                | 是              | 否          |
| **与目标的关系** | 共享同一数据，删除链接不影响文件 | 目标被删除，链接无效     | 目标被删除，链接无效 |
| **生效范围**   | 文件系统             | 文件系统           | 文件系统       |
| **创建所需权限** | 无                | 需要管理员权限        | 无          |
| **性能影响**   | 最低               | 较低（需要额外解析符号链接） | 较低         |

## PowerShell 中的 New-Item

```powershell
# 符号链接
New-Item -ItemType SymbolicLink -Path C:\Users\iuxt\SynologyDrive -Target D:\SynologyDrive\

# 目录连接
New-Item -ItemType Junction

# 硬链接
New-Item -ItemType HardLink
```
