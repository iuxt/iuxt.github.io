---
title: Linux虚拟内存swap
abbrlink: '25938561'
cover: 'https://static.zahui.fan/public/linux.svg'
categories:
  - 基础运维
tags:
  - Linux
date: 2021-05-27 20:52:22
---

## 增加 swap(文件)

### 创建 swap

生成一个空文件（2048M）

```bash
# 创建一个2G的swap文件
sudo fallocate -l 4G /swapfile

# 或者使用dd命令来创建，建议用fallocate，是瞬间生成的，不像dd真的要写入文件内容。
# sudo dd if=/dev/zero of=/swapfile bs=1M count=2048

sudo chmod 600 /swapfile
```

标记成 swap 文件

```bash
sudo mkswap /swapfile
```

### 手动挂载 swap

```bash
挂载： 
sudo swapon /swapfile

卸载： 
sudo swapoff /swapfile
```

### 开机自动挂载

`vim /etc/fstab` 添加一行

```bash
/swapfile   swap  swap  defaults  0  0
```

## 删除 swap(文件)

### 查看 swap 文件地址

```bash
swapon
```

### 手动关闭 swap

```bash
sudo swapoff /swapfile
```

### 删除 swap 文件

```bash
sudo rm -f /swapfile
```

### 取消开机自动挂载

`vim /etc/fstab`, 删除包含 `swapfile` 的一行

## 删除 swap（LVM 分区）

### 判断是否是 LVM 分区

LVM 分区做 swap，如果你用 centos7 默认安装的话， 就是用的 LV 做 swap，可以 `cat /etc/fstab` 和 `lvdisplay` 确认下
![image.png](https://static.zahui.fan/images/202404241305360.png)

![image.png](https://static.zahui.fan/images/202404241305675.png)

上图所示， 就是用的 lv 做 swap 分区

### 关闭 swap

马上关闭：

```bash
swapoff -a
```

修改配置永久关闭：
`vim /etc/fstab` 删除包含 swap 的那一行

保守一点，如果 swap 占用空间不要了，lvm 也不动了，那么就到此为止就行。

### 删除 swap 的 LV

```bash
# lvremove <vg名字> <lv名字>
lvremove centos swap
```

扩容剩下的 LV

```bash
lvextend -l +100%FREE /dev/mapper/centos-root
```

动态增加磁盘大小
{% tabs 调整文件系统大小 %}

<!-- tab ext文件系统 -->

```bash
sudo resize2fs  /dev/sdb1
```

<!-- endtab -->

<!-- tab xfs文件系统 -->

```bash
sudo xfs_growfs /dev/sdb1
```

<!-- endtab -->

<!-- tab RHEL -->

在早期的 RHEL 中，由于 resize2fs 无在线 resize 功能，故额外提供了 ext2online。

```bash
sudo ext2online /dev/sdb1
```

<!-- endtab -->
{% endtabs %}

### 修改内核参数

CentOS7 系统修改 `/etc/default/grub`

![image.png](https://static.zahui.fan/images/202404241418956.png)

然后执行:

```bash
grub2-mkconfig -o /boot/grub2/grub.cfg
```

更新 grub 配置

如果你已经删除了 LV，但是忘记修改内核参数了，那么重启后会无法启动，解决方法见：[centos删除swap后无法启动](/posts/scfoaz/)

## 调整内核 swap 策略

swap 使用是根据内核参数 `vm.swappiness` 决定的， 数值越大表示内核会更加积极的将内存中的数据移动到 Swap 分区

| vm.swappiness | 含义                 |
| ------------- | ------------------ |
| 0             | 指示内核尽可能避免交换。       |
| 10-50         | 指示内核在换出内存页面时稍微积极一些 |
| 50-100        | 指示内核在换出内存页面时适度积极   |
| 100           | 指示内核在换出内存页面时非常积极   |

### 查看内核参数

```bash
sysctl -a
sysctl vm.swappiness
```

### 临时修改

#### 方法一

```bash
 sysctl vm.swappiness=100
```

#### 方法二

```bash
echo "100" > /proc/sys/vm/swappiness
```

### 永久修改

`vim /etc/sysctl.conf`

```bash
vm.swappiness = 100
```

执行 `sysctl -p` 马上生效。