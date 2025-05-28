---
title: PHP应用容器化遇到的一些问题
categories:
  - 容器
tags:
  - PHP
  - Docker
  - 容器
  - 编译
abbrlink: swpjjc
date: 2024-05-23 17:25:59
cover: https://static.zahui.fan/images/20250528184612107.png
updated: 2025-05-28 18:46:38
---

这里以 WordPress 为例，我们不用官方的镜像，而是用 php 镜像

php 官方有个自带 apache 的版本，如：`php:8.1.32-apache`， 建议用这个版本，这个版本不用考虑 Nginx 和 php 的文件共享问题，启动容器：

```bash
docker run --rm -d --name php-test \
	-v ./app:/var/www/html \
	-p 8080:80 \
php:8.1.32-apache
```

## 自定义 php 配置文件

比如调整 PHP 上传文件大小限制

docker run 的时候挂载 php.ini

```bash
docker run ... \
	-v ./php.ini:/usr/local/etc/php/conf.d/php.ini \
...
```

php.ini 增加

```ini
upload_max_filesize = 1024M
```

## 安装 Core 扩展

![image.png](https://static.zahui.fan/images/20250523172745533.png)
这个时候说明 php 正常工作了，但是缺扩展。

```dockerfile
FROM php:8.1.32-apache
RUN docker-php-ext-configure mysqli \
	&& docker-php-ext-install mysqli
```

## 安装其他扩展

![image.png|604](https://static.zahui.fan/images/20250523184214145.png)

比如安装 imagick，整合到 dockerfile 里构建个新的镜像。imagick 使用 pecl 安装

```bash
FROM php:8.1.32-apache
RUN apt-get update \
    && apt-get install -y libmagickwand-dev \
    && pecl install imagick \
    && docker-php-ext-enable imagick
```

## 安装自定义 PHP 扩展

比如安装主题的时候需要安装主题文件提供的扩展：
![image.png|509](https://static.zahui.fan/images/20250523180749302.png)

查看 php 扩展目录

```bash
php -i | grep "extension_dir"
```

把这个目录挂载出来,将扩展文件放进去。或者挂载一个新的目录

```bash
docker run ... \
	-v ./extensions:/extensions \
...
```

然后 php.ini 中指定扩展路径

```bash
extension=/extensions/swoole_loader_81_nts.so
```

## WordPress 常见警告

### post_max_size 的值小于 upload_max_filesize

![image.png](https://static.zahui.fan/images/20250523184236383.png)

这个问题需要配置一下 php.ini

```ini
upload_max_filesize = 200M
post_max_size = 320M
```

### 反向代理问题

WordPress 经过 Nginx 反向代理后，可能会出现页面样式丢失的问题，查看浏览器 F12 发现一堆 404, 原因为 WordPress 自身也带跳转，解决方法可以看：[Nginx反向代理wordpress并启用https](/posts/990b6b62/)
