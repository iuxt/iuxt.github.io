---
title: Linux磁盘管理
categories:
  - 基础运维
tags: [扩容, 磁盘, 挂载, 格式化, 分区]
abbrlink: stmd3s
date: 2022-03-24 16:33:27
cover: ""
updated: 2025-03-28 11:18:41
---

{% note warning flat %}
数据无价，谨慎操作！
切忌直接复制粘贴！
测试环境验证通过再上生产！
{% endnote %}

## 准备工作

```bash
# 列出块设备、挂载点等，一般查看磁盘信息
lsblk

# 创建目录
mkdir /es-data2 /es-data1 /es-logs
chown -R elasticsearch:elasticsearch /es-data2 /es-data1 /es-logs

# 查看挂载点、磁盘占用大小等。
df -hT
```

## parted 命令

### 设置磁盘为 gpt 分区表

如果是大磁盘（大于 2T），建议使用 GPT 分区表。
如果是小磁盘，只要机器不是太老，也建议使用 GPT 分区表。mbr 该被淘汰了。

```bash
sudo parted /dev/vdb --script mklabel gpt
```

### 创建分区

```bash
# 创建分区，标识为ext4(不会真正格式化)
sudo parted /dev/vdb mkpart primary ext4 0% 100%
# 创建指定大小的分区
# sudo parted /dev/sdX mkpart primary ext4 1MiB 50GiB
```

> primary：主分区（GPT 分区表可省略）
> ext4：文件系统类型，可选 ext4, xfs, ntfs 等
> 1MiB 50GiB：起始位置和结束位置

### 查看分区表

```bash
sudo parted /dev/vdb print
```

### 其他常用操作

```bash
# 删除分区 1
parted /dev/sdX rm 1

# 调整分区大小，调整分区 1 的大小至 100GiB。
parted /dev/sdX resizepart 1 100GiB
```

## 格式化与手动挂载

```bash
# 格式化分区为ext4文件系统
sudo mkfs.ext4 /dev/vdb1

# 手动挂载到指定的路径，临时使用，建议使用下面的自动挂载。
# sudo mount /dev/vdb1 /es-data2
```

## 配置自动挂载

{% tabs TabName %}

<!-- tab 使用UUID挂载(推荐) -->

```bash
# 查看块设备的UUID
sudo blkid /dev/vdb1
```

`vim /etc/fstab`

```bash
# 格式：UUID=<UUID> <挂载点> <文件系统类型> <挂载选项> <dump> <fsck>
UUID=c35edad4-2d9b-4adc-b107-aeecbcae416e /es-data2 ext4    defaults,nofail 0 0
```

参数解释

```bash
UUID:          分区的唯一标识符（比设备名更稳定）。
挂载点:        新磁盘挂载的目标目录（如 /mnt/data）。
文件系统类型:  分区的格式（如 ext4、xfs、ntfs 等）。

挂载选项:
defaults:      包含读写、执行等基本权限。
nofail:        启动时如果磁盘不存在，忽略错误（防止系统无法启动）。
dump:          备份工具 dump 的标记（通常设为 0）。
fsck:          文件系统检查顺序（0 表示不检查，根分区设为 1，其他数据盘设为 0 或 2）。
```

<!-- endtab -->

<!-- tab 使用设备路径挂载 -->

`vim /etc/fstab`

```bash
/dev/vdb1 /es-data2 ext4 defaults,nofail 0 0
```

<!-- endtab -->

{% endtabs %}

### 测试自动挂载

```bash
sudo mount -a
```
