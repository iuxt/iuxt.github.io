---
title: Linux磁盘管理
categories:
  - 基础运维
tags: [扩容, 磁盘, 挂载, 格式化, 分区]
abbrlink: stmd3s
date: 2022-03-24 16:33:27
cover: ""
updated: 2025-03-24 19:22:50
---

```bash
lsblk

mkdir /es-data2 /es-data1 /es-logs
chown -R elasticsearch:elasticsearch /es-data2 /es-data1 /es-logs

sudo parted /dev/vdb --script mklabel gpt
sudo parted /dev/vdb mkpart primary ext4 0% 100%
sudo parted /dev/vdb print

sudo mkfs.ext4 /dev/vdb1

sudo mount /dev/vdb1 /es-data2

df -hT

sudo blkid /dev/vdb1

```

```bash
# 格式：UUID=<UUID> <挂载点> <文件系统类型> <挂载选项> <dump> <fsck>
UUID=c35edad4-2d9b-4adc-b107-aeecbcae416e /es-data2 ext4    defaults,nofail 0 0
/dev/vdb1 /es-data2 ext4    defaults,nofail 0 0
```

参数解释
UUID: 分区的唯一标识符（比设备名更稳定）。
挂载点: 新磁盘挂载的目标目录（如 /mnt/data）。
文件系统类型: 分区的格式（如 ext4、xfs、ntfs 等）。
挂载选项:
defaults: 包含读写、执行等基本权限。
nofail: 启动时如果磁盘不存在，忽略错误（防止系统无法启动）。
dump: 备份工具 dump 的标记（通常设为 0）。
fsck: 文件系统检查顺序（0 表示不检查，根分区设为 1，其他数据盘设为 0 或 2）。
sudo mount -a 测试挂载
