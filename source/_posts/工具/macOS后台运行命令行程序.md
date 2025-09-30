---
title: macOS自定义后台运行程序
categories:
  - 工具
tags: ['']
abbrlink: t3e151
date: 2025-09-30 14:10:12
cover: ''
updated: 2025-09-30 15:23:39
---

在 macOS 中运行命令行程序，如果你不想开一个终端窗口，并且希望实现开机自启动等等功能，可以使用 macOS 自带的服务管理。这里以 easytier 这个组网工具为例：

直接执行的命令是：`/usr/local/bin/easytier-core -c /Users/iuxt/config/easytier.toml`

## 创建 plist 配置文件

`vim /Library/LaunchDaemons/easytier.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated for serviceman. Edit as needed. Keep this line for 'serviceman list'. -->
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>easytier</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/easytier-core</string>
        <string>-c</string>
        <string>/Users/iuxt/config/easytier.toml</string>
    </array>

    <key>UserName</key>
    <string>root</string>
    <key>GroupName</key>
    <string>wheel</string>
    <key>InitGroups</key>
    <true/>

    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>

    <key>WorkingDirectory</key>
    <string>/usr/local/bin</string>

    <key>StandardOutPath</key>
    <string>/var/log/easytier.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/easytier-error.log</string>
</dict>
</plist>
```

## 配置权限

```bash
sudo chown root:wheel /Library/LaunchDaemons/easytier.plist
sudo chmod 644 /Library/LaunchDaemons/easytier.plist
```

## 启动

```bash
sudo launchctl bootstrap system /Library/LaunchDaemons/easytier.plist
```
