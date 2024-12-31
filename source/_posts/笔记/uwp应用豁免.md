---
date: 2024-12-31 20:18:43
updated: 2024-12-31 20:20:35
---

1. 官方限制解除工具 CheckNetIsolation.exe
这个工具位于 C:/Windows/System32/CheckNetIsolation.exe，它的功能为解除 UWP 的本地 Loopback 限制或者调试应用（本文仅介绍解除 Loopback 限制）。

./CheckNetIsolation.exe LoopbackExempt [operation] [-n=] [-p=]
1
常见用法：

-s: 查看已经取得 Loopback 豁免的应用列表
-a -p=[App Container SID] or -a -n=[App Container Name]: 添加应用豁免
-d -p=[App Container SID] or -d -n=[App Container Name]: 移除应用豁免
-c: 移除所有安装的应用的豁免
————————————————

                            版权声明：本文为博主原创文章，遵循 CC 4.0 BY-SA 版权协议，转载请附上原文出处链接和本声明。
                        
原文链接：<https://blog.csdn.net/sigmarising/article/details/122758568>

```powershell
Get-ChildItem -Path Registry::"HKCU\Software\Classes\Local Settings\Software\Microsoft\Windows\CurrentVersion\AppContainer\Mappings\" -name | ForEach-Object {CheckNetIsolation.exe LoopbackExempt -a -p="$_"}
```

```bat
FOR /F "tokens=11 delims=\" %p IN ('REG QUERY "HKCU\Software\Classes\Local Settings\Software\Microsoft\Windows\CurrentVersion\AppContainer\Mappings"') DO CheckNetIsolation.exe LoopbackExempt -a -p=%p
```
