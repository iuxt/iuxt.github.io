---
title: 解决PyCharm终端使用zsh powerlevel10k主题时的乱码问题
categories:
  - 工具
tags: []
abbrlink: srz9zs
date: 2025-02-20 18:47:52
cover: ""
updated: 2025-02-20 23:12:52
---

`powerlevel10k` 是 zsh 上很好看的主题，我一直是在 wsl 里用，配合 `Windows Terminal` 很好看，不过在 PyCharm 里打开会乱码，可以通过修改控制台字体为支持 powerline 的字体，不过还是不完美，有时候还有 BUG。

![image.png|577](https://s3.babudiu.com/iuxt/images/20250220230144904.png)

想了下，我平时都是在 `Windows Terminal` 上用的，那么可以让使用 `Windows Terminal` 的时候显示成**花里胡哨**的主题，用其他软件比如 PyCharm 或者 VScode 的时候，换成**朴素**的主题。看了下，在 `Windows Terminal` 上有个特殊的环境变量 `WT_SESSION` 和 `WT_PROFILE_ID` ，看名字应该是和 Windows terminal 有关，测试了下也确实如此，那么可以修改 `~/.zshrc` 来实现。

![image.png](https://s3.babudiu.com/iuxt/images/20250220230859339.png)

```bash
if [[ $WT_SESSION ]]; then
  ZSH_THEME="powerlevel10k/powerlevel10k"
else
  ZSH_THEME="robbyrussell"
fi
```

此时显示如下：

![](https://s3.babudiu.com/iuxt/images/20250220231032118.png)
