---
title: 最后一个Typora免费版0.11.18
abbrlink: 64b52e0d
cover: 'https://static.zahui.fan/images/202303181541059.png'
categories:
  - 工具
tags: [Markdown, GUI, Tools, 编辑器]
date: 2021-12-10 17:41:31
updated: 2025-02-27 11:24:04
---

> Typora 是一个所见即所得的 Markdown 跨平台写作工具，目前已经发布正式版，并且更改为付费模式，0.11.18_beta 是最后一个免费的测试版，有需要的可以选择下载。

## Windows 用户

下载地址： ~~<https://github.com/iuxt/src/releases/download/2.0/typora-0-11-18.exe>~~

0.11.18 现在被远程施法了，会提示过期无法使用,可以使用 [0.9.96](https://github.com/iuxt/src/releases/download/2.0/typora-setup-x64_0.9.96.exe) 版

## Mac 用户

下载地址： <https://github.com/iuxt/src/releases/download/2.0/typora-0-11-18.dmg>

## Ubuntu 用户

下载地址：<https://github.com/iuxt/src/releases/download/2.0/Typora_Linux_0.11.18_amd64.deb>

### 安装方法

使用 apt 安装：

```bash
sudo apt install ./Typora_Linux_0.11.18_amd64.deb
```

## 其他 Linux 用户（非 debian 系）

下载地址：<https://github.com/iuxt/src/releases/download/2.0/typora-0-11-18.tar.gz>

### 安装方法

解压

```bash
tar xf typora-0-11-18.tar.gz -C /opt/
```

创建桌面文件和图标

vim ~/.local/share/applications/typora.desktop

```ini
[Desktop Entry]
Name=Typora
Comment=A minimal Markdown reading & writing app. Change Log: (https://typora.io/windows/dev_release.html)
GenericName=Markdown Editor
Exec=/opt/typora/Typora
Icon=/opt/typora/resources/assets/icon/icon_256x256@2x.png
Type=Application
Categories=Office;WordProcessor;Development;
MimeType=text/markdown;text/x-markdown;
```
