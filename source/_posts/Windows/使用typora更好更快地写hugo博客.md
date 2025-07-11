---
title: 使用typora更好更快地写hugo博客
abbrlink: b4cf69c3
cover: 'https://s3.babudiu.com/iuxt/images/202303181541059.png'
categories:
  - Windows
tags:
  - Blog
  - hugo
  - 编辑器
  - markdown
date: 2021-12-03 11:43:39
---

> hugo 是一个静态博客生成工具，自己有自己的文件组织方式，所以导致的结果就是使用 typora 不能正常显示图片，插入图片也不能放在正确的位置上。
> typora 已经成为收费软件了，有能力请支持正版，或者使用旧版本 [最后一个Typora免费版0.11.18](/64b52e0d)

## 图片管理

![typora配置图片位置](https://s3.babudiu.com/iuxt/images/typora_config_image.png)

按照图示设置后，即可正常显示图片，复制粘贴图片也能复制到正确的位置，设置完成后，发现 markdown 的 frontmatter 增加了 2 行：

```yml
typora-root-url: ../../static
typora-copy-images-to: ../../static/img
```

意思是将图片放在 static 的 img 目录里。每次都在 markdown 文件添加上这两行即可，那么有没有办法自动添加呢？

当然有~

编辑 hugo 目录下的 `archetypes/default.md`,这个文件是默认创建的模版。在里面添加上上述内容。

## 自动生成分类

> 不想让所有的 markdown 文件都在一个文件夹内，比如想按文件夹分类，A 文件夹内的文章发布后就是在 A 分类下。

可以将 `archetypes/default.md` 里面的 `categories` 修改成

```yml
categories: ["{{ trim (replace .File.Dir "posts/" "") "/" }}"]
```

以后创建新文章的时候就可以自动生成分类了。
