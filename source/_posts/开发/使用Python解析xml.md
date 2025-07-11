---
title: 使用Python解析xml
categories:
  - 开发
tags:
  - Python
  - xml
abbrlink: 9f75a5fc
cover: 'https://s3.babudiu.com/iuxt/public/python.svg'
date: 2023-04-18 12:07:37
---

xml 是一种固有的分层数据格式，最自然的表示方式是解析成树状。 ElementTree 将整个 xml 文档解析成树状结构， Element 就表示这个树状结构中的单节点。整个 xml 文档与 Python 交互（读取和写入文件）是在 ElementTree（相当于整棵树）上完成。单个 xml 元素及其子元素的交互是在 Element（相当于 leaf）上完成。

## XML 语法

### 文档声明

从 XML 1.1 开始，在一个完整的 XML 文档中，必须包含一个 XML 文档的声明，并且该声明必须位于文档的第一行。XML 文档声明的语法格式如下所示：

```xml
<?xml version="version" encoding="value" standalone="value" ?>
```

- version：用于指定遵循 XML 规范的版本号。在 XML 声明中必须包含 version 属性，且该属性必须放在 XML 声明中其他属性之前。
- encoding：用来指定 XML 文档所使用的编码集。
- standalone：用来指定该 XML 文档是否和一个外部文档嵌套使用，取值为 yes 或 no。如果设置属性值为 yes，说明是一个独立的 XML 文档，与外部文件无关联；如果设置属性值为 no，说明 XML 文档不独立。

### 元素定义

XML 文档中的主体内容都是由元素（Element）组成的，元素是以树形分层结构排列的，一个元素可以嵌套在另一个元素中。XML 文档中有且仅有一个顶层元素，称为文档元素或根元素。元素一般是由开始标签、属性、元素内容和结束标签构成，具体示例如下：

```xml
<城市>北京</城市>
```

如果一个元素中没有嵌套子元素，也没有包含文本内容，称为空元素，比如 `< img >< /img >` 可以简写为 `< img/ >`

### 属性定义

在 XML 文档中，可以为元素定义属性。属性是对元素的进一步描述和说明。在一个元素中，可以自定义多个属性，属性是依附于元素存在的，并且每个属性都有自己的名称和取值，具体示例如下：

```xml
<售价 单位="元">68</售价>
```

需要注意的是，在 XML 文档中，属性的命名规范与元素相同，属性值必须要用双引号（""）或者单引号（''）引起来，否则被视为错误。

### 注释

注释是为了便于阅读和理解，如果想在 XML 文档中插入一些附加信息，比如作者姓名、地址或电话等，这些信息是对文档结构或文档内容的解释，不属于 XML 文档的内容，因此 XML 解析器不会处理注释内容。具体语法格式如下所示：

```xml
<!-- 注释信息 -->
```

### 脚本举例

```python
import xml.etree.ElementTree as ET

xml_text = '''<?xml version="1.0"?>
<namesilo>
    <request>
        <operation>dnsListRecords</operation>
        <ip>111.111.111.111</ip>
    </request>
    <reply>
        <code>300</code>
        <detail>success</detail>
        <resource_record>
            <type>A</type>
            <host>xxxx.com</host>
            <value>111.111.111.111</value>
            <distance>0</distance>
        </resource_record>
        <resource_record>
            <type>A</type>
            <host>guanyu.xxxx.com</host>
            <value>111.111.111.111</value>
            <distance>0</distance>
        </resource_record>
        <resource_record a="b">
            <type>CNAME</type>
            <host>www.xxxx.com</host>
            <value>guanyu.xxxx.com</value>
            <distance>0</distance>
        </resource_record>
    </reply>
</namesilo>
'''

root = ET.XML(xml_text)


print(root.tag)                         # namesilo 

for resource_record in root.iter('resource_record'):    # 全局遍历
    print(resource_record.attrib)               # 这里分别输出3个 {} {} {'a': 'b'}
    print(resource_record.find("host").text)    # 这里分别输出3个 host
    
    # findtext 和 find("xxx").text 是一样的
    print(resource_record.findtext("type"))     # 这里输出3个 type
```

## 查找方法

- `iter(tag=None)` 遍历 Element 的 child，可以指定 tag 精确查找
- `findall(match)` 查找当前元素 tag 或 path 能匹配的 child 节点
- `find(match)` 查找当前元素 tag 或 path 能匹配的第一个 child 节点
- `get(key, default=None)` 获取元素指定 key 对应的 attrib，如果没有 attrib，返回 default。

## 修改方法

- `Element.text` 直接修改字段
- `Element.remove()` 删除字段
- `Element.set()` 添加或修改属性 attrib
- `with Element.append()` 添加新的 child