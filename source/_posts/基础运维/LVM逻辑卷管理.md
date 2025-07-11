---
title: LVM逻辑卷管理
abbrlink: f4ea28c3
categories:
  - 基础运维
tags: [Linux, 配置记录, Disk, 扩容, 分区, 挂载, 格式化, 磁盘]
date: 2021-05-11 22:24:43
updated: 2025-03-24 19:23:15
---

LVM 是 `Logical Volume Manager` 的缩写，中文逻辑卷管理，LVM 是建立在磁盘分区和文件系统之间的一个逻辑层，LVM 会更加灵活，可以动态扩容缩容分区大小。调整分区大小有风险，请做好充分测试再决定是否执行。
如果没有启用 `lvm`，请查看 [linux磁盘扩容 - 非LVM](/33420276/)
那么怎么知道机器有没有启用 LVM 呢，可以执行 `sudo lvdisplay` 查看有没有已存在的 LV，对比 `df -hT` 里面的 `Filesystem`，也可以用 `lsblk` 查看有没有 lvm。

{% note warning simple %}
记住一点， 如果你的磁盘没有分区并已经在使用中， 那么千万不要使用 fdisk 来分区，会损坏数据！！！
{% endnote %}

## LVM 的一些概念

PV： 物理卷，比如一个分区，一个磁盘
VG： 卷组，将多个 PV 整合在一起，形成一个大的池子
LV： 逻辑卷，从 VG 划分出来一个个空间，可以当作分区来看待，可以格式化，可以挂载

### 常用命令

|        | 查看  | 查看详细信息    | 扩展       | 创建       |
| ------ | --- | --------- | -------- | -------- |
| 卷组 VG  | vgs | vgdisplay | vgextend | vgcreate |
| 逻辑卷 LV | lvs | lvdisplay | lvextend | lvcreate |
| 物理卷 PV | pvs | pvdisplay | pvresize | pvcreate |

## 扩容文件系统

### 物理扩容

> 虚拟机扩容就是扩容虚拟磁盘，物理机扩容比如可以增加硬盘。

{% tabs TabName %}

<!-- tab 创建新的PV -->

> 如果是新增硬盘，只能创建新的 PV

{% subtabs subtabs5 %}

<!-- tab 创建新分区 -->

![image.png](https://s3.babudiu.com/iuxt/images/202404261039315.png)

> 这里有个疑问，如果不设置分区 ID 为 `8e`，也不影响后续操作，但是 `fdisk -l /dev/sda` 的时候，查看到的新分区 Type 为 Linux，而不是 Linux LVM，不知道这两种有什么不同，知道的大佬麻烦告诉我一下。。

创建 pv

```shell
pvcreate /dev/vdb1
pvdisplay
```

添加 PV 到 VG

```shell
vgextend vg1 /dev/vdb1
```

> 添加完成 `sudo vgdisplay` 可以看到 `Free PE / Size` 的空间大小

<!-- endtab -->

<!-- tab 不分区直接使用裸设备 -->

```bash
pvcreate /dev/vdb
pvdisplay
```

添加 PV 到 VG

```shell
vgextend vg1 /dev/vdb
```

> 添加完成 `sudo vgdisplay` 可以看到 `Free PE / Size` 的空间大小

<!-- endtab -->

{% endsubtabs %}

<!-- endtab -->

<!-- tab 扩展现有的PV -->

> 如果虚拟机是通过扩容现有硬盘的方式来扩容，可以扩展现有 PV，如果是新增的硬盘，只能新建 PV 来扩容

安装 cloud-utils

```bash
# Ubuntu和Debian
sudo apt install cloud-guest-utils

# CentOS和RHEL
sudo yum install cloud-utils-growpart
```

如何判断 pv 是一个设备还是一个分区

![image.png](https://s3.babudiu.com/iuxt/images/202404252228062.png)

{% subtabs subtabs2 %}

<!-- tab PV是一个分区 -->

```bash
growpart /dev/vdb 1
pvs
```

<!-- endtab -->

<!-- tab PV是一个磁盘设备 -->

```bash
pvresize /dev/vdb
```

<!-- endtab -->

{% endsubtabs %}

<!-- endtab -->
{% endtabs %}

### 创建或扩展 LV

{% tabs TabName %}

<!-- tab 扩展现有的LV -->

```bash
lvextend /dev/mapper/vg1-lv1 /dev/sda4
lvextend -l +100%FREE /dev/mapper/vg1-lv1
lvextend -L +1024M /dev/mapper/vg1-lv1
```

<!-- endtab -->

<!-- tab 创建新的LV -->

```bash
# 创建一个指定大小的lv，并指定名字为lv2
lvcreate -L 2G -n lv2 vg1

# 创建一个占全部卷组大小的lv，并指定名字为lv3
lvcreate -l 100%VG -n lv3 vg1

# 创建一个空闲空间80%大小的lv，并指定名字为lv4
lvcreate -l 80%Free -n lv4 vg1
```

<!-- endtab -->
{% endtabs %}

### 格式化并挂载

> 新创建的 `LV` 类似于硬盘分区，需要格式化后再挂载

格式化

```bash
mkfs.xfs /dev/mapper/vg1-lv1
```

挂载

{% tabs TabName %}
<!-- tab 手动挂载 -->

```bash
mount /dev/mapper/vg1-lv1 /opt
```

<!-- endtab -->

<!-- tab fstab自动挂载 -->

```bash
/dev/mapper/vg1-lv1 /opt xfs defaults 0 0
```

<!-- endtab -->
{% endtabs %}

### 调整文件系统大小

{% tabs 文件系统大小 %}

<!-- tab ext文件系统 -->

```bash
sudo resize2fs /dev/mapper/vg1-lv1
```

<!-- endtab -->

<!-- tab xfs文件系统 -->

```bash
sudo xfs_growfs /dev/mapper/vg1-lv1
```

<!-- endtab -->

<!-- tab RHEL -->

在早期的 RHEL 中，由于 resize2fs 无在线 resize 功能，故额外提供了 ext2online。

```bash
sudo ext2online /dev/mapper/vg1-lv1
```

<!-- endtab -->
{% endtabs %}

## 缩小文件系统

1. 卸载文件系统

    ```bash
    umount /dev/vg_name/lv_name
    ```

2. 检查文件系统是否有错误

    ```bash
    e2fsck -f /dev/vg0/lvm1
    ```

3. 调整文件系统大小

    ```bash
    resize2fs /dev/vg0/lvm1 10G
    ```

4. 调整 LV 的大小

   ```bash
   lvreduce -L 10G /dev/vg0/lvm1
   ```

5. 重新挂载 LV

    ```bash
    mount /dev/vg0/lvm1 /lvm1
    ```

## 移除 PV

> 比如某个 PV 对应的硬盘损坏，需要更换，比如需要更换 `/dev/sdb`

1. 查看 pv 使用情况

    ```bash
    sudo pvdisplay
    ```

    查看对应的 PV 参数 `Allocated PE`，若不为 0 表示有逻辑卷在使用，需要使用 `pvmove /dev/sdb` 将数据转移到其他空闲的 PV 上面

2. 将 PV 从 VG 移出

    ```bash
    vgreduce vg_name /dev/sdb
    ```

3. 移除 PV

    ```bash
    pvremove /dev/sdb
    ```

4. 更换硬盘，然后重新创建 PV，添加 VG 等
