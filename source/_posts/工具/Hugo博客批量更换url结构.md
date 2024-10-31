---
title: Hugo博客批量更换url结构
abbrlink: b75ec1fe
categories:
  - 工具
tags:
  - hugo
  - Blog
  - markdown
date: 2022-03-01 14:33:48
---

之前修改过 hugo 的 url 结构，config.toml 内容如下：

```toml
[Permalinks]
  posts = ":slug"
```

生成的 URL 类似于：<https://zahui.fan/a7c8660c/> 不过这样随着文件越来越多，发布用的仓库根目录文件夹也越来越多，不好看，再加上域名后加上光秃秃的无意义的字符串也不优雅，所以决定改成<https://zahui.fan/posts/a7c8660c/>这样的域名结构。

## 修改 config.toml

我们需要修改 config.toml，改变默认的 url 结构

```toml
[Permalinks]
  posts = "/posts/:slug"
```

这样重新生成博客，url 路径就会变成新的了

## 配置自动跳转

这样配置的话，之前的 url 连接就会全部 404 了，对于做了 SEO 的同学来说就是个灾难，所以我们需要做个跳转

在 frontmatter 添加 aliases：

```yml
---
title: "安装和配置samba共享"
date: 2022-02-11T11:18:21+08:00
abbrlink: a7c8660c

aliases:
  - /a7c8660c/
typora-root-url: ../../static
typora-copy-images-to: ../../static/img
categories: ["Operations"]
tags: ["samba", "配置记录"]
---
```

这样每次访问<https://zahui.fan/a7c8660c/>就会自动跳转到<https://zahui.fan/posts/a7c8660c/>

## 自动替换脚本

写了个脚本可以批量给 md 文件添加 aliases:，脚本和 md 文件放在一起

```bash
#!/bin/bash

IFS=$'\n'
for i in $(ls *.md):
do
  slug=$(grep "^slug:" $i | head -1 | sed "s/slug://g" | sed "s/ //g")
  echo $i
  echo $slug
  sed -i "5a aliases:\n  - /$slug/" $i
done
```
