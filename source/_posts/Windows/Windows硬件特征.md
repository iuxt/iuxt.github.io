---
title: Windows硬件特征
categories:
  - Windows
abbrlink: ltfd14pe
cover: 'https://s3.babudiu.com/iuxt/public/Windows-old.svg'
date: 2021-03-06 13:30:14
tags:
---

查看序列号

```bat
wmic bios get serialnumber
```

查看硬盘序列号

```bat
wmic diskdrive get serialnumber
```

主板序列号

```bat
wmic baseboard get serialnumber
```
