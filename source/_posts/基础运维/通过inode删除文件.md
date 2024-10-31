---
title: 通过inode删除文件
abbrlink: 33d6f438
cover: 'https://static.zahui.fan/public/bash.svg'
categories:
  - 基础运维
tags:
  - Linux
  - Command
date: 2021-09-01 14:11:02
---

> 有时候会有一些文件名是乱码的文件无法删除，这时候可以通过 inode 来删除。

## 获取文件的 inode

```bash
ls -ali
```

第一列就是文件的 inode

## 通过 inode 删除

```bash
find -inum 527084 -exec rm -rf {} \;
```
