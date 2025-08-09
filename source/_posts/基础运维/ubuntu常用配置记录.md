---
title: ubuntu常用配置记录
abbrlink: 27a660e
cover: https://s3.babudiu.com/iuxt/public/Ubuntu.svg
categories:
  - 基础运维
tags: [Linux, 配置记录, Ubuntu, Crontab]
date: 2021-02-18 18:35:12
updated: 2025-06-05 18:20:13
---

以 Ubuntu 的尿性，总是会搞一些奇奇怪怪的“创新”，所以本文只针对于我在使用的 Ubuntu 系统，当前版本是 24.04 LTS，版本相差太大就不具有参考意义了。

## 修改国内源

```bash
sudo sed -i 's@//.*archive.ubuntu.com@//mirrors.ustc.edu.cn@g' /etc/apt/sources.list.d/ubuntu.sources
```

## 编译环境安装

```bash
sudo apt-get install -y build-essential tcl gcc make zlib1g-dev libssl-dev libncursesw5-dev libgdbm-dev libc6-dev libffi-dev openssl libxml2-dev libpcre3 libpcre3-dev libncurses5-dev libicu-dev libmcrypt-dev curl libcurl4-gnutls-dev libjpeg-dev libpng-dev libxslt1-dev
```

## 切换语言环境

```bash
dpkg-reconfigure locales
```

## Ubuntu 网卡配置文件

图形界面版 Ubuntu 修改网卡配置应该首选图形界面修改，服务器版优先使用 `nmtui` 来修改。

### 查看网卡硬件信息

```bash
lshw -short | grep network
ifconfig -a
```

### 网卡配置文件

> ubuntu 从 17.10 开始，已放弃在 `/etc/network/interfaces` 里固定 IP 的配置，而是改成 netplan 方式，配置写在 `/etc/netplan/01-netcfg.yaml` 或者类似名称的 yaml 文件里

```yml
network:
  ethernets:
    eth0:
      dhcp4: no
      addresses: [10.0.0.10/24]
      routes:
        - to: default
          via: 10.0.0.1
      nameservers:
        addresses:
          - 223.5.5.5
          - 223.6.6.6
```

dhcp 配置

```yml
network:
  ethernets:
    eth0:
      dhcp4: true
```

然后执行 `netplan try` 使配置生效,不用重启网卡。

### 临时修改网卡 DNS 地址

```bash
vim /etc/resolv.conf
nameserver 223.5.5.5 #修改成你的主DNS
nameserver 223.6.6.6 #修改成你的备用DNS
search localhost #你的域名
修改后:wq退出，配置会实时生效，但是重启系统后会丢失配置。
```

### 永久修改网卡 DNS

```bash
vim /etc/resolvconf/resolv.conf.d/base
添加如下内容

nameserver 8.8.8.8
nameserver 8.8.4.4

刷新DNS使生效

resolvconf -u
```

> resolv.conf 文件就是根据/etc/resolvconf/resolv.conf.d 目录中的这几个文件生成的。

### 查看现在正在使用的 DNS

```bash
systemd-resolve --status
```

### 启动速度慢

等在 `a start job is running for wait for network to be configured` 很久， 可以直接关闭 `systemd-networkd-wait-online` 服务

```bash
sudo systemctl mask systemd-networkd-wait-online.service
```

## 系统配置

### 修改默认编辑器

```bash
sudo update-alternatives --config editor   # 用于 visudo 等
sudo select-editor                         # 用于 crontab -e 等
```

### 安装字体

系统字体位置 `/usr/share/fonts/`, 将字体复制到 `/usr/share/fonts/` 目录
用户字体位置 `~/.local/share/fonts`, 将字体复制到 `~/.local/share/fonts` 目录

然后刷新字体缓存

```bash
fc-cache -vf
```

## 包管理

### 安装本地包，不处理依赖

```bash
dpkg -i ./xxx.deb
```

### 安装本地包，并自动处理依赖

```bash
apt install ./xxx.deb
```

### 查看一个包有哪些文件组成

```bash
dpkg -L vim
```

### 锁定版本, 不更新

```bash
sudo apt-mark hold kubelet kubeadm kubectl
```

### 查询文件属于哪个包

```bash
apt install -y apt-file
apt-file update
apt-file search libssl.so.1.1
```

### 下载离线包

只下载，不安装

```bash
sudo rm -f /var/cache/apt/archives/*.deb
sudo apt install -d fio

# 下载的deb文件在
/var/cache/apt/archives
```

### 安装指定版本的包

查询源内可用的包版本

```bash
apt-cache madison docker-ce
```

安装指定版本的包

```bash
sudo apt-get install docker-ce=<VERSION_STRING>
```

### 非交互式

```bash
sh -c 'DEBIAN_FRONTEND=noninteractive apt-get install -y -qq apt-transport-https ca-certificates curl >/dev/null'
```

### 不安装推荐的软件包

```bash
apt-get --no-install-recommends 
```

## 图形界面

### 桌面图标配置文件

用户配置文件位置 `~/.local/share/applications`
系统配置文件位置: `/usr/share/applications`

```ini
[Desktop Entry]
Name=Visual Studio Code
Comment=Code Editing. Redefined.
GenericName=Text Editor
Exec=/usr/share/code/code --no-sandbox --unity-launch %F
Icon=com.visualstudio.code
Type=Application
StartupNotify=false
StartupWMClass=Code
Categories=Utility;TextEditor;Development;IDE;
MimeType=text/plain;inode/directory;application/x-code-workspace;
Actions=new-empty-window;
Keywords=vscode;

X-Desktop-File-Install-Version=0.24

[Desktop Action new-empty-window]
Name=New Empty Window
Exec=/usr/share/code/code --no-sandbox --new-window %F
Icon=com.visualstudio.code
```

### Gnome 插件

```bash
sudo apt install -y chrome-gnome-shell
```

<https://extensions.gnome.org/>

<https://extensions.gnome.org/extension/5278/pano/>

## 配置 ssh

我使用 tssh 来管理 ssh 会话。

```bash
sudo apt install libgles2 zenity lrzsz -y
sudo apt install apt-file -y
sudo apt-file update
```
