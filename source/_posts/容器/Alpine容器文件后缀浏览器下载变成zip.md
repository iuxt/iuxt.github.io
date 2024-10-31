---
title: Alpine容器文件后缀浏览器下载变成zip
categories:
  - 容器
abbrlink: siid4q
cover: 'https://static.zahui.fan/public/alpine.svg'
date: 2024-08-20 16:34:01
tags:
---

比如一个网盘程序，上传了一个 excel 文件，点击获取直链，然后将获取到的直链放到浏览器地址栏访问触发下载，下载下来的文件后缀自动变成了.zip
![image.png](https://static.zahui.fan/images/202408201603813.png)

这是因为 Alpine 镜像比较精简，缺少了很多 MIME 类型数据，可以通过安装 `mailcap` 包来解决。

```Dockerfile
FROM Alpine:latest
RUN apk add --no-cache mailcap
```

再次测试，已经正常

![image.png](https://static.zahui.fan/images/202408201613078.png)
