---
title: 解决MySQL 5.7在Redhat 9中启动报错：libncurses.so.5和libtinfo.so.5缺失问题
categories:
  - 数据库
tags:
  - MySQL
  - mysqld
  - 运行库
  - RHEL
  - CentOS
abbrlink: lv23gkql
cover: 'https://static.zahui.fan/public/MySQL.svg'
date: 2024-04-16 16:00:43
---

采用二进制安装 MySQL 服务的时候， 之前在 CentOS 7 系统中，直接 yum 安装依赖包就可以正常运行，但是到了 RHEL 9 系统下， 会报错找不到 libncurses.so.5， 根据经验需要查找一下这个库属于哪个包：

```bash
yum provides libncurses.so.5
```

找不到这个包

![image.png](https://static.zahui.fan/images/202404152343237.png)

不考虑版本，再次搜索

```bash
yum provides libncurses.so.*
```

![image.png](https://static.zahui.fan/images/202404152344067.png)

发现可以找到 6.2 的版本, 安装这个包

```bash
yum install ncurses-libs
```

查看这个 rpm 包包含的文件：

```bash
rpm -ql ncurses-libs | grep libncurses.so
```

![image.png](https://static.zahui.fan/images/202404152347847.png)

此时需要做一个软链接（前提是此版本可以向后兼容，至少在 MySQL 5.7 这里运行是没问题的。）

```bash
ln -s /usr/lib64/libncurses.so.6 /usr/lib64/libncurses.so.5
```

修改完成，报另一个错误了：

同样的方法， 再创建一个软链接：

```bash
ln -s /usr/lib64/libtinfo.so.6 /usr/lib64/libtinfo.so.5
```

然后 MySQL 就可以正常运行了。
