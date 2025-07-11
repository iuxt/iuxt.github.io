---
title: 制作macOS启动盘和dmg镜像
categories:
  - 工具
tags:
  - macOS
  - 配置记录
abbrlink: lrrec490
cover: 'https://s3.babudiu.com/iuxt/public/macos.svg'
date: 2024-01-24 14:20:35
---

## 下载 macOS 安装文件

参考苹果官方文档: <https://support.apple.com/zh-cn/102662>, 使用 App Store 下载即可。下载完成后会显示在应用程序里面

{% tabs TabName %}

<!-- tab 制作dmg磁盘镜像 -->
创建一个空白的 dmg 镜像

打开「磁盘工具」，在顶部菜单选择「文件」>「新建映像」>「空白映像」，然后如下图：

![52260C58-B232-452E-B8C8-FE5B35BBFA45.png](https://s3.babudiu.com/iuxt/images/202401241427615.png)

「大小」的设置，根据安装镜像大小, 再增加 2GB, 我这里粗略设置为 15 GB；
「格式」设置为「Mac OS 扩展（日志式）」；
「分区」为设置为「单个分区 - GUID 分区图」；
「映像格式」为「读/写」；

挂载这个磁盘镜像, 直接双击即可自动挂载。

数据写入到 dmg 磁盘

参考: <https://support.apple.com/zh-cn/101578>

```bash
# 根据你的系统版本和磁盘挂载位置自行修改
sudo /Applications/Install\ macOS\ Ventura.app/Contents/Resources/createinstallmedia --volume /Volumes/MyVolume
```

写入完成后, 推出这个 dmg 磁盘, 一般在访达中就能推出

压缩 dmg 磁盘

上面创建的 dmg 磁盘大小为 15G, 为了保证空间足够写入, 数据量其实没到 15G, 可以压缩一下。 打开「磁盘工具」，顶部菜单选择「映像」>「转换」，选择 macOS.dmg 文件并存储命名为 InstallESD 到桌面：

![B1A330BF-1FEF-48F1-948C-81CD79645DF2.png](https://s3.babudiu.com/iuxt/images/202401241508090.png)

写入 dmg 到 u 盘或移动硬盘 (可选)

可以使用 balenaEtcher(开源跨平台) 来进行写入

<!-- endtab -->

<!-- tab 直接写入到u盘或移动硬盘 -->
直接写入到 u 盘或移动硬盘

参考: <https://support.apple.com/zh-cn/101578>

根据你的系统版本和硬盘挂载位置决定：

```bash
# Sonoma
sudo /Applications/Install\ macOS\ Sonoma.app/Contents/Resources/createinstallmedia --volume /Volumes/MyVolume

# Ventura
sudo /Applications/Install\ macOS\ Ventura.app/Contents/Resources/createinstallmedia --volume /Volumes/MyVolume

# Monterey
sudo /Applications/Install\ macOS\ Monterey.app/Contents/Resources/createinstallmedia --volume /Volumes/MyVolume

# Big Sur
sudo /Applications/Install\ macOS\ Big\ Sur.app/Contents/Resources/createinstallmedia --volume /Volumes/MyVolume

# Catalina
sudo /Applications/Install\ macOS\ Catalina.app/Contents/Resources/createinstallmedia --volume /Volumes/MyVolume

# Mojave
sudo /Applications/Install\ macOS\ Mojave.app/Contents/Resources/createinstallmedia --volume /Volumes/MyVolume

# High Sierra
sudo /Applications/Install\ macOS\ High\ Sierra.app/Contents/Resources/createinstallmedia --volume /Volumes/MyVolume

# El Capitan
sudo /Applications/Install\ OS\ X\ El\ Capitan.app/Contents/Resources/createinstallmedia --volume /Volumes/MyVolume --applicationpath /Applications/Install\ OS\ X\ El\ Capitan.app
```

<!-- endtab -->

{% endtabs %}
