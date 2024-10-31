---
title: Python 使用 Easyocr 进行图像识别
categories:
  - 开发
tags:
  - Python
  - OCR
  - Windows
abbrlink: sel45f
cover: 'https://static.zahui.fan/public/python.svg'
date: 2024-06-05 09:58:26
---

如果你有 NVIDIA GPU，可以额外安装 CUDA，提供更好的性能，没有 NVIDIA GPU，可以使用 CPU 计算。

easyocr 官方地址：<https://github.com/jaidedai/easyocr>

## 安装 pytorch

```bat
pip3 install torch torchvision torchaudio
```

## 安装 easyocr

```bat
pip3 install easyocr
```

## 精简输出

默认情况下会输出：`Neither CUDA nor MPS are available - defaulting to CPU. Note: This module is much faster with a GPU.` 可以通过添加参数 `verbose=False` 来去掉这个提示。

默认会输出坐标、字符等信息，如果只需要输出字符，可以增加参数 `detail=0` 获得精简的输出。

```python
import easyocr
reader = easyocr.Reader(['en'], gpu=False, verbose=False) # 这里加载英文模型，如果需要识别简体中文，可以 reader = easyocr.Reader(['ch_sim', 'en'])
result = reader.readtext('D:\\ocr\\1.png',detail=0)
print(result[0].replace(" ", ""))
```

第一次运行会下载模型，模型默认存储位置在：`%userprofile%\.EasyOCR\model`

## 常见报错

### fbgemm.dll 加载失败

```bat
OSError: [WinError 126] 找不到指定的模块。 Error loading "D:\ocr\venv\Lib\site-packages\torch\lib\fbgemm.dll" or one of its dependencies.
```

在 `widnows` 环境下，需要安装 `Microsoft Visual C++ Redistributable` <https://learn.microsoft.com/en-US/cpp/windows/latest-supported-vc-redist>

