---
title: git常用操作记录
abbrlink: 518e617c
categories:
  - 基础运维
tags: [Linux, Git, 配置记录]
date: 2021-04-27 23:03:29
updated: 2025-06-04 09:33:14
---

## 配置文件

### 查看 GIT 本地配置

```bash
git config --list
```

### 编辑 git 配置文件

```bash
git config --global --edit
```

### 设置 GIT 用户信息

```bash
git config --global user.name "zhanglikun"
git config --global user.email "iuxt@qq.com"
```

### git 记住密码

```bash
git config --global credential.helper store
```

### 配置文件 `~/.gitconfig` 内容

```ini
[user]
        name = zhanglikun
        email = iuxt@qq.com
[credential]
        helper = store
```

### 忽略追踪文件权限

> 建议 windows 代码使用

```bash
git config core.filemode false
```

## 分支管理

| 命令                        | 作用                                 |
| --------------------------- | ------------------------------------ |
| git branch -a               | 查看所有分支                         |
| git branch -r               | 查看远程分支                         |
| git fetch                   | 更新索引                             |
| git checkout 分支名         | 切换到分支                           |
| git checkout -b 本地分支名 | 在本地创建一个分支, 并切换到这个分支 |
| git reset --hard 6e52       | 回退到某个 ID                         |
| git add -u                  | 将删除操作也添加到暂存区             |
| git rm --cached filename    | 将暂存区的文件移出暂存区             |

### 使用 git checkout 撤销本地修改

> checkout 就是撤销你的修改, 暂存区是会保留.

```bash
# 撤销所有修改
git checkout .

# 撤销单个文件的修改
git checkout readme.md
```

### git 回滚一个文件到指定版

根据 commitid 来回滚

```bash
git log /path/to/file
git checkout <commit-hashcode> /path/to/file
```

回滚到上一个版本

```bash
git checkout HEAD^ /path/to/file
```

### 使用 git reset 回退项目版本

> git reflog 查看命令历史

```bash
git reset --hard <commit-hashcode>
git reset --hard HEAD^                  # HEAD表示当前版本 HEAD^ 表示上一个版本 HEAD^^ 上两个版本 HEAD~100 上100个版本
```

### 添加关联的远程 git 仓库

> origin 是远端的名字, 多个远端名字不能相同

```bash
git remote add origin https://github.com/iuxt/test.git
```

### 上传，并关联到 master 分支

```bash
git push -u origin master
```

### 合并代码

```bash
git checkout master
git merge dev            # 将dev代码合并到master
```

> 合并方式如果是 fast-forward 模式, 表示 git 只是切换了一下指针

### 删除分支, 分支改名

```bash
# 重命名本地分支
git branch -m oldbranch newbranch

# 删除远程分支
git push --delete origin oldbranch

# 将重命名后的分支推到远端
git push origin newbranch

# 与远程分支关联
git branch --set-upstream-to origin/newbranch

# 如果远程已经删除了分支, 本地还没更新, 可以使用
git fetch -p
```

### rebase

利用 rebase 删除历史提交记录

```bash
git rebase -i <你要基于那个提交的id>
```

commit 前面的 pick 改成 d 即可，表示丢弃这个 commit，如果需要推送到远端的话，需要 `git push -f`

> 注意：多人协作慎用 `git push -f`

## 标签管理

### 查看标签

```bash
# 查看标签
git tag

# 查看标签详情
git show v1.0
```

### 创建标签

切换到对应的分支, 默认是打在最新的 commit 上的。

```bash
git tag v1
```

如果想要打到历史的 commit id

```bash
# 查看历史的commit id
git log --pretty=oneline --abbrev-commit

# 对 commit id 打标签
git tag v0.9 f52c633

# 打标签带上说明
git tag -a v0.1 -m "version 0.1 released" 1094adb
```

### 推送标签

```bash
# 一次性全部推送标签
git push origin --tags

# 推送一个标签到远程
git push origin refs/tags/v0.1
```

### 删除标签

```bash
# 删除本地标签
git tag -d v0.1

# 删除远程标签，需要先删除本地标签
git tag -d v0.1
git push origin :refs/tags/v0.1
```

## submodule

### 添加 submodule

```bash
git submodule add https://github.com/HEIGE-PCloud/DoIt.git themes/DoIt
```

后续使用

```bash
git clone https://github.com/HEIGE-PCloud/DoIt.git
cd DoIt
git submodule init
git submodule update
```

### 删除 submodule

```bash
git submodule deinit -f -- themes/eureka
rm -rf .git/modules/themes/eureka
git rm -f themes/eureka
```

最后更新一下 `.gitmodules` 即可

### 修改 submodule 的 url

1.更新 `.gitsubmodule` 中对应 `submodule` 的条目 URL

2.更新 `.git/config` 中对应 `submodule` 的条目的 URL

3.执行 `git submodule sync`

## git-lfs 大文件存储

git lfs 是大文件存储, 独立于 git 仓库, 通过文件指针的方式来调用

```bash
# 初始化仓库, 系统全局配置, 执行一次即可, 配置保存在 ~/.gitconfig
git lfs install

# 跟踪文件， 即为把指定的文件使用 lfs 来管理, 执行后会添加信息到 .gitattributes 文件中。
git lfs track *.rpm

# 查看被 lfs 管理的文件
git lfs ls-files

# 查看某个文件是否被 lfs 管理
git check-attr filter xxx.png

# 下载所有lfs文件
git lfs fetch --all

# 上传所有lfs文件
git lfs push origin master --all
git lfs push --all
```

## 小技巧

### 指定密码拉取 git

> 不安全, 推荐使用 ssh 密钥方式

```bash
# %40 表示 @
git clone http://admin:admin%401234@203.156.235.84:10000/r/app/client.git
```

### 删除历史记录中的大文件

```bash
# 安装 git-filter-repo 工具
sudo apt install git-filter-repo

# 假设文件为：large_file.zip ，从所有历史记录中删除。
git filter-repo --path large_file.zip --invert-paths

# 删除文件夹
git filter-repo --path 123/ --invert-paths
```

### windows 建议配置

```bash
# 提交时转换为LF， 拉取时不转换
# 或者配置成false，那么git不处理换行符，由用户自己处理。
git config --global core.autocrlf input

# 忽略追踪文件权限
git config --global core.filemode false

# 解决控制台不能正常显示中文的问题
git config --global core.quotepath false
```
