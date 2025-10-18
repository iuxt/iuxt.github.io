---
date: 2025-10-18 15:40:27
updated: 2025-10-18 15:41:20
---

```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Users\zhanglikun\bin", "User")


[Environment]::SetEnvironmentVariable("KUBECONFIG", "C:\Users\zhanglikun\kubeconfig\prod1-kubeconfig.txt", "User")
[Environment]::SetEnvironmentVariable("KUBECONFIG", "C:\Users\zhanglikun\kubeconfig\prod2-kubeconfig.txt", "User")
[Environment]::SetEnvironmentVariable("KUBECONFIG", "C:\Users\zhanglikun\kubeconfig\staging-kubeconfig.txt", "User")


```

关闭命令行窗口，重新打开即可生效。
