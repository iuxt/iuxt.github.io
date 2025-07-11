---
title: 使用Obsidian配合Hexo写博客
categories:
  - 工具
tags:
  - Blog
  - hexo
  - 编辑器
  - markdown
abbrlink: ldle4xfe
cover: 'https://s3.babudiu.com/iuxt/images/202301302341290.png'
date: 2023-02-01 16:12:30
---

obsidian 是一款好用的 markdown 编辑器， 用来记笔记还是不错的。 并且支持插件系统，可以通过模板来生成博客的 frontmatter， 省去了 `hexo new` 的操作 所以准备配置一下用 obsidian 来写博客。

相关文章：
[静态博客生成工具hexo](/posts/ab21860c)
[使用typora更好更快地写hugo博客](/posts/b4cf69c3)
[使用vscode来写hugo博客并处理图片插入问题](/posts/2a39e018)

## 打开仓库

首先使用 obsidian 打开 `source/_posts` 目录， 然后会生成一些配置文件。进入 `_posts` 目录

创建.gitignore 将一些临时文件排除掉。

```.gitignore
.obsidian/workspace.json
```

## 配置模板

自带的模板插件功能太单一了， 我们关闭安全模式， 安装第三方插件 `Templater`

创建 `Templates` 目录，修改配置指定 Template 的目录。修改配置项 `Template folder location` 为 `Templates`

然后再此目录下创建 `Front-matter.md` 文件，此文件用作 hexo 的 frontmatter 模板。

```yaml
---
title: <% tp.file.title %>
categories:
  - <% tp.file.folder(relative=true) %>
tags:
  - ''
abbrlink: <% tp.user.get_url() %>
date: <% tp.date.now(format="YYYY-MM-DD HH:mm:ss") %>
cover: ''
---
```

其中：

|模板|作用|
|---|---|
|tp.file.title                   |          获取到的就是文件名|
|tp.file.folder(relative=true) | 是获取文件所在的相对路径，就是所在目录名字|
|tp.user.get_url()            |    是自定义方法，脚本后面展示，用于自动生成博客的 url|
|tp.date.now(format="YYYY-MM-DD HH:mm:ss")  |以指定格式格式化时间|

详细的变量使用请查看 `Templater` 官方文档<https://silentvoid13.github.io/Templater/>

### 自定义脚本

创建目录 `Scripts`， 然后在设置里配置 `Script files folder location` 为 `Scripts`

获取 GUID 脚本 `Scripts/get_url.js` 这里是取出当前时间戳，然后去掉毫秒，再按照 `0-9` + `a-z` 一共 36 个字符来表示，得到一个 6 位不重复的字符串，用作文章的链接。

```javascript
function generateTimestampUrl() {
  var timestamp = Math.round(new Date() / 1000);
  var url = timestamp.toString(36)
  return url;
}
module.exports = generateTimestampUrl;
```

然后每次创建新 markdown 文件的时候，只需要点击 templater 按钮， 然后就会自动生成我们需要的 frontmatter， 就不用 hexo new 了

### 隐藏 Templates 和 Scripts 目录

安装 Hidden Folder 插件，可以隐藏这两个目录。

## 渲染时排除这些目录

在主配置文件中 `_config.yml`

```yml
skip_render: 
# 这里排除的是obsidian编辑器需要的文件
  - '_posts/.obsidian/*'
  - '_posts/Scripts/*'
  - '_posts/Templates/*'
  - '**/README.md'
```

## 使用 git 插件进行同步

安装 `Obsidian GIT` 插件
按下快捷键 `CTRL + P` 选择 commit all changes ， 然后选择 `push` 即可发布。

## 使用 image-auto-upload-plugin 来处理图片

默认情况下 obsidian 插入图片会插入到附件文件夹, 安装此插件会自动调用 picgo 或者 piclist 来进行文件上传并复制 markdown 语法到文件中.