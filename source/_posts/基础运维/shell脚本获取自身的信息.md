---
title: shell脚本获取自身的信息
categories:
  - 基础运维
tags:
  - Shell
  - cli
  - 命令行工具
abbrlink: lrcy3q4o
cover: 'https://s3.babudiu.com/iuxt/public/bash.svg'
date: 2024-01-14 11:37:23
---

写 shell 脚本， 有时候需要获取一些信息， 比如这个脚本的名字，脚本所在的目录，脚本的绝对路径， 这个脚本的 pid， 参数等。

| 变量 | 说明 |
| ---- | ---- |
| $0 | 脚本自身的路径（执行的时候调用路径） |
| $1 | 第一个参数 |
| $? | 上一个脚本的返回值，0为正常 |
| $* | 所有的参数 |
| $# | 参数的个数 |
| $$ | 当前脚本的pid |
| $_ | 上一条命令的参数 |

## 获取脚本的文件名

`$0` 是脚本的路径，这个路径有可能是相对路径，那么可以使用 dirname 和 basename 配合来获取脚本绝对路径

```bash
# 脚本所在的目录的绝对路径
echo "$(cd $(dirname $0); pwd)"

# 脚本的文件名
echo $(basename $0)
```

## 获取脚本的绝对路径

```bash
# 获取脚本的绝对路径
DIR=$(cd $(dirname $0); pwd)
FILE=$(basename $0)

echo "${DIR}/${FILE}"
```

## 进入临时目录

```bash
# $_ 指的是上一个命令的参数，这个里面指的就是temp
mkdir temp && cd $_
```