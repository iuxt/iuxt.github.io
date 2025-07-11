---
title: 将wsl里的文件挂载进虚拟机
abbrlink: 49e7e3c2
cover: 'https://s3.babudiu.com/iuxt/public/wsl.svg'
categories:
  - Windows
tags:
  - VirtualMachine
  - WSL
  - Windows
  - Crontab
date: 2021-12-16 19:34:45
---

> 虽然不同操作系统使用起来大致类似，很多开源软件同时支持 [Linux](/tags/linux/) 和 [Windows](/tags/windows/)，就算不支持，Windows 还有 [cygwin](/tags/cygwin/) 或 [WSL](/tags/wsl/)，Linux 也有 wine，但是我感觉这两种系统最大的区别还是文件系统，比如将 Linux 下的文件复制到 Windows，然后再复制回 Linux，得到的文件和原来的是一样的吗，答案是否定的，因为文件权限可能已经发生了变化，另外 Windows 的 NTFS 大小写不敏感，导致很多时候从 Linux 复制文件到 Windows 的时候总会弹个窗问我是否覆盖，还有 Linux 的软链接也无法复制到 Windows 里面。
> 本人平时写代码等都是在 linux 上运行的，不过最近系统换成了 Windows，为了避免以上问题，将文件放进了 WSL 里面，同时用到了虚拟机做测试，所以想将 wsl 和虚拟机的目录进行同步，才有了这篇文章。

## 在 Windows 环境下找到想要共享的目录

> 以下 3 种都可以

- 在 Windows 下可以这样访问 WSL`\\wsl$\发行版名`，比如 `\\wsl$\Ubuntu`，将完整的链接复制下来。
- 将 `\wsl$\Ubuntu` 映射到一个虚拟盘符，比如 Z:，这种方法可以用在比如 [vagrant](/tags/vagrant/) 上面

## 配置虚拟机开启共享文件夹

- VMware Workstation 虚拟机

    虚拟机设置 - 选项 - 共享文件夹 填写上一步获取到的路径
    期间会弹出提示《路径指向网络位置，请确保其在运行虚拟机时可供访问》，忽略即可。

- Virtualbox 虚拟机

    虚拟机设置 - 共享文件夹 - 固定分配, 挂载点留空，进系统手动挂载

## 虚拟机里挂载目录

- VMware Workstation 虚拟机
    需要先安装 `open-vm-tools`，然后编写个脚本 `mount_hgfs.sh`：

    ```bash
    #!/bin/bash
    /usr/bin/vmhgfs-fuse .host:/modules /etc/puppetlabs/code/modules -o subtype=vmhgfs-fuse,allow_other
    /usr/bin/vmhgfs-fuse .host:/manifests /etc/puppetlabs/code/environments/production/manifests -o subtype=vmhgfs-fuse,allow_other
    ```

    > allow_other 添加的话，挂载后的目录权限为 777，即所有人可读写，不加的话仅 root 可读写，其他人不可读写。
    > .host:/xxx 这个是共享名，是在 VMware 软件界面填写的，可以通过命令 `vmware-hgfsclient` 查看。

- Virtualbox 虚拟机
    也需要安装 virtual guest tools，不过可以使用 mount 命令挂载，也可以修改 fstab 自动挂载

    ```conf
    etc_puppetlabs_code_modules /etc/puppetlabs/code/modules vboxsf dmode=775,fmode=644,_netdev,uid=0,gid=0,_netdev 0 0
    etc_puppetlabs_code_environments_production_manifests /etc/puppetlabs/code/environments/production/manifests vboxsf dmode=775,fmode=644,_netdev,uid=0,gid=0,_netdev 0 0
    ```

## 开机自启动挂载

- VMware Workstation 虚拟机

    修改 root 的 crontab

    ```bash
    @reboot /root/mount_hgfs.sh
    ```

- Virtualbox 虚拟机
    通过 fstab 来挂载。
