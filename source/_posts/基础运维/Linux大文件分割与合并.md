---
title: Linux大文件分割与合并
categories:
  - 基础运维
tags:
  - cli
  - 命令行工具
  - 文件
  - Linux
abbrlink: lra06cl1
cover: 'https://static.zahui.fan/public/bash.svg'
date: 2024-01-12 10:12:07
---

服务器上有个文件需要下载到本地, 但是文件较大, 我们都是通过 jumpserver 连接的, 通过 jumpserver 下载难免会遇到网络波动等导致下载失败, 我们可以通过分割大文件成一个个小文件, 然后下载后再在本地合并. 用到的命令是 split

## split 分割大文件

```bash
split -b 1024M -d -a 3 2023.tar.gz tmp.
```

参数说明:

| 参数 | 说明 |
| ---- | ---- |
| -b | 指定每个文件的大小, 支持 K M G |
| -d | 指定后缀编码为数字，默认编码为字母 |
| -a | 指定后缀长度,3 表示 3 位数, 比如上面的命令, 生成的文件就是 tmp.000 ...  |
| ./tmp. | 这个是生成的文件名前面的部分 |

如果报错 `split: output file suffixes exhausted` 说明后缀不够用了, 比如参数 `-a 1 ` 支持的后缀为 0 - 9 , 如果文件太大, 超过了 9, 就会报这个错.

## 使用 cat 合并大文件

```bash
cat tmp.* > 2023.tar.gz
```

合并完成再验证一下 MD5 值, 和服务器做下对比即可.

```bash
md5sum 2023.tar.gz
```