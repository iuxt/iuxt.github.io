---
title: Flask之服务端持久化session
abbrlink: f2ce6df5
categories:
  - 开发
tags:
  - Flask
  - Python
date: 2021-12-29 17:37:01
---

需求如下：开发一个 web 界面，用户经过 oauth 认证后，给用户生成一个随机密码显示出来，并将用户名和密码发送给 radiusserver 用来当作 WIFI 密码。
因为希望密码不要随便就更换，那样员工出去再进来，手机就需要重新输入新密码才能连 WIFI，容易被人打。所以用 session 存储的方式，将密码保存一定时间。

## 什么是 session

session 基于 cookie 实现，保存在服务端的键值对（dict 类型），同时在浏览器中的 cookie 中也对应一相同的随机字符串，用来再次请求的时候验证
Flask 中的 session 是加密的，所以需要配置 `SECRET_KEY`

## 开始使用

### 导入模块

```Python
from flask import Flask, render_template, request, session
```

### 配置 SECRET_KEY

```Python
app.secret_key = os.getenv("SECRET_KEY", "not set key")
```

### 设置 session 类型

可以存临时文件，还可以存 redis、memcached、mongodb 等

app.config['SESSION_TYPE'] = 'filesystem'

### 设置 session 过期时间，默认是浏览器关闭就过期

app.config['PERMANENT_SESSION_LIFETIME'] = 3600

## 设置 session

### 添加 session

```Python
# 设置session
@app.route('/')
def set():
    session['username'] = 'zhanglikun'
    return 'success'
```

### 读取 session

```Python
 # 读取session
@app.route('/get')
def get():
    # return session['username']
    return session.get('username')
```

> `session['username']` 和 `session.get('username')` 都可以获取到值，不同的是:
> session['username'] 键不存在就会异常
> session.get('username') 键不存在时返回 None

### 删除 session

```python
@app.route('/delete/')
def delete():
    print session.get('username')
    session.pop('username', None)
    print session.get('username')
    return 'success'
```

### 清除 session 中所有数据

```python
@app.route('/clear')
def clear():
    print session.get('username')
    # 清除session中所有数据
    session.clear()
    print session.get('username')
    return 'success'
```
