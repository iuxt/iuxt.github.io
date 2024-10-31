---
title: Hexo博客更换url结构后配置自动跳转
categories:
  - 工具
tags:
  - Blog
  - hexo
  - seo
abbrlink: lu96kcpp
cover: 'https://static.zahui.fan/public/hexo.svg'
date: 2024-03-27 10:22:18
---

因为修改过博客的链接规则， 原来的链接是 `https://zahui.fan/xxx/` 修改成了 `https://zahui.fan/posts/xxx/` 或者删除了部分标签，造成了搜索引擎内之前收录的一些链接都变成了 404，不利于 SEO

如果是 hugo，可以查看这篇文章：[Hugo博客批量更换url结构](/posts/b75ec1fe/)

![image.png](https://static.zahui.fan/images/202403271024183.png)

在 hexo 中我们可以使用 `hexo-generator-alias` 对文章进行跳转。

## 安装 hexo-generator-alias

```bash
npm install hexo-generator-alias --save
```

GitHub 地址： <https://github.com/hexojs/hexo-generator-alias>

## 全局配置

比如 tags、category 等这种不存在对应的 markdown 文件， 可以配置在全局配置 `_config.yml` 中：

```yml
alias:
  # 访问 https://zahui.fan/index.html  跳转到  https://zahui.fan/
  index.html: /
  
  # 访问 https://zahui.fan/tags/flask/ 跳转到 https://zahui.fan/tags/Flask/
  tags/flask/: tags/Flask/
```

## 文章配置

配置在文章的 `front-matter` 中：

```yml
---
title: 打造一个赏心悦目的终端
abbrlink: 57e7c794
alias: /57e7c794/
categories:
  - Windows
tags:
  - Linux
  - 配置记录
  - WSL
date: 2021-03-05 11:54:29
---
```

abbrlink：就是文章本来的链接， 比如我的就是 `https://zahui.fan/posts/57e7c794/`

alias: 这个是关联的链接，配置成 `/57e7c794/`, 则访问 `https://zahui.fan/57e7c794/` 会跳转到本篇文章。
