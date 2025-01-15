---
title: Hyper-V 自动创建虚拟机快照
categories:
  - Windows
tags: [虚拟机, Hyper-V]
abbrlink: sq3s3x
date: 2023-01-15 08:02:21
cover: ""
updated: 2025-01-15 08:05:35
---

首先要允许 PowerShell 执行本地脚本文件：

```powershell
Set-ExecutionPolicy RemoteSigned
```

PowerShell 脚本内容：（文件需要保存成 GB2312 编码，不然中文乱码，执行报错。）

```powershell
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

# 如果不是管理员，以管理员身份重新运行脚本
if (-not $isAdmin) {
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    Exit
}

# 此处放置你的脚本的其余部分
Write-Output "脚本以管理员身份运行"

# 保留的最大快照数量
$maxSnapshots = 14

# 获取所有虚拟机的名称
$vms = Get-VM
foreach ($vm in $vms) {
    Write-Output "为虚拟机 $($vm.Name) 创建定时快照"

    $datetime = Get-Date -Format 'yyyy-MM-dd tt hh:mm:ss'
    # 创建快照
    Checkpoint-VM -VM $vm -SnapshotName "定时快照 ($datetime)"

    # 获取所有快照
    $snapshots = Get-VMSnapshot -VM $vm | Where-Object { $_.Name -like '定时快照*' }
    Write-Output "共有 $($snapshots.Count) 个定时快照"

    # 如果快照数量超过限制，则删除较旧的快照
    if ($snapshots.Count -gt $maxSnapshots) {
        $snapshotsToDelete = $snapshots | Sort-Object CreationTime | Select-Object -First ($snapshots.Count - $maxSnapshots)

        foreach ($snapshot in $snapshotsToDelete) {
            Write-Output "删除快照 $($snapshot.Name)"
            Remove-VMSnapshot -VM $vm -Name $snapshot.Name
        }
    }
}
```

定时执行需要配置任务计划：

```bat
powershell -File 脚本路径
```
