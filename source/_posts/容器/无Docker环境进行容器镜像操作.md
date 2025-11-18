---
date: 2025-11-16 19:52:09
updated: 2025-11-16 21:01:20
title: 无Docker环境进行容器镜像操作
categories:
  - 容器
tags: [容器, 镜像]
abbrlink: t5tiax
cover: https://s3.babudiu.com/iuxt/public/Docker.svg
---

找了有两个开源项目比较不错，都可以完成镜像的迁移。

## crpy 的使用

crpy 使用 python 开发，有本地缓存，拉取和推送镜像速度比较快。使用体验比较接近 docker。
开源地址： <https://github.com/bvanelli/crpy>

### 安装

```bash
# 也可以安装到虚拟环境
pip install crpy
```

### 认证

```bash
crpy login registry.cn-hangzhou.aliyuncs.com -u <username> -p <password>
```

认证信息存储在：`~/.crpy/config.json`

### 拉取镜像

```bash
crpy pull nginx:1.29 nginx_1.29.tar.gz
```

缓存数据存储在：`~/.crpy/blobs`

### 推送镜像

```bash
crpy push nginx_1.29.tar.gz registry.cn-hangzhou.aliyuncs.com/iuxt/nginx:1.29
```

## crane 的使用

这个工具是 Golang 写的，支持 Windows，单文件直接运行，比较方便，支持指定架构。

<https://github.com/google/go-containerregistry/blob/main/cmd/crane/README.md>

### 安装

在：<https://github.com/google/go-containerregistry/releases> 下载二进制文件即可。

### 认证

```bash
crane auth login registry.cn-hangzhou.aliyuncs.com -u <username> -p <password>
```

认证信息存储在：`~/.docker/config.json`

### 拉取镜像

```bash
# --platform linux/arm64 可以指定拉取特定架构的镜像
crane pull --platform linux/arm64 nginx:1.27 nginx_1.27.tar
```

### 推送镜像

```bash
crane push .\nginx_1.27.tar registry.cn-hangzhou.aliyuncs.com/iuxt/nginx:1.27
```
