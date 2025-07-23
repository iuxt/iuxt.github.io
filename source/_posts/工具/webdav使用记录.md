---
title: webdav使用记录
categories:
  - 工具
tags: [webdav, curl, 命令行工具, cli]
abbrlink: 1e91b84d
date: 2023-07-04 07:23:12
updated: 2025-07-23 19:00:30
---

## 在 windows 挂载到 z 盘

映射坚果云 webdav, PERSISTENT:no 表示不会记忆映射, 重启会丢失.

```bat
net use Z: https://dav.jianguoyun.com/dav/ /user:xxx@qq.com <密码> /PERSISTENT:no
```

## 通过 curl 使用 webdav

### 上传文件

```bash
# 本地的test-new.zip文件上传到远程为test.zip
curl --user xxx@qq.com:<密码> https://example.webdav.com/dav/test.zip -T ./test-new.zip 

# 保留文件名不变
curl --user xxx@qq.com:<密码> https://example.webdav.com/dav/ -T ./test-new.zip 
```

### 创建目录

```bash
# 创建根目录 xxxxxxx
curl --user xxx@qq.com:<密码> -X MKCOL https://example.webdav.com/dav/xxxxxxx/
```

### 重命名文件（移动文件）

```bash
# 将远程的目录名 1 改为 2
curl --user xxx@qq.com:<密码> -X MOVE --header 'Destination:https://example.webdav.com/dav/2/' https://example.webdav.com/dav/1/
```

### 删除文件

```bash
curl --user xxx@qq.com:<密码> -X DELETE https://example.webdav.com/dav/2/
```
