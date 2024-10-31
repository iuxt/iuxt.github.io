---
title: vagrant常见报错解决方案
abbrlink: 1e258e64
categories:
  - 工具
tags:
  - Vagrant
  - VirtualMachine
date: 2021-11-30 18:29:52
---

vagrant 是一款虚拟机管理工具，可以通过代码来控制虚拟机的状态，帮助提升开发效率

## 提示 umount: /mnt: not mounted

> 出现这种情况一般是由于安装了 `vagrant-vbguest` 插件, 但是这个插件并不能自动帮助我们安装 vbguest
> 这种情况可能是由于内核版本比较低导致的

- 方案 1: 升级内核
    vagrantfile 增加一行

    ```ruby
    config.vbguest.installer_options = { allow_kernel_upgrade: true }
    ```

- 方案 2: 降级 vagrant-vbguest

  ```bash
  vagrant plugin uninstall vagrant-vbguest
  vagrant plugin install vagrant-vbguest --plugin-version 0.21
  ```

## 报错网段不在 nat 网段里面

vagrantfile 添加 `virtualbox__intnet` 参数

```ruby
node.vm.network "private_network", ip: "10.0.0.12", virtualbox__intnet: true
```

## 常见报错

> Stderr: VBoxManage: error: Could not find the VirtualBox Remote Desktop Extension library
> 需要安装 `LibVNCServer-devel`
