---
title: WSL2 - Ubuntu配置记录
categories:
  - Windows
tags:
  - Windows
  - WSL
  - wsl2
  - 配置记录
abbrlink: lmeiruso
cover: 'https://static.zahui.fan/public/wsl.svg'
date: 2023-09-11 14:45:16
---

## WSL 防火墙规则

```powershell
Get-NetAdapter

New-NetFirewallRule -DisplayName "WSL" -Direction Inbound  -InterfaceAlias "vEthernet (WSL)"  -Action Allow
```

## 基础环境配置

### 更换源

使用中科大的源: <https://mirrors.ustc.edu.cn/help/ubuntu.html>

```bash
# 老版本Ubuntu
# sudo sed -i 's@//.*.ubuntu.com@//mirrors.ustc.edu.cn@g' /etc/apt/sources.list

# Ubuntu 24 及以上
sudo sed -i 's@//.*.ubuntu.com@//mirrors.ustc.edu.cn@g' /etc/apt/sources.list.d/ubuntu.sources
```

### 安装常用的包

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y zip libmysqlclient-dev build-essential libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev lrzsz
```

### 当前用户免 sudo 密码

```bash
sudo tee /etc/sudoers.d/iuxt <<-EOF
%sudo   ALL=(ALL:ALL) NOPASSWD:ALL
$USER   ALL=(ALL:ALL) NOPASSWD:ALL
EOF
```

### WSL 开启 systemd 支持 (仅支持 WSL2)

```bash
sudo touch /etc/startup.sh
sudo chmod +x /etc/startup.sh
sudo tee /etc/wsl.conf <<-'EOF'
[boot]
systemd=true
command=/etc/startup.sh
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

### 安装主题

<https://github.com/romkatv/powerlevel10k>

```bash
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k

# 修改主题配置
sed -i 's#^ZSH_THEME=.*#ZSH_THEME="powerlevel10k/powerlevel10k"#g' ~/.zshrc
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

安装 zssh, 查看 [改造windows-terminal支持lrzsz](/posts/e48170f8)

## 常用 alias

```vim
# 模仿macOS打开访达，使用 open . 在此处打开文件管理器。
alias open='explorer.exe'
```

## 常用软链接

```bash
ln -sf /mnt/c/Users/iuxt/Desktop ~
ln -sf /mnt/c/Users/iuxt/Documents ~
ln -sf /mnt/c/Users/iuxt/Downloads ~
ln -sf /mnt/c/Users/iuxt/OneDrive ~
```

## tssh

[trzsz 使用记录](/posts/shqeci/)
