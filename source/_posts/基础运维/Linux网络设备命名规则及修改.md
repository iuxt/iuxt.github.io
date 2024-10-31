---
title: Linux网络设备命名规则及修改
abbrlink: 69bcc649
cover: 'https://static.zahui.fan/public/linux.svg'
categories:
  - 基础运维
tags:
  - Linux
  - Network
date: 2021-10-22 16:39:28
---

## 命名规则

centos 从 7 开始网卡名称默认不再是熟悉的 eth0、而是类似于 ens33、enps0f0 等
[rhel7官方文档](https://access.redhat.com/documentation/zh-cn/red_hat_enterprise_linux/7/html/networking_guide/ch-consistent_network_device_naming)

### 这么做的好处是

在 Red Hat Enterprise Linux 7 中，udev 支持大量不同的命名方案。默认是根据固件、拓扑及位置信息分配固定名称。这样做的优点是命名可完全自动进行，并可预期，即使添加或删除硬件后也会保留其名称（不会出现重复枚举的情况），同时可顺利更换损坏的硬件。不足之处是，相比传统的名称，比如 eth0 或 wlan0，这些名称有时会比较难理解。例如：enp5s0。

### 设备命名的过程

1. `/usr/lib/udev/rules.d/60-net.rules` 文件中的规则会让 udev 帮助工具 `/lib/udev/rename_device` 查看所有 `/etc/sysconfig/network-scripts/ifcfg-suffix` 文件。如果发现包含 HWADDR 条目的 ifcfg 文件与某个接口的 MAC 地址匹配，它会将该接口重命名为 ifcfg 文件中由 DEVICE 指令给出的名称。
2. `/usr/lib/udev/rules.d/71-biosdevname.rules` 中的规则让 biosdevname 根据其命名策略重命名该接口，即在上一步中没有重命名该接口、已安装 biosdevname、且在 boot 命令行中将 `biosdevname=0` 作为内核命令给出。
3. `/lib/udev/rules.d/75-net-description.rules` 中的规则让 udev 通过检查网络接口设备，填写内部 udev 设备属性值 ID_NET_NAME_ONBOARD、ID_NET_NAME_SLOT、ID_NET_NAME_PATH。注：有些设备属性可能处于未定义状态。
4. `/usr/lib/udev/rules.d/80-net-name-slot.rules` 中的规则让 udev 重命名该接口，优先顺序如下：ID_NET_NAME_ONBOARD、ID_NET_NAME_SLOT、ID_NET_NAME_PATH。并提供如下信息：没有在步骤 1 或 2 中重命名该接口，同时未给出内核参数 `net.ifnames=0`。如果一个参数未设定，则会按列表的顺序设定下一个。如果没有设定任何参数，则不会重命名该接口。

## 修改网络设备命名

### debian 系、ubuntu 等

vim /etc/default/grub

```ini
# 如果这项有参数了，和现有参数用空格分开
GRUB_CMDLINE_LINUX="net.ifnames=0 biosdevname=0"
```

```bash
sudo update-grub
sudo reboot
```

重启后执行 `ip a` 查看设备名修改成功了没有

然后修改网络：
vim /etc/netplan/xx.yaml

设备名修改后，执行 `netplan try`

### redhat 系、centos 等

vim /etc/sysconfig/grub

```ini
GRUB_CMDLINE_LINUX="... net.ifnames=0 biosdevname=0"
```

然后更新 grub、重启、更改网络配置文件

#### 在安装系统时修改

{% tabs subtabs %}

<!-- tab Debian -->

![image.png](https://static.zahui.fan/images/202404262259986.png)

这个界面按下 `e`

![image.png](https://static.zahui.fan/images/202404262301459.png)

参数添加完成后，按下 `F10` 启动

<!-- endtab -->

<!-- tab CentOS -->

![202401301209674.png|592](https://static.zahui.fan/images/202401301209674.png)

光标放在 install 上， 按下 tab 键， 在 quiet 后面输入 ` net.ifnames=0 biosdevname=0`

<!-- endtab -->

{% endtabs %}

## kickstart 预安装固定设备名

### centos 系

一共有两个地方需要修改

```bash
virt-install \
    --hvm --virt-type kvm \
    --accelerate \
    --name vm-conghua \
    --os-type linux \
    --vcpus 2 \
    --ram 4096 \
    --disk path=/dev/mapper/ssd_data-vm_conghua \
    --network bridge:br13,model=virtio \
    --nographics \
    --location http://cn.archive.ubuntu.com/ubuntu/dists/focal/main/installer-amd64/ \
    --initrd-inject=/tmp/tmp.HotM405TfF/ks.cfg \
    --cpu host \
    --extra-args 'ks=file:/ks.cfg console=tty0 console=ttyS0,115200n8 net.ifnames=0 biosdevname=0'
```

ks.cfg

```kickstart
...
bootloader --location=mbr --driveorder=vda --append=" crashkernel=auto console=ttyS0,115200n8 net.ifnames=0 biosdevname=0"
...
```
