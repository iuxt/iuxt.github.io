---
title: yaml多行文本的写法和区别
categories:
  - 开发
tags:
  - ''
abbrlink: sldz99
cover: ''
date: 2024-10-15 15:24:45
---

直接看效果（`pip install pyyaml`）：

```python
import yaml

yaml_data = """
example1: |
  This is line one.
  This is line two.
example2: |-
  This is line one.
  This is line two.
example3: >-
  This is line one.
  This is line two.
"""

# 将 YAML 数据解析为 Python 对象
data = yaml.safe_load(yaml_data)

# 访问特定字段
print(f"example1: {data['example1']}")
print(f"example2: {data['example2']}")
print(f"example3: {data['example3']}")
```

输出结果：

```plaintext
example1: This is line one.
This is line two.

example2: This is line one.
This is line two.
example3: This is line one. This is line two.
```

## 结论

在 YAML 中，`|`、`|-` 和 `>-` 都用于定义多行字符串，但它们的处理方式不同：

1. `|`
    - 保留换行符。
    - 生成的字符串在每行的末尾保留换行符。

2. `|-`
    - 类似于 `|`，但去掉最后的换行符。
    - 结果中的最后一行不会有换行符。

3. `>-`
    - 将换行符转换为空格。
    - 结果中的所有行会被连接成一行，中间用空格分隔，最后一行也没有换行符。


