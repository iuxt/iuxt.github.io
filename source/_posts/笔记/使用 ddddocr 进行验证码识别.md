---
date: 2025-02-19 18:48:36
updated: 2025-02-19 19:30:35
---

<https://github.com/sml2h3/ddddocr>

可以使用 `pip install ddddocr` 安装也可以下载源码来安装：

```bat
pip install setuptools
cd ddddocr-master
python setup.py install
```

如果报错：
DLL load failed while importing onnxruntime_pybind11_state: 找不到指定的模块。

需要安装 msvc 运行库，到微软官网下载安装：<https://learn.microsoft.com/zh-cn/cpp/windows/latest-supported-vc-redist?view=msvc-170>

使用：

```python
# example.py
import ddddocr

ocr = ddddocr.DdddOcr(show_ad=False)

image = open("1.png", "rb").read()
result = ocr.classification(image)
print(result)
```

官方提供了很多，对我来说最简单的就可以正常识别了。

初始化传参 `show_ad=False` 输出就不带作者的广告了。
