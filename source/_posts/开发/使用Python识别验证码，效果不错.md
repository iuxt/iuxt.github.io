---
title: 使用Python识别验证码，效果不错
categories:
  - 开发
tags:
  - ''
abbrlink: sp3b30
date: 2024-12-26 15:20:59
cover: ''
---

{% note flat %}
以前用过什么 pytesseract 识别效果很差，还需要电脑上安装 `Tesseract OCR` 的软件，但是使用下来，效果不好，后面也用过 `PaddleOCR` 可以识别，但是识别速度比较慢，成功率也不高。后面又看到了这个开源工具，吹牛逼比较厉害，号称自己是验证码识别的最高境界，就试试看。官方的 GitHub 地址是：<https://github.com/litongjava/muggle_ocr>
{% endnote %}

## 效果展示

![](https://static.zahui.fan/images/20241226175857257.gif)

![](https://static.zahui.fan/images/20241226175928967.gif)

## 环境

OS： Windows 11
Python： python-3.10.10-amd64

## 安装

这个开源程序在 pypi 仓库上被移除了，需要在 GitHub 上将源码包下载下来安装。

![image.png](https://static.zahui.fan/images/20241226152841716.png)

下载到本地，解压后，打开 cmd 命令提示符，

```bat
REM 创建虚拟环境
python -m venv venv

REM 安装muggle_ocr
cd muggle_ocr-main
python setup.py install
```

### 报错处理

error: numpy 2.2.1 is installed but numpy<2.1.0,>=1.26.0 is required by {'tensorflow-intel'}

```bat
pip install numpy==2.0.2
```

然后再重新安装 muggle_ocr

## 使用

识别验证码

```python
import time
import os 
import muggle_ocr

"""
使用预置模型，预置模型包含了[ModelType.OCR, ModelType.Captcha] 两种
其中 ModelType.OCR 用于识别普通印刷文本, ModelType.Captcha 用于识别4-6位简单英数验证码
"""

# 打开验证码图片
with open(r"1.png", "rb") as f:
    captcha_bytes = f.read()

# ModelType.Captcha 可识别4-6位验证码
sdk = muggle_ocr.SDK(model_type=muggle_ocr.ModelType.Captcha)
# 3. 调用预测函数
text = sdk.predict(image_bytes=captcha_bytes)
print(text)
```