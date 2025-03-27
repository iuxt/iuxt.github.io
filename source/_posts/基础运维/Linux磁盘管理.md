---
title: Linux磁盘管理
categories:
  - 基础运维
tags: [扩容, 磁盘, 挂载, 格式化, 分区]
abbrlink: stmd3s
date: 2022-03-24 16:33:27
cover: ""
updated: 2025-03-25 19:30:27
---

```bash
# 列出块设备、挂载点等，一般查看磁盘信息
lsblk

# 创建目录
mkdir /es-data2 /es-data1 /es-logs
chown -R elasticsearch:elasticsearch /es-data2 /es-data1 /es-logs

# 设置磁盘为gpt分区表
sudo parted /dev/vdb --script mklabel gpt

# 创建分区，标识为ext4(不会真正格式化)
sudo parted /dev/vdb mkpart primary ext4 0% 100%

# 查看分区表
sudo parted /dev/vdb print

# 格式化分区为ext4文件系统
sudo mkfs.ext4 /dev/vdb1

# 手动挂载到指定的路径
sudo mount /dev/vdb1 /es-data2

# 查看挂载点、磁盘占用大小等。
df -hT


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