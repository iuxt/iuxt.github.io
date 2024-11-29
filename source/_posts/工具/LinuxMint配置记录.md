---
title: LinuxMint配置记录
categories:
  - 工具
abbrlink: sik5eq
cover: ''
date: 2022-08-21 15:42:25
tags:
---

文章基于 LinuxMint 22 版本， 对应的 Ubuntu 版本是 24.04

## 修改 grub 启动延迟

默认延迟 30s，太久了

搜索到的文章是修改 `/etc/default/grub` 里面的 `GRUB_TIMEOUT` 值，然后重新生成 grub 配置，我测试不生效。应该增加 `GRUB_RECORDFAIL_TIMEOUT=3`

```bash
# 更新grub配置文件
sudo update-grub

# 或者
# sudo grub-mkconfig –o /etc/grub2.cfg
```

## 基础环境配置

### 安装常用的包

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y libmysqlclient-dev build-essential libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev lrzsz
```

### 当前用户免 sudo 密码

```bash
sudo tee /etc/sudoers.d/iuxt <<-EOF
%sudo   ALL=(ALL:ALL) NOPASSWD:ALL
$USER   ALL=(ALL:ALL) NOPASSWD:ALL
EOF
```

## git 配置

```bash
sudo apt install -y git git-lfs
```

```bash
tee ~/.gitconfig <<-'EOF'
[user]
        name = zhanglikun
        email = x@zahui.fan
        signingkey = zhanglikun
[credential]
        helper = store
[core]
        autocrlf = false
        quotepath = false
[init]
        defaultBranch = master
[pull]
        rebase = false
[commit]
        gpgsign = false
EOF
```

## zsh 配置

### 安装 zsh

```bash
sudo apt install -y zsh
```

### 安装 oh my zsh

<https://ohmyz.sh/#install>

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

```bash
# 修改主题配置
sed -i 's#^ZSH_THEME=.*#ZSH_THEME="example"#g' ~/.zshrc
```

### 安装一些插件

<https://github.com/zsh-users/zsh-autosuggestions>

```bash
sudo apt install -y fzf
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
omz plugin enable z git sudo zsh-autosuggestions zsh-syntax-highlighting fzf
```

## vim

### 修改默认编辑器

```bash
# sudo update-alternatives --config editor
sudo ln -sf /usr/bin/vim.basic /etc/alternatives/editor

# select-editor
echo 'SELECTED_EDITOR="/usr/bin/vim.basic"' > ~/.selected_editor
```

### 安装 vim plug 插件管理工具

```bash
curl -fLo ~/.vim/autoload/plug.vim --create-dirs \
    https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
```

配置文件

```bash
tee ~/.vimrc <<-'EOF'
call plug#begin()

" On-demand loading
Plug 'preservim/nerdtree', { 'on': 'NERDTreeToggle' }
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'

call plug#end()


set paste
"set number

" nerdtree
let NERDTreeWinPos="left"
noremap <F8> :NERDTreeToggle<CR>
let g:NERDTreeDirArrowExpandable = '▸'
let g:NERDTreeDirArrowCollapsible = '▾'


" airline
set laststatus=2  "永远显示状态栏
let g:airline_powerline_fonts = 1  "支持 powerline 字体
let g:airline#extensions#tabline#enabled = 1 "显示窗口tab和buffer
let g:airline_theme='molokai'

if !exists('g:airline_symbols')
let g:airline_symbols = {}
endif
let g:airline_left_sep = '▶'
let g:airline_left_alt_sep = '❯'
let g:airline_right_sep = '◀'
let g:airline_right_alt_sep = '❮'
let g:airline_symbols.linenr = '¶'
let g:airline_symbols.branch = '⎇'
EOF
```

进入 vim 命令界面, 输入 `:PlugInstall` 安装插件

## 常用环境安装

安装 golang python nodejs 查看 [快速搭建环境记录](/posts/5e168f7e)

```bash
curl -fsSL get.docker.com | bash

# 修改一些配置
sudo mkdir -p /etc/docker && sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  },
  "storage-driver": "overlay2",
  "iptables": false
}
EOF

# 当前用户执行docker命令，需要注销用户
sudo usermod -aG docker $USER
```