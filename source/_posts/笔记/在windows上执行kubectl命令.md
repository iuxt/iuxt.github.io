---
date: 2025-10-18 15:40:27
updated: 2025-10-18 15:55:33
---

永久生效（写入注册表，User 级别，不需要管理员权限。Machine 级别的需要管理员权限）

```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Users\zhanglikun\bin", "User")


[Environment]::SetEnvironmentVariable("KUBECONFIG", "C:\Users\zhanglikun\kubeconfig\prod1-kubeconfig.txt", "User")
[Environment]::SetEnvironmentVariable("KUBECONFIG", "C:\Users\zhanglikun\kubeconfig\prod2-kubeconfig.txt", "User")
[Environment]::SetEnvironmentVariable("KUBECONFIG", "C:\Users\zhanglikun\kubeconfig\staging-kubeconfig.txt", "User")


```

关闭命令行窗口，重新打开即可生效。

在当前控制台生效：

```powershell
$env:KUBECONFIG = "C:\Users\zhanglikun\kubeconfig\prod1-kubeconfig.txt"

```
