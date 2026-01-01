---
title: 容器调试工具之BusyBox
categories:
  - 容器
tags: [容器, 记录, busybox]
abbrlink: t79irt
date: 2025-12-14 21:57:28
cover: ""
updated: 2025-12-14 22:47:12
---

很早之前我在上学的时候给安卓手机刷机，root 后还可以安装了个号称 Linux 瑞士军刀的 App，不过没搞懂有什么用，不过记住了这个特别的名字 -- BusyBox

## BusyBox 是什么

BusyBox 是一款超轻量级的 Linux 工具集，也被称为 “Linux 瑞士军刀”—— 它把数百个常用的 Linux 命令（如 ls、cat、ps、telnet、unzip 等）打包进一个单一的可执行文件，体积仅 1-2MB，且支持静态编译，是嵌入式 Linux、精简系统、应急运维场景的 “神器”。

### 下载地址

官方编译好的可执行文件：<https://busybox.net/downloads/binaries/1.35.0-x86_64-linux-musl/>， 可以下载主文件 `busybox`，也可以下载单个命令使用。

## BusyBox 使用方法

### 包含的命令

```bash
BusyBox v1.35.0 (2022-01-17 19:57:02 CET) multi-call binary.
BusyBox is copyrighted by many authors between 1998-2015.
Licensed under GPLv2. See source distribution for detailed
copyright notices.

Usage: busybox [function [arguments]...]
   or: busybox --list[-full]
   or: busybox --show SCRIPT
   or: busybox --install [-s] [DIR]
   or: function [arguments]...

	BusyBox is a multi-call binary that combines many common Unix
	utilities into a single executable.  Most people will create a
	link to busybox for each function they wish to use and BusyBox
	will act like whatever it was invoked as.

Currently defined functions:
	[, [[, acpid, add-shell, addgroup, adduser, adjtimex, ar, arch, arp, arping, ascii, ash, awk, base32, base64, basename, bc, blkdiscard, blkid, blockdev, bootchartd,
	brctl, bunzip2, bzcat, bzip2, cal, cat, chat, chattr, chgrp, chmod, chown, chpasswd, chpst, chroot, chrt, chvt, cksum, clear, cmp, comm, conspy, cp, cpio, crc32, crond,
	crontab, cryptpw, cttyhack, cut, date, dc, dd, deallocvt, delgroup, deluser, depmod, devmem, df, dhcprelay, diff, dirname, dmesg, dnsd, dnsdomainname, dos2unix, dpkg,
	dpkg-deb, du, dumpkmap, dumpleases, echo, ed, egrep, eject, env, envdir, envuidgid, expand, expr, factor, fakeidentd, fallocate, false, fatattr, fbset, fbsplash,
	fdflush, fdformat, fdisk, fgconsole, fgrep, find, findfs, flash_eraseall, flash_lock, flash_unlock, flashcp, flock, fold, free, freeramdisk, fsck, fsck.minix, fsfreeze,
	fstrim, fsync, ftpd, ftpget, ftpput, fuser, getopt, getty, grep, groups, gunzip, gzip, halt, hd, hdparm, head, hexdump, hexedit, hostid, hostname, httpd, hush, hwclock,
	i2cdump, i2cget, i2cset, i2ctransfer, id, ifconfig, ifenslave, ifplugd, inetd, init, inotifyd, insmod, install, ionice, iostat, ip, ipaddr, ipcalc, ipcrm, ipcs, iplink,
	ipneigh, iproute, iprule, iptunnel, kbd_mode, kill, killall, killall5, klogd, last, less, link, linux32, linux64, linuxrc, ln, loadfont, loadkmap, logger, login,
	logname, losetup, lpd, lpq, lpr, ls, lsattr, lsmod, lsof, lspci, lsscsi, lsusb, lzcat, lzma, lzop, lzopcat, makedevs, makemime, man, md5sum, mdev, mesg, microcom, mim,
	mkdir, mkdosfs, mke2fs, mkfifo, mkfs.ext2, mkfs.minix, mkfs.reiser, mkfs.vfat, mknod, mkpasswd, mkswap, mktemp, modinfo, modprobe, more, mount, mountpoint, mpstat, mt,
	mv, nameif, nbd-client, nc, netstat, nice, nl, nmeter, nohup, nologin, nproc, nsenter, nslookup, ntpd, nuke, od, openvt, partprobe, passwd, paste, patch, pgrep, pidof,
	ping, ping6, pipe_progress, pivot_root, pkill, pmap, popmaildir, poweroff, powertop, printenv, printf, ps, pscan, pstree, pwd, pwdx, raidautorun, rdate, rdev, readlink,
	readprofile, realpath, reboot, reformime, remove-shell, renice, reset, resize, resume, rev, rm, rmdir, rmmod, route, rpm, rpm2cpio, rtcwake, run-init, run-parts,
	runlevel, runsv, runsvdir, rx, script, scriptreplay, sed, sendmail, seq, setarch, setconsole, setfattr, setfont, setkeycodes, setlogcons, setpriv, setserial, setsid,
	setuidgid, sh, sha1sum, sha256sum, sha3sum, sha512sum, showkey, shred, shuf, slattach, sleep, smemcap, softlimit, sort, split, ssl_client, start-stop-daemon, stat,
	strings, stty, su, sulogin, sum, sv, svc, svlogd, svok, swapoff, swapon, switch_root, sync, sysctl, syslogd, tac, tail, tar, taskset, tc, tcpsvd, tee, telnet, telnetd,
	test, tftp, tftpd, time, timeout, top, touch, tr, traceroute, traceroute6, true, truncate, ts, tty, ttysize, tunctl, tune2fs, ubiattach, ubidetach, ubimkvol, ubirename,
	ubirmvol, ubirsvol, ubiupdatevol, udhcpc, udhcpc6, udhcpd, udpsvd, uevent, umount, uname, uncompress, unexpand, uniq, unix2dos, unlink, unlzma, unlzop, unshare, unxz,
	unzip, uptime, users, usleep, uudecode, uuencode, vconfig, vi, vlock, volname, w, wall, watch, watchdog, wc, wget, which, who, whoami, whois, xargs, xxd, xz, xzcat, yes,
	zcat, zcip
```

### 如何使用

#### 直接使用

```bash
# 从我的镜像仓库下载
curl -OL https://s3.babudiu.com/src/linux/bin/busybox && chmod +x busybox

# zip 解压 jar 包
./busybox unzip app.jar

# ps查看进程
./busybox ps aux

# df查看磁盘
./busybox df -h

# ping测试网络
./busybox ping -c 4 baidu.com
```

#### 简化使用

如果想像原生命令一样直接用 busybox 自带的命令，可创建软链接：

```bash
ln -s busybox ps
ln -s busybox df
ln -s busybox /usr/local/bin/ping

# 之后直接调用
./ps aux
./df -h
ping baidu.com
```

## 为什么适合在容器环境下使用

1. 镜像安全问题，容易被各种安全团队扫描到漏洞进行整改，需要尽量少安装各种包。
2. 镜像体积大小问题。
3. 有些容器的基础镜像停止维护（比如老掉牙的 jdk8,基础的操作系统镜像也比较老，想要安装个包很折腾）
