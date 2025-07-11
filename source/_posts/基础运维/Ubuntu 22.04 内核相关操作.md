---
title: Ubuntu 22.04 内核相关操作
categories:
  - 基础运维
tags:
  - Ubuntu
  - 配置记录
  - Kernel
abbrlink: lr8yc0vu
cover: 'https://s3.babudiu.com/iuxt/public/Ubuntu.svg'
date: 2024-01-11 16:32:46
---

文章内容在 Ubuntu 22.04 系统下测试成功, 版本相差过大请自测。

## 开机显示启动项

新版 Ubuntu 好像默认不显示启动项而直接进入系统了，可以通过修改 `/etc/default/grub` 来实现开机显示启动选项列表

```bash
# 注释掉这一行
# GRUB_TIMEOUT_STYLE=hidden

# 这一行是在grub界面等待的时间，单位s
GRUB_TIMEOUT=30
```

修改完成后执行 `sudo update-grub` 更新 grub 配置

{% note warning flat %}
下面两种方式二选一即可。
{% endnote %}

## 更换使用的内核版本（通过启动项 uuid 指定方式）

### 查看当前在用的内核版本

```bash
uname -r
```

6.5.0-14-generic

### 查看系统启动项

```bash
# 查看'Advanced options for Ubuntu'选项的uuid
grep "submenu 'Advanced options for Ubuntu'" /boot/grub/grub.cfg | awk -F\' '{print $(NF-1)}'

# 查看 内核版本选项
grep "menuentry_id_option " /boot/grub/grub.cfg | awk -F\' '{print $(NF-1)}'
```

比如 'Advanced options for Ubuntu' 选项的 uuid 是 `gnulinux-advanced-89ee03ba-6808-4977-a4fb-9b10174744f8` 内核版本启动项是 `gnulinux-5.15.0-1005-azure-advanced-89ee03ba-6808-4977-a4fb-9b10174744f8` 那么最终的启动项配置就是

```bash
gnulinux-advanced-89ee03ba-6808-4977-a4fb-9b10174744f8>gnulinux-5.15.0-1005-azure-advanced-89ee03ba-6808-4977-a4fb-9b10174744f8
```

uuid 对应关系：
![image.png](https://s3.babudiu.com/iuxt/images/202401112216030.png)

对应的启动界面 submenu:
![image.png](https://s3.babudiu.com/iuxt/images/202401112224241.png)

对应的启动界面 menuentry:
![image.png](https://s3.babudiu.com/iuxt/images/202401112225292.png)

### 修改默认启动项

```bash
sudo vim /etc/default/grub
```

修改为上一步生成的 启动项配置

```ini
GRUB_DEFAULT='gnulinux-advanced-89ee03ba-6808-4977-a4fb-9b10174744f8>gnulinux-5.15.0-1005-azure-advanced-89ee03ba-6808-4977-a4fb-9b10174744f8'
```

### 更新配置

更新配置文件到 `/boot/grub/grub.cfg`

```bash
sudo update-grub
```

```bash
Sourcing file `/etc/default/grub'
Sourcing file `/etc/default/grub.d/init-select.cfg'
Generating grub configuration file ...
Found linux image: /boot/vmlinuz-6.5.0-14-generic
Found initrd image: /boot/initrd.img-6.5.0-14-generic
Found linux image: /boot/vmlinuz-5.15.0-40-generic
Found initrd image: /boot/initrd.img-5.15.0-40-generic
Found memtest86+ image: /boot/memtest86+.elf
Found memtest86+ image: /boot/memtest86+.bin
Warning: os-prober will not be executed to detect other bootable partitions.
Systems on them will not be added to the GRUB boot configuration.
Check GRUB_DISABLE_OS_PROBER documentation entry.
done
```

## 更换使用的内核版本（通过记录上一次选择的内核）

sudo vim /etc/default/grub

```ini
# 设置为保存记录
GRUB_SAVEDEFAULT=true
GRUB_DEFAULT=saved

# 注释掉这一行，使grub选项显示
# GRUB_TIMEOUT_STYLE=hidden
GRUB_TIMEOUT=10
```

更新 grub 配置

```bash
sudo update-grub
```

重启后， 选择你想使用的内核， 下次重启就会自动选择此内核

{% note danger flat %}
注意： 可以在选择好内核后，再把 grub 界面隐藏掉。避免误操作。
{% endnote %}