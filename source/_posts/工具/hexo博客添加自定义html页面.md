---
title: hexo博客添加自定义html页面
categories:
  - 工具
tags:
  - hexo
  - 博客
  - 搭建
  - 记录
abbrlink: sgba64
cover: 'https://s3.babudiu.com/iuxt/public/hexo.svg'
date: 2022-07-08 23:39:40
---

比如我想增加一个文件夹，文件夹里面有 img、css、js 等文件夹，还有 index.html 文件，想要在 hexo 博客里可以正常显示

将 文件夹 放到 hexo 的 source 文件夹下。

然后需要配置跳过 hexo 的渲染，因为 hexo 会改变 html 文件的结构。

修改 `_config.yml`

```yml
skip_render: 
# 这里排除的是 source 目录下不需要渲染的文件
  - '**/README.md'
  - 'html/*'
```

后续可以通过访问 `http://xxx.com/html/` 来打开页面

需要注意 js css html 等文件调用的地址有可能需要更换。
