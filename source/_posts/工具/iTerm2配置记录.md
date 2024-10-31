---
title: iTerm2配置记录
categories:
  - 工具
tags:
  - 效率工具
  - 常用操作
abbrlink: ltqmt2r2
date: 2023-03-14 10:49:22
---

## 快捷键

macOS 的快捷键图标表示

| 控制键 | 说明      |
| --- | ------- |
| ⌘   | command |
| ⌃   | control |
| ⌥   | option  |
| ⇧   | shift   |

其中 control 开头的快捷键不止在 iTerm2 中可用，在所有 shell 终端中都是可用的。

### 标签（tab）

| 功能   | 快捷键             | 备注                               |
| ---- | --------------- | -------------------------------- |
| 新建标签 | command + t     |                                  |
| 关闭标签 | command + w     |                                  |
| 切换标签 | command + ← 或 → | 可以用 command + 数字键，切换到指定的 tab 上      |
| 切换全屏 | command + enter | 等同于 fn + f, fn + f 在所有 macOS 软件中都可用 |

### 分屏

| 功能       | 快捷键                     | 备注                             |
| -------- | ----------------------- | ------------------------------ |
| 垂直分屏     | command + d             |                                |
| 水平分屏     | command + shift + d     |                                |
| 切换到不同的分屏 | command + option + 上下左右 |                                |
| 同时操作所有窗口 | command + shift + i     | 操作打开的所有 tab 和分屏, 功能生效时，右上角有个图标提示 |

### 其他

| 功能          | 快捷键                 | 备注                 |
| ----------- | ------------------- | ------------------ |
| 快速定位光标      | option + 鼠标点击       | 很常用的功能             |
| 查找          | command + f         |                    |
| 清屏          | control + l         |                    |
| 搜索命令历史      | control + r         |                    |
| 清除当前行       | control + u         | 清除当前行，无论光标在哪里。     |
| 到行首         | control + a         |                    |
| 到行尾         | control + e         |                    |

### 不常用或不建议使用的快捷键

| 功能          | 快捷键                 | 备注                 |
| ----------- | ------------------- | ------------------ |
| 前进后退        | control + f/b       | 相当于 ← →            |
| 查看剪贴板历史     | command + shift + h |                    |
| 上一条命令       | control + p         | 相当于按 ↑             |
| 删除当前光标的一个字符 | control + d         | 等同于 fn + ⌫ 或 DEL 键 |
| 删除光标之前的一个字符 | control + h         | 等同于 ⌫              |
| 删除光标之前的单词   | control + w         |                    |
| 删除到文本末尾     | control + k         |                    |

## 备份还原配置

### 备份

在 Profiles --> Other Actions 里面，导出 json 文件备份

### 还原

同样的位置 import json， 或者放到 `~/Library/Application Support/iTerm2/DynamicProfiles`
