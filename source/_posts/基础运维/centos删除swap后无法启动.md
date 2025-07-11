---
title: centos删除swap后无法启动
categories:
  - 基础运维
tags:
  - CentOS
  - 磁盘
  - 分区
abbrlink: scfoaz
cover: 'https://s3.babudiu.com/iuxt/public/CentOS.svg'
date: 2024-04-24 14:20:58
---

删除了 CentOS 的 swap 分区后，重启系统报错，提示 `Warning: /dev/centos/swap does not exist`，如图：

![image.png](https://s3.babudiu.com/iuxt/images/202404241243993.png)

先挂载 /boot 分区, 不确定就一个一个挂载看看里面的文件对不对，正常情况下 /boot 分区大小在 1GB 以内

```bash
mkdir /tmp/boot
mount /dev/sda1 /tmp/boot
cd /tmp/boot
```

`vi grub2/grub.cfg`
删除 `rd.lvm.lv=centos/swap` 这个配置, 然后：

```bash
umount /tmp/boot
```

这样系统就可以正常启动了，但是还没完

/boot 里的文件都是自动生成的，每次更新内核或者手动执行 `grub2-mkconfig`， 会被覆盖掉，所以还需要修改原始的 grub 配置文件，

vim /etc/default/grub

```bash
GRUB_TIMEOUT=5
GRUB_DISTRIBUTOR="$(sed 's, release .*$,,g' /etc/system-release)"
GRUB_DEFAULT=saved
GRUB_DISABLE_SUBMENU=true
GRUB_TERMINAL_OUTPUT="console"
GRUB_CMDLINE_LINUX="rd.lvm.lv=centos/root biosdevname=0 net.ifnames=0 rhgb quiet"
GRUB_DISABLE_RECOVERY="true"
```

把这里和 swap 相关的 `rd.lvm.lv=centos/swap` 配置删除, 然后重新生成一下配置文件

```bash
grub2-mkconfig -o /boot/grub2/grub.cfg
```

关系是：

```bash
/etc/default/grub  +  /etc/grub.d/*  -->  /etc/grub.cfg  -->  /boot/grub2/grub.cfg
```

所以修改 grub 配置，只需要修改 `/etc/default/grub` 即可。