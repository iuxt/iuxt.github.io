---
title: Django配置MySQL数据库支持
categories:
  - 开发
tags: [django, mysql]
abbrlink: 28913a98
cover: 'https://s3.babudiu.com/iuxt/public/django.svg'
date: 2022-11-21 17:54:17
updated: 2025-09-06 21:24:24
---

Django 支持 MySQL 主要有两种方式, 一种是使用 `pymysql` 包, 这个是个纯 python 包, 可以跨平台运行, 不过性能较差, 另一种是 `mysqlclient`, 这个需要操作系统支持, 在 linux 平台可以获得更好的性能, 在 Windows 系统下安装比较麻烦。

## mysqlclient

mysqlclient 需要依赖操作系统的库

{% tabs TabName %}
<!-- tab macOS安装 -->

首先你的 macOS 要装上 Homebrew，然后使用 Homebrew 安装 MySQL

```bash
# 安装的是mysql服务端（服务端也包含客户端），如果不想安装mysql服务器，可以只安装mysql-client。
brew install mysql@8.0

# 查看一下安装位置
brew --prefix mysql@8.0
```

在执行 `pip install mysqlclient` 之前：

```bash
# 这个命令直接在安装前执行即可，不需要放到.zshrc里。
export MYSQLCLIENT_CFLAGS=$(mysql_config --cflags)
export MYSQLCLIENT_LDFLAGS=$(mysql_config --libs)
```

上面的两个路径，需要确认 `mysql.h` 在这个目录里。
![image.png|347](https://s3.babudiu.com/iuxt/2025/09/30c9b085d1a5a1f6fe6af45bfc54b14c.png)

然后再正常安装 mysqlclient

```bash
pip install mysqlclient
```

<!-- endtab -->
<!-- tab Ubuntu和Debian安装 -->

```bash
sudo apt install python3-dev default-libmysqlclient-dev build-essential
```

<!-- endtab -->

<!-- tab CentOS和Fedora安装 -->

```bash
sudo yum install python3-devel mysql-devel
```

<!-- endtab -->

{% endtabs %}

然后 pip 安装 mysqlclient

```bash
pip install mysqlclient
```

## pymysql

直接安装:

```bash
pip install pymysql
```

在 `__init__.py` 或者 `settings.py` 文件开头添加

```python
import pymysql
pymysql.install_as_MySQLdb()
```

## settings.py 配置

Django 的 settings.py 需要配置：

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'django',
        'USER': 'root',
        'PASSWORD': '123456',
        'HOST': '127.0.0.1',
        'PORT': '3306'
    }
}
```
