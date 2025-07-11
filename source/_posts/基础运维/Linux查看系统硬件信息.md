---
title: Linux查看系统硬件信息
abbrlink: 6a0f629b
cover: 'https://s3.babudiu.com/iuxt/public/linux.svg'
categories:
  - 基础运维
tags:
  - Linux
  - 硬件信息
date: 2022-09-03 20:15:24
---

## CPU

查看 cpu 型号

```bash
cat /proc/cpuinfo |grep "model name"
```

查看 CPU 核心数

```bash
cat /proc/cpuinfo |grep "cpu cores"
```

查看 cpu 支不支持 aes(结果有 aes 即为支持)

```bash
grep -m1 -o aes /proc/cpuinfo
```

## 内存

查看内存大小

```bash
cat /proc/meminfo |grep MemTotal
```

查看内存型号，插槽

```bash
dmidecode -t memory | grep "Size:"
```

## 硬盘

查看硬盘

```bash
fdisk -l |grep Disk
```

查看挂载、分区

```bash
sudo lsblk
```

查看软 raid 状态

```bash
cat /proc/mdstat
```

## PCI 设备

查看 pci 设备

```bash
lspci -tv
```

## 网卡

查看网卡 crc 校验错误数：

```bash
ethtool -S ens1f1 | grep rx_crc_errors:
```

如果数量一致增大，就是有问题

dmesg 可以查看网卡 down 和 up 的情况
