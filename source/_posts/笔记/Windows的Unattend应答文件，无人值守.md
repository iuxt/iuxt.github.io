---
date: 2025-02-17 16:08:53
updated: 2025-02-18 17:28:15
---

```powershell
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

```

```powershell
DISM.exe /Image:<path_to_image_directory> /Apply-Unattend:<path_to_unattend.xml>

```

在挂载后的 wim 里增加 appx 安装（系统级别，每个创建的新用户都有）

```powershell
Add-AppxProvisionedPackage -Path "C:\Mount" -PackagePath "C:\YourApp.appx" -SkipLicense
Get-AppxProvisionedPackage -Online
```

用户级别的安装 appx

```powershell
Add-AppxPackage -Path C:\init\Microsoft.VCLibs.140.00_14.0.30704.0_x86.Appx
Get-AppxPackage
```
