---
title: macOS 的 Rosetta 2 使用记录
categories:
  - 工具
tags: []
abbrlink: svmr15
date: 2023-05-02 18:41:28
cover: ""
updated: 2025-05-02 18:54:48
---

## Rosetta 2 是什么

Rosetta 2 是一个兼容层，是苹果 macOS 在 2020 年为了从 intel 芯片转向 Apple Silicon 芯片，又不能失去对现有软件生态的兼容（本来生态就不太好，再不兼容就完蛋了。）
为什么叫 Rosetta 2，因为 Rosetta 是苹果上一次变换架构所开发的软件。

## 如何判断 Rosetta 2 是否被安装

终端执行命令, 能成功运行说明支持 x86_64 程序。

```bash
arch -x86_64 bash
uname -m
```

查看进程

```bash
pgrep oahd
```

## 手动安装 Rosetta 2

```bash
softwareupdate --install-rosetta --agree-to-license
```
