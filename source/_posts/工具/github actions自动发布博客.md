---
title: Github Actions自动发布博客
abbrlink: 3debc8f2
categories:
  - 工具
tags:
  - Automatic
cover: 'https://static.zahui.fan/images/202211011808880.png'
date: 2021-07-27 23:54:56
---

> 偶然发现 github actions 可以执行一些命令，这下可以把我的 crontab 停掉了，也不用占用一台机器专门用来发布博客了，并且完全免费！！

> 首先我的 GitHub pages 和博客原始文件是分为两个仓库的，在 GitHub Pages 仓库里添加了一个 Actions 用来钉钉发通知：

## GitHub 仓库配置 Secret

需要先将环境变量配置在 Settings --> Secrets and Variables --> Actions 里面

![github Acrions 环境变量配置](https://static.zahui.fan/images/202304111133670.png)

配置后，可以在 actions 里面通过 `${{ secrets.dingtalk_secret }}` 调用到对应的数据

## 针对 Hexo 博客的构建

```yml
name: Deploy GitHub Pages

on:
  push:
    branches:
      - master

jobs:
  deploy_github_pages:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          submodules: recursive
          fetch-depth: 0
      - name: Use Node.js 16.x
        uses: actions/setup-node@v1
        with:
          node-version: 16.x

      # 为了解决更新日期问题,从git读取提交时间,然后批量touch一下
      - name: build_hexo
        run: |
          git ls-files -z | while read -d '' path; do touch -d "$(git log -1 --format="@%ct" "$path")" "$path"; done
          npm install
          npx hexo clean
          npx hexo g
          
      - name: Deploy 🚀
        uses: JamesIves/github-pages-deploy-action@4.1.5
        with:
          BRANCH: main # The branch the action should deploy to.
          FOLDER: public # The folder the action should deploy.
          ssh-key: ${{ secrets.DEPLOY_SSH_KEY }}
          repository-name: iuxt/iuxt.github.io

```

## 针对于 Hugo 博客的构建

```yml
name: Deploy GitHub Pages

on:
  push:
    branches:
      - master                                                  # master更新后执行
  schedule:
    - cron:  '0 0 * * *'                                        # 每天0点自动执行

jobs:
  deploy_github_pages:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          submodules: recursive

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: '0.80.0'
          extended: true

      - name: Build
        run: |
          git config core.quotePath false
          hugo

      - name: Deploy 🚀
        uses: JamesIves/github-pages-deploy-action@4.1.4
        with:
          BRANCH: main                                          # 你要发布到哪个分支（GitHub Pages的仓库分支，不是你hugo代码的分支）
          FOLDER: public                                        # 发布的文件夹，默认就是public
          ssh-key: ${{ secrets.DEPLOY_SSH_KEY }}                # 我发布到不同的仓库，需要用到私钥，私钥用GitHub Secret来管理，发布同仓库可以去掉这个配置
          repository-name: iuxt/iuxt.github.io                  # 发布到同仓库的不同分支要去掉这个配置

      - name: Use Node.js 10.x
        uses: actions/setup-node@v1
        with:
          node-version: 10.x
      - name: algolia upload
        run: |
          npm install
          npm run algolia                                       # 使用algolia的，可以同时推送到algolia
        env:
          ALGOLIA_APP_ID: ${{ secrets.ALGOLIA_APP_ID }}         # 一样的，需要在GitHub Secret里面创建键值对。
          ALGOLIA_INDEX_NAME: blog
          ALGOLIA_INDEX_FILE: public/index.json
          ALGOLIA_ADMIN_KEY: ${{ secrets.ALGOLIA_ADMIN_KEY }}
```

## 推送到百度，加快收录

```yml
name: Baidu push

on:
  push:
    branches:
      - master
  schedule:
    - cron:  '0 0 * * *'                            # 使用crontab定时执行，0点实际执行时间是9点，可能是时区问题

jobs:
  baidu-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2                   # 拉取代码，并拉取git submodule
        with:
          submodules: recursive

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2             # hugo环境，用的是别人写好的actions
        with:
          hugo-version: '0.80.0'
          extended: true

      - name: Build
        run: |
          git config core.quotePath false
          hugo                                      # 使用hugo命令生成静态文件

      - name: Install requests
        run: pip install requests

      - name: Push
        run: |
          python <<END
          import requests
          import re
          with open('public/sitemap.xml', 'r') as sitemap:
            pattern = re.compile(r'(?<=<loc>).+?(?=</loc>)')
            result = pattern.findall(sitemap.read())[:9]
            req = requests.post('http://data.zz.baidu.com/urls?site=https://zahui.fan&token=${{ secrets.BAIDU_PUSH_TOKEN }}', '\n'.join(result))
            print(req.text)
          END
```

推送到百度有可能会失败， 需要减少推送的数量， 对于我来说，推送 9 条不会报错。

## 发送钉钉通知

> 这个我配置在了静态文件所在的仓库，就是 hexo 构建完成推送到的仓库，每当仓库发生了更新， 就会推送一条通知到钉钉

```yml
name: dingtalk_notify

on:
  push:                                 # 在收到push的时候触发
    branches:
      - main                            # 监控main分支

jobs:
  dingtalk_notify:
    runs-on: ubuntu-latest              # 用ubuntu系统来执行
    steps:
      - name: dingtalk_notify
        run: |
          python <<END
          import time
          import hmac
          import hashlib
          import base64
          import urllib.parse
          import requests

          now = str(time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))

          secret = "${{ secrets.dingtalk_secret }}"                         # 这里是GitHub Secret， 需要在仓库设置里创建对应的键值对
          webhook_url = "${{ secrets.dingtalk_url }}"

          # 根据时间戳生成签名
          timestamp = str(round(time.time() * 1000))
          secret_enc = secret.encode('utf-8')
          string_to_sign = '{}\n{}'.format(timestamp, secret)
          string_to_sign_enc = string_to_sign.encode('utf-8')
          hmac_code = hmac.new(secret_enc, string_to_sign_enc, digestmod=hashlib.sha256).digest()
          sign = urllib.parse.quote_plus(base64.b64encode(hmac_code))

          # 要发送的数据
          data = """
          {
              "msgtype":"text",
              "text": {
                  "content": "%s %s"
              }
          }
          """ %(now, "博客自动发布成功")

          # url参数
          params={
              'timestamp': timestamp,
              'sign': sign
          }

          # header
          header = {'Content-Type': 'application/json'}

          # post消息出去
          r = requests.post(webhook_url, headers=header, params=params, data=data.encode('utf-8'))
          print(r.text)
          END
```

## 使用 Github Actions 造成的文章更新时间问题

参考原文：<https://mrseawave.github.io/blogs/articles/2021/01/07/ci-hexo-update-time/>

当使用 Travis CI or Github Actions 自动化部署时，发现部署成功后，所有文章的更新时间都变成了此次提交修改的时间，但有些文章在上一次提交后是没有发生过任何修改的。

这是因为 git 在推送更新时，并不记录保存文件的访问时间、修改时间等元信息，（[原因在这里](https://archive.kernel.org/oldwiki/git.wiki.kernel.org/index.php/Git_FAQ.html?spm=a2c4e.10696291.0.0.671919a4OeAqE1#Why_isn.27t_Git_preserving_modification_time_on_files.3F)）所以每次使用 git 把项目 clone 下来时，文件的时间都是克隆时的时间。又因为如果没有在 front-matter 中指定 updated，Hexo 会默认使用文件的最后修改时间作为文章的更新时间，所以会出现所有文章的更新时间都发生变化的情况。

总的来说，使用 git clone 下来的文件的时间都不是原来文件的时间，而自动化部署每次都需要 clone 源码才能进行后面的生成和部署操作，所以目前如果想正确显示更新时间。对于 Github Actions 可以使用命令在构建之前进行处理

```yml
jobs:
  deploy_gh_pages:
    steps:
      - name: Restore file modification time
        run: |
          git ls-files -z | while read -d '' path; do touch -d "$(git log -1 --format="@%ct" "$path")" "$path"; done
```

如果 git 命令不好用， 也可以使用 find 命令

```bash
find source/_posts -name '*.md' | while read file; do touch -d "$(git log -1 --format="@%ct" "$file")" "$file"; done
```

实际上，clone 下来的文件的时间还是克隆时的时间，然后通过上面的命令，它将 clone 下来的文件的时间改成了该文件最近一次变动的推送时间（也即文件最后一次修改的 push 时间）。

注：如果 github actions 中使用 actions/checkout@v2，请设定它的参数 fetch-depth: 0，因为 0 表示获取所有分支和标签的所有历史记录。默认值为 1

## 时区问题

```yml
name: notify

on:
  push:
    branches:
      - main
env:
  TZ: Asia/Shanghai

jobs:
  dingtalk_notify:
    runs-on: ubuntu-latest
    steps:
    .........
```

## 推送条件

我不希望任何更改都去执行 `GitHub Actions` 构建，查找了文档， 可以这么配置：

```yml

on:
  push:
    branches:
      - master
    # 下面这些目录发生变化才会触发 GitHub Actions
    paths:
      - 'source/_posts/工具/**'
      - 'source/_posts/基础运维/**'
      - 'source/_posts/监控/**'
      - 'source/_posts/开发/**'
      - 'source/_posts/日志/**'
      - 'source/_posts/数据库/**'
      - 'source/_posts/Kubernetes/**'
      - 'source/_posts/Windows/**'
```

这样配置，只有更新了这些目录下的文件，才会自动执行 `Github Actions`
