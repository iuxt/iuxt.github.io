---
title: 使用Python识别验证码 ddddocr
categories:
  - 开发
tags: ['']
abbrlink: ss2wk6
date: 2025-02-22 17:48:05
cover: ''
updated: 2025-02-22 17:57:12
---

GitHub 地址：<https://github.com/sml2h3/ddddocr>

安装

```bash
pip install ddddocr
```

如果 windows 安装报错：`ImportError：DLL load failed: 找不到指定的模块。`
需要安装 vc 运行库：
<https://aka.ms/vs/16/release/VC_redist.x86.exe>

<https://aka.ms/vs/16/release/VC_redist.x64.exe>

基本使用：

```python
import ddddocr

ocr = ddddocr.DdddOcr(show_ad=False)

image = open("example.jpg", "rb").read()
result = ocr.classification(image)
print(result)
```
