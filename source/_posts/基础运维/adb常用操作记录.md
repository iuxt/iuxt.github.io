---
title: adb常用操作记录
abbrlink: b1ffa547
cover: 'https://static.zahui.fan/images/202211041307268.jpg'
categories:
  - 基础运维
tags:
  - adb
  - Android
date: 2021-05-08 11:09:39
---

## 打开应用

```bat
# am start 应用包名/activity名
adb shell am start com.ss.android.lark/com.ss.android.lark.main.app.MainActivity
```

### 获取 Activity 名

手机打开 App，电脑使用命令：

```bat
adb shell dumpsys activity activities
```

搜索一下 `mActivityComponent` :

![image.png](https://static.zahui.fan/images/202406241352443.png)

## 获取系统信息

### 获取是否解锁状态

```bat
adb shell dumpsys window policy
```

不同版本可能参数不一样，一个通用的办法是在熄屏先执行此命令，记录下来，然后亮屏再执行一次，对比一下差异就能知道是哪个参数了。小米 11 参数为 `mIsScreenOn`

## 卸载无法卸载的系统应用

```bat
adb shell pm uninstall --user 0 com.miui.systemAdSolution

等同于先进入adb shell ，然后再执行命令
adb shell
> pm uninstall --user 0 com.miui.systemAdSolution
```

### 查询 APP 列表

```bash
用下面命令查询已安装的软件列表（之后卸载软件需要知道软件包名称）

# 列出所有软件
adb shell pm list packages

# 列出系统软件
adb shell pm list packages -s

# 列出其他软件
adb shell pm list packages -3

# 列出已禁用软件
adb shell pm list packages -d

# 列出已启用软件
adb shell pm list packages -e
```

### 查询软件详情

```bash
# 查看软件详细信息
adb shell dumpsys package com.mipay.wallet

# 查看软件安装路径
adb shell pm path com.mipay.wallet
```

### 停止 & 禁用 & 卸载

```bash
# 停止 APP
adb shell am force-stop com.mipay.wallet

# 禁用 APP
adb shell pm disable-user com.mipay.wallet

# 启用 APP
adb shell pm enable com.mipay.wallet

# 卸载 APP，保留缓存与数据。
adb shell pm uninstall -k --user 0 com.mipay.wallet

# 卸载 APP，不保留缓存与数据。
adb shell pm uninstall --user 0 com.mipay.wallet

# 卸载后 恢复安装
adb shell pm install-existing --user 0 com.miui.securitycenter
```

> 恢复出厂设置会恢复所有被禁用和删除的 APP

### MIUI 常用卸载软件记录

> 以小米 11 HyperOS 1.0 为例（MIUI 类似）:

```bash
# 小米系统广告解决方案
adb shell pm uninstall -k --user 0 com.miui.systemAdSolution

# 小米广告分析
adb shell pm uninstall -k --user 0 com.miui.analytics

# 小米游戏中心服务
adb shell pm uninstall -k --user 0 com.xiaomi.gamecenter.sdk.service

# bug反馈
adb shell pm uninstall -k --user 0 com.miui.bugreport

# 快应用服务框架
adb shell pm uninstall -k --user 0 com.miui.hybrid

# 小米自带浏览器（卸载后需要自行安装浏览器）
adb shell pm uninstall -k --user 0 com.android.browser

# 小米手机管家（手机管家一键修复会关闭 adb 调试，所以把它卸载掉）
adb shell pm uninstall -k --user 0 com.miui.securitycenter
```

## 模拟点击

> 开发者选项里面要开启 usb 调试 (安全设置) 和 usb 调试两个开关

### 模拟点击 (500,1000) 坐标

```bash
adb shell input tap 500 1000
```

> 开发者选项中打开指针位置可以看到点的坐标

### 模拟滑动

```bash
# 从（250，250）滑动到（300，300）
adb shell input swipe 250 250 300 300 
```

### 模拟输入

```bash
adb shell input text 'hello world'
```

### 模拟按键

```bash
# 模拟back
adb shell input keyevent 4
```

> keyevent code:

```ini
KEYCODE_UNKNOWN=0;
KEYCODE_SOFT_LEFT=1;
KEYCODE_SOFT_RIGHT=2;
KEYCODE_HOME=3;     //home键
KEYCODE_BACK=4;     //back键
KEYCODE_CALL=5;
KEYCODE_ENDCALL=6;
KEYCODE_0=7;
KEYCODE_1=8;
KEYCODE_2=9;
KEYCODE_3=10;
KEYCODE_4=11;
KEYCODE_5=12;
KEYCODE_6=13;
KEYCODE_7=14;
KEYCODE_8=15;
KEYCODE_9=16;
KEYCODE_STAR=17;
KEYCODE_POUND=18;
KEYCODE_DPAD_UP=19;
KEYCODE_DPAD_DOWN=20;
KEYCODE_DPAD_LEFT=21;
KEYCODE_DPAD_RIGHT=22;
KEYCODE_DPAD_CENTER=23;
KEYCODE_VOLUME_UP=24;
KEYCODE_VOLUME_DOWN=25;
KEYCODE_POWER=26;
KEYCODE_CAMERA=27;
KEYCODE_CLEAR=28;
KEYCODE_A=29;
KEYCODE_B=30;
KEYCODE_C=31;
KEYCODE_D=32;
KEYCODE_E=33;
KEYCODE_F=34;
KEYCODE_G=35;
KEYCODE_H=36;
KEYCODE_I=37;
KEYCODE_J=38;
KEYCODE_K=39;
KEYCODE_L=40;
KEYCODE_M=41;
KEYCODE_N=42;
KEYCODE_O=43;
KEYCODE_P=44;
KEYCODE_Q=45;
KEYCODE_R=46;
KEYCODE_S=47;
KEYCODE_T=48;
KEYCODE_U=49;
KEYCODE_V=50;
KEYCODE_W=51;
KEYCODE_X=52;
KEYCODE_Y=53;
KEYCODE_Z=54;
KEYCODE_COMMA=55;
KEYCODE_PERIOD=56;
KEYCODE_ALT_LEFT=57;
KEYCODE_ALT_RIGHT=58;
KEYCODE_SHIFT_LEFT=59;
KEYCODE_SHIFT_RIGHT=60;
KEYCODE_TAB=61;
KEYCODE_SPACE=62;
KEYCODE_SYM=63;
KEYCODE_EXPLORER=64;
KEYCODE_ENVELOPE=65;
KEYCODE_ENTER=66;
KEYCODE_DEL=67;
KEYCODE_GRAVE=68;
KEYCODE_MINUS=69;
KEYCODE_EQUALS=70;
KEYCODE_LEFT_BRACKET=71;
KEYCODE_RIGHT_BRACKET=72;
KEYCODE_BACKSLASH=73;
KEYCODE_SEMICOLON=74;
KEYCODE_APOSTROPHE=75;
KEYCODE_SLASH=76;
KEYCODE_AT=77;
KEYCODE_NUM=78;
KEYCODE_HEADSETHOOK=79;
KEYCODE_FOCUS=80;//*Camera*focus
KEYCODE_PLUS=81;
KEYCODE_MENU=82;
KEYCODE_NOTIFICATION=83;
KEYCODE_SEARCH=84;
KEYCODE_MEDIA_PLAY_PAUSE=85;
KEYCODE_MEDIA_STOP=86;
KEYCODE_MEDIA_NEXT=87;
KEYCODE_MEDIA_PREVIOUS=88;
KEYCODE_MEDIA_REWIND=89;
KEYCODE_MEDIA_FAST_FORWARD=90;
KEYCODE_MUTE=91;
```

## 常见问题

### Ubuntu 等 Linux 系统无法连接 ADB

官方说明：<https://developer.android.com/studio/run/device?hl=zh-cn>

比如报错 `no permissions (user in plugdev group; are your udev rules wrong?)`

在 Linux 系统下，需要保证：

```bash
sudo usermod -aG plugdev $LOGNAME
sudo apt-get install android-sdk-platform-tools-common adb
```

然后注销重新登录，再次执行 adb 命令，手机上应该就会有授权弹窗了。