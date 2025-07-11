---
title: 在 Hyper-V 下启用 Fedora 41 的增强会话模式
categories:
  - 工具
tags: []
abbrlink: ssqj2c
date: 2025-03-07 11:58:59
cover: https://s3.babudiu.com/iuxt/images/20250328110319656.png
updated: 2025-03-28 11:05:24
---

## 安装一些基础包

```bash
sudo dnf install -y hyperv-tools
sudo dnf install -y xrdp xrdp-selinux
```

## 配置 Fedora

```bash
systemctl enable xrdp
systemctl enable xrdp-sesman

# use vsock transport.
sed -i_orig -e 's/port=3389/port=vsock:\/\/-1:3389/g' /etc/xrdp/xrdp.ini
# use rdp security.
sed -i_orig -e 's/security_layer=negotiate/security_layer=rdp/g' /etc/xrdp/xrdp.ini
# remove encryption validation.
sed -i_orig -e 's/crypt_level=high/crypt_level=none/g' /etc/xrdp/xrdp.ini
# disable bitmap compression since its local its much faster
sed -i_orig -e 's/bitmap_compression=true/bitmap_compression=false/g' /etc/xrdp/xrdp.ini
# rename the redirected drives to 'shared-drives'
sed -i_orig -e 's/FuseMountName=thinclient_drives/FuseMountName=shared-drives/g' /etc/xrdp/sesman.ini

# Change the allowed_users
echo "allowed_users=anybody" > /etc/X11/Xwrapper.config

#Ensure hv_sock gets loaded
if [ ! -e /etc/modules-load.d/hv_sock.conf ]; then
	echo "hv_sock" > /etc/modules-load.d/hv_sock.conf
fi

# Open port
firewall-cmd --add-port=3389/tcp --permanent
firewall-cmd --reload
```

## 配置 Hyper-V 虚拟机

将 Fedora 关机，以**管理员**身份运行 powershell：

```powershell
Set-VM -VMName <your_vm_name> -EnhancedSessionTransportType HvSocket
```

## 引用

代码来自：<https://github.com/hu-ximing/Hyper-V-RHEL-Fedora-enhanced-session/>
