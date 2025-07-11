---
title: 使用inkscape制作svg封面图
categories:
  - 工具
tags:
  - 图像处理
  - svg
  - 矢量图
abbrlink: sel6im
cover: 'https://s3.babudiu.com/iuxt/public/Inkscape.svg'
date: 2023-06-05 10:49:34
---

注意：本文不适用于将其他格式转换成 svg ，只适用于原生 svg

svg 全名叫可缩放矢量图形，就算放大也不会失真，下面是个对比：

## svg 示例

![svg示例图|472](https://s3.babudiu.com/iuxt/public/elasticsearch.svg)

## png 示例

![elasticsearch.webp|471](https://s3.babudiu.com/iuxt/images/elasticsearch.webp)

## 使用 inkscape 调整 svg 属性

### 调整画布大小

作用是设置成 3:2 的分辨率

![image.png|830](https://s3.babudiu.com/iuxt/images/202405300829087.png)

大小 调整好后，调整缩放，调整到自己觉得 ok 就行，可以多测试效果。

### 调整元素的位置

比如我想要让图标在文字的上方

到图层里，选择要操作的图层，使用鼠标上下调整位置（左右位置通过居中来自动调整）

![image.png|829](https://s3.babudiu.com/iuxt/images/202405300834196.png)

这里如果调整一个元素，其他的元素跟着一块动了，你需要到图层里面看看有没有分组，要先取消分组才能继续调整。

一个整体想要一块调整， 那需要先放到一个分组里面，快捷键 `Ctrl + G`

![image.png|828](https://s3.babudiu.com/iuxt/images/202405300839850.png)

在对齐与分布里面，相较于**页面**选择水平居中

![image.png|823](https://s3.babudiu.com/iuxt/images/202405300840422.png)

## 使用 VSCode 插件来压缩 svg

svg 本质上就是 xml 文本文件，可以通过 VSCode 插件来压缩大小（矢量图形，压缩不会损失画质）

安装一个 svg 扩展，我用的是这个：
![image.png](https://s3.babudiu.com/iuxt/images/202405300848735.png)

然后打开 svg 文件，右键会有个 压缩 svg 的选项。

### 压缩前后文件内容对比

![image.png|804](https://s3.babudiu.com/iuxt/images/202405300850919.png)

### 压缩前后文件大小对比

![image.png](https://s3.babudiu.com/iuxt/images/202405300851886.png)

注意： 使用其他图片转换成的 svg 不行，并不是真的原生 svg