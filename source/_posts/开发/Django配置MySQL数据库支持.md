---
title: Django配置MySQL数据库支持
categories:
  - 开发
tags: [django, mysql]
abbrlink: 28913a98
cover: 'https://s3.babudiu.com/iuxt/public/django.svg'
date: 2022-11-21 17:54:17
updated: 2025-09-11 12:58:38
---

Django 支持 MySQL 主要有两种方式, 一种是使用 `pymysql` 包, 这个是个纯 python 包, 可以跨平台运行, 不过性能较差, 另一种是 `mysqlclient`, 这个需要操作系统支持, 在 linux 平台可以获得更好的性能, 在 Windows 系统下安装比较麻烦。

## mysqlclient

mysqlclient 需要依赖操作系统的库

{% tabs TabName %}
<!-- tab macOS安装 -->

首先你的 macOS 要装上 Homebrew，然后使用 Homebrew 安装 MySQL

```bash
# 如果你安装了MySQL服务端 brew install mysql@8.0，可以不用安装mysql-client
brew install mysql-client
echo 'export PATH="/opt/homebrew/opt/mysql-client/bin:$PATH"' >> ~/.zshrc

# 这些命令直接在安装前执行即可，不需要放到.zshrc里。
export MYSQLCLIENT_CFLAGS=$(mysql_config --cflags)
export MYSQLCLIENT_LDFLAGS=$(mysql_config --libs)
export LDFLAGS="-L/opt/homebrew/opt/openssl@3/lib -L/opt/homebrew/opt/zstd/lib"
export CPPFLAGS="-I/opt/homebrew/opt/openssl@3/include -I/opt/homebrew/opt/zstd/include"
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

验证安装是否成功

```bash
python -c "import MySQLdb; print('MySQLdb 导入成功')"
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
