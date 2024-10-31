---
title: Windows修改用户名
categories:
  - Windows
tags:
  - Windows
  - 配置记录
  - 注册表
abbrlink: lta396h7
cover: 'https://static.zahui.fan/public/Windows-old.svg'
date: 2024-03-02 20:57:42
---

之前 windows10 在安装过程中如果不使用微软账号登录的话，创建一个本地账户，那么创建好的用户名就是个人文件夹的名字。如果设置了中文，那么个人文件夹名字就是中文，后续会有软件兼容性问题，可以通过修改注册表来修改文件夹名字。

## 修改用户名

首先要区分一下什么是用户名
![image.png](https://static.zahui.fan/images/202403022109093.png)

![image.png](https://static.zahui.fan/images/202403022111200.png)

上面这些都不是用户名，而是显示出来的用户名，也就是用户名全名。可以在 `lusrmgr.msc` 或 `control userpasswords2` 或 `netplwiz` 查看:

![image.png](https://static.zahui.fan/images/202403022113496.png)

通过上图发现，我的用户名应该是 ooo

修改用户名可以直接在 `lusrmgr.msc` 进行修改，包括显示的全名，如果你只是想修改显示出来的名字，到这里就可以了。

## 修改个人文件夹路径

{% note danger flat %}
danger 修改个人文件夹路径需要慎重！有部分已安装软件引用的还是旧的路径，这样会造成各种报错，可能需要卸载重新安装才能正常使用。
{% endnote %}

当前我的文件夹名字是 测试， 如图：
![image.png](https://static.zahui.fan/images/202403022118314.png)

### 修改系统定义的路径

打开注册表编辑器，定位到 `计算机\HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList\` 下面一个用户对应一个文件夹，找到自己的项，修改 `ProfileImagePath` 的值
![image.png](https://static.zahui.fan/images/202403022122885.png)

注销再次登录，会出现正在准备 windows 的提示，这个是正常的。进入桌面，出现下面的提示，点击关闭 (这一步也可以在 pe 下完成)
![image.png](https://static.zahui.fan/images/202403022125931.png)

现在可以把用户文件夹进行重命名操作，重命名后再次注销重新登录。这个时候已经可以正常进入桌面了。

### 修改环境变量

在 系统属性 -- 高级 -- 环境变量 里将没有更新的配置进行更新。

![image.png](https://static.zahui.fan/images/202403022129458.png)

