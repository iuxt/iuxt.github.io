---
title: hexo butterfly 主题使用记录
categories:
  - 工具
abbrlink: sm3z1i
cover: ''
date: 2021-10-29 16:17:41
tags:
---

## 开始使用

nodejs 使用 `v20.17.0` 版本
包管理使用 npm

```bash
# 初始化主题，第一次需要执行
git submodule init
git submodule update

# 安装依赖包
npm i

## 查看效果
npx hexo s

# 创建新文章
npx hexo new "测试文章"
```

然后将 `source/_posts/测试文章.md` 移动到对应的分类目录下。

~~由于 hexo-abbrlink 和 hexo-auto-category 的冲突，需要执行 2 次 `npx hexo g` 才能正确生成需要的 front matter~~这个问题已经解决了, 替换成了包 `hexo-abbrlink-iuxt` 解决了这个问题, 执行 `npx hexo g` 即可自动生成固定链接和分类

## 封面图

1280 x 720 或者 3:2 的比例

## 常用 shortcode 记录

标签外挂官方文档： <https://butterfly.js.org/posts/2df239ce/>
<https://butterfly.js.org/posts/ceeb73f/>

### tabs

{% tabs TabName %}

<!-- tab 第一个标签页 -->
================这里是第一个标签页的内容=================
<!-- endtab -->

<!-- tab 第二个标签页 -->
================这里是第二个标签页的内容=================
<!-- endtab -->

{% endtabs %}

### 图库

```bash
{% gallery %}
![](https://i.loli.net/2019/12/25/Fze9jchtnyJXMHN.jpg)
![](https://i.loli.net/2019/12/25/ryLVePaqkYm4TEK.jpg)
![](https://i.loli.net/2019/12/25/gEy5Zc1Ai6VuO4N.jpg)
![](https://i.loli.net/2019/12/25/d6QHbytlSYO4FBG.jpg)
![](https://i.loli.net/2019/12/25/6nepIJ1xTgufatZ.jpg)
![](https://i.loli.net/2019/12/25/E7Jvr4eIPwUNmzq.jpg)
![](https://i.loli.net/2019/12/25/mh19anwBSWIkGlH.jpg)
![](https://i.loli.net/2019/12/25/2tu9JC8ewpBFagv.jpg)
{% endgallery %}
```

### 行内图片

我覺得很漂亮 {% inlineImg https://i.loli.net/2021/03/19/5M4jUB3ynq7ePgw.png 150px %}

### 文字高亮

高亮所需的文字

{% label text color %}

|参数  | 解释|
|---|----|
|text    |文字|
|color   | 【可选】背景颜色， default/blue/pink/red/purple/orange/green|

### 提示/警告

<https://butterfly.js.org/posts/2df239ce/>

```bash
{% note flat %}
默認 提示塊標籤
{% endnote %}

{% note default flat %}
default 提示塊標籤
{% endnote %}

{% note primary flat %}
primary 提示塊標籤
{% endnote %}

{% note success flat %}
success 提示塊標籤
{% endnote %}

{% note info flat %}
info 提示塊標籤
{% endnote %}

{% note warning flat %}
warning 提示塊標籤
{% endnote %}

{% note danger flat %}
danger 提示塊標籤
{% endnote %}
```

## 如果不想使用图床

在 source/img 目录下放你的图片， 生成的静态文件在： https://xxx.com/img/1.png， 可以直接使用 /img/1.png 来引用