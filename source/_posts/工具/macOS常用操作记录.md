---
title: macOS常用操作记录
categories:
  - 工具
tags: [macOS, 配置记录, 常用操作]
abbrlink: lrr6ze9h
cover: 'https://s3.babudiu.com/iuxt/public/macos.svg'
date: 2024-01-24 10:54:44
updated: 2025-10-06 21:33:41
---

## HomeBrew

### 安装 HomeBrew

<https://brew.sh/zh-cn/>

### brew 常用操作

```bash
# 更新 brew
brew update

# 搜索软件包
brew search <package name>

# 查看软件包信息
brew info <package name>

# 查看软件包主页/官网
brew home <package name>

# 查看一下安装位置
brew --prefix mysql@8.0
```

### 常用工具安装

```bash
# 安装xcode工具集
终端执行git命令。系统会自动弹窗，点击安装即可。

# 安装git lfs
brew install git-lfs
git lfs install

# 安装常用软件
brew install stats clash-verge-rev keepassxc iterm2 orbstack iina squirrel visual-studio-code orbstack obsidian rustdesk lrzsz trzsz-ssh typora piclist keka python@3.12 mysql-client balenaetcher pixpin uninstallpkg
```

### 进程管理

```bash
# 查看受管理的服务
brew services

# 直接启动，不配置开机自启动
brew services run mysql@8.0

# 停止服务
brew services kill mysql@8.0

# 重启服务，配置开机自启动
brew services restart mysql@8.0

# 启动并且配置开机自启动
brew services start mysql@8.0

# 停止服务，取消开机自启动
brew services stop mysql@8.0
```

### 安装卸载

```bash
# 查看需要升级的软件包
brew outdated

# 锁定指定软件包的版本
brew pin <package name>

# 解除对指定软件包版本的锁定
brew unpin <package name>

# 更新指定的软件包
brew update <package name>

# 更新所有需要升级的软件包
brew upgrade

# 允许 cask 仓库的软件也能被更新（建议关闭所有软件的内置更新，仅通过 brew 更新）
brew upgrade --greedy

# 查看已经安装的所有包
brew list

# 查看有哪些旧软件包会被清理
brew cleanup --dry-run

# 清理旧软件包
brew cleanup

# 列出已经安装的软件包
brew list

# 列出已经安装的软件包及版本信息
brew list --versions

# 以树状图展示「已安装包」的依赖信息
brew deps --installed --tree

# 安装指定的版本
brew install mysql@5.7

# 卸载包
brew uninstall font-meslo-lg-nerd-font
```

### 安装字体

```bash
# brew 添加字体库
brew tap homebrew/cask-fonts

# 搜索可用 Nerd Font 字体
brew search nerd-font

# 安装适配了powerlevel10k的字体
brew install font-meslo-for-powerlevel10k

# 安装「霞鹜文楷」字体
brew install font-lxgw-wenkai

# Maple Mono
brew install --cask font-maple-mono
# Maple Mono NF
brew install --cask font-maple-mono-nf
# Maple Mono NF CN
brew install --cask font-maple-mono-nf-cn
```

### 使用 GNU 工具

macOS 自带的命令是 BSD 命令，有些语法和 Linux 不一样，可以手动安装 GNU 版本的工具替代

```bash
brew install gnu-sed
brew install grep
brew install gnu-tar
```

可以直接在命令前加 `g` 来调用，比如 `ggrep` `gtar` `gsed` 来直接使用，也可以配置在 zshrc 里，配置在 $PATH 之前

```bash
export  PATH="/opt/homebrew/opt/gnu-tar/libexec/gnubin:$PATH"
export  PATH="/opt/homebrew/opt/gnu-sed/libexec/gnubin:$PATH"
export  PATH="/opt/homebrew/opt/grep/libexec/gnubin:$PATH"
```

## 终端配置

### zsh 配置

```bash
# 安装字体
brew install font-lxgw-wenkai

# 安装Oh My Zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# 安装powerlevel10k主题
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
# 修改一下.zshrc文件里面的ZSH_THEME为powerlevel10k/powerlevel10k
# sed -i 's#^ZSH_THEME=.*#ZSH_THEME="powerlevel10k/powerlevel10k"#g' ~/.zshrc

# 安装两个常用的插件
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
omz plugin enable zsh-autosuggestions zsh-syntax-highlighting z
```

### 安装 FZF

```bash
brew install fzf
$(brew --prefix)/opt/fzf/install
```

### ls 查看的文件颜色

mac 的 ls 命令默认的颜色比较难看, 比如可执行程序显示红色, 可以通过这种方式修改一下.

修改前:

![image.png|790](https://s3.babudiu.com/iuxt/images/202401241214412.png)

配置在.zshrc 内

```bash
# 终端配色 比如文件夹是什么颜色, 链接是什么颜色等
export CLICOLOR=1
export LSCOLORS=ExGxFxdaCxDaDahbadeche
```

修改后:

![image.png|799](https://s3.babudiu.com/iuxt/images/202401241215880.png)

## 在终端中使用 code 命令启动 vscode

先安装 code：打开 VSCode -> 查看 -> 命令面板 -> 输入 shell command –> 点击 `Shell Command: Install 'code' command in PATH`

然后在终端中可以使用 `code` 命令打开 vscode 了, 或者 `code .` 打开当前目录

| 常用命令 | 用途 |
| ---- | ---- |
| code | 打开 vscode |
| code . | vscode 打开当前目录 |
| code /Users/iuxt/code | 打开指定的目录 |

## 系统设置

### 防止自动睡眠

在显示器 高级里面 打开 使用电源适配器供电且显示器关闭时, 防止自动进入睡眠选项。

![B7491094-21E7-4D08-9603-5D1574639FDD.png|484](https://s3.babudiu.com/iuxt/images/202401241101946.png)

### 安装根证书

打开钥匙串 -- 登录 -- 证书 将证书文件拖进来
然后双击证书, 查看信任, 设置为始终信任

![0E07356E-2BBC-4C2C-BC5B-187C697CAECB.png|672](https://s3.babudiu.com/iuxt/images/202401241306196.png)

### finder 访达个人收藏变成英文

```bash
touch ~/Desktop/.localized
```

重启 finder 后可恢复中文。

## 提示 程序损坏,需要移动到废纸篓

或者提示应用未验证等, 可以到访达里, 找到应用程序, 按下 control 键点击, 选择打开

![image.png|624](https://s3.babudiu.com/iuxt/images/202401241142254.png)

  或者到系统设置的隐私与安全性里进行打开

或者去除苹果的 quarantine 属性, 执行这条命令可能需要 APP 管理 这个权限。

```bash
sudo xattr -r -d com.apple.quarantine /Applications/WebStrom.app

# 或者删除所有属性
# sudo xattr -cr /Applications/WebStrom.app
```

## 常见的系统文件位置

| 内容 | 位置 |
| ---- | ---- |
| 开机启动项 | /Library/LaunchDaemons/ |
| 开机启动项 | /Library/LaunchAgents/ |
| 开机启动项 (个人) |  ~/Library/LaunchAgents |
| 完全磁盘访问权限 | /Library/PrivilegedHelperTools/ |

## 远程访问 Windows

可以使用 parallels client (appstore 就有) 或者使用微软官方的 ~~microsoft remote desktop 客户端 (商店版需要美区 apple id),~~ Windows App 现在国区就可以下载的到. 或者在微软官方下载

[正式版pkg包(程色图标)](https://go.microsoft.com/fwlink/?linkid=868963)
[beta版zip包(蓝色图标)](https://install.appcenter.ms/orgs/rdmacios-k2vy/apps/microsoft-remote-desktop-for-mac/distribution_groups/all-users-of-microsoft-remote-desktop-for-mac)

## 解包 pkg

 部分 pkg 包里面有私货, 比如微软的 Edge 浏览器, 我们可以通过解包 pkg 直接提取 `.app` 文件, 手动拷贝到应用程序下。

```bash
mkdir temp && cd temp
xar -xf Setup.pkg
# 或者使用 pkgutil --expand edge.pkg ./edge
cat mac.pkg/Payload | cpio -i
```

## vim 的配置

### 安装 Plug 插件管理工具

<https://github.com/junegunn/vim-plug>

```bash
curl -fLo ~/.vim/autoload/plug.vim --create-dirs \
    https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
```

Plug 的配置文件在 `.vimrc` 里面，在 `call plug#begin()` 和 `call plug#end()` 之间

```bash
call plug#begin()
  Plug 'preservim/nerdtree'
call plug#end()
```

配置修改完成后，在 vim 命令界面，输入 PlugInstall 自动安装插件。

### 安装 NerdTree 目录树工具

<https://github.com/preservim/nerdtree>

使用 Plug 安装：

```bash
Plug 'preservim/nerdtree', { 'on': 'NERDTreeToggle' }
```

配置文件 `~/.vimrc` 配置 F8 为快捷键:

```bash
" nerdtree
let NERDTreeWinPos="left"
noremap <F8> :NERDTreeToggle<CR>
let g:NERDTreeDirArrowExpandable = '▸'
let g:NERDTreeDirArrowCollapsible = '▾'
```

### 安装 airline 主题

<https://github.com/vim-airline/vim-airline>

```bash
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'
```

主题配置 `~/.vimrc`：

```bash
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
```

### 最终的 vim 配置文件如下

`vim ~/.vimrc`

```bash
call plug#begin()

Plug 'preservim/nerdtree', { 'on': 'NERDTreeToggle' }
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'

call plug#end()


set paste
set number

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
```

## 云服务文件夹

### 第三方同步盘位置

```bash
${HOME}/Library/CloudStorage
```

### 在家目录创建 iCloud 快捷方式

```bash
ln -s "${HOME}/Library/Mobile Documents/com~apple~CloudDocs" ~/iCloud
```

## 重置网卡信息

```bash
sudo rm -rf /Library/Preferences/SystemConfiguration/preferences.plist
sudo rm -rf /Library/Preferences/SystemConfiguration/NetworkInterfaces.plist*
```

## 开发组件

### zlib 库找不到

```bash
# 安装zlib库
brew install zlib

# 控制台会输出配置, 根据需要贴到 ~/.zshrc 里
#For compilers to find zlib you may need to set:
export LDFLAGS="$LDFLAGS -L$(brew --prefix zlib)/lib"
export CPPFLAGS="$CPPFLAGS -I$(brew --prefix zlib)/include"

#For pkg-config to find zlib you may need to set:
export PKG_CONFIG_PATH="$PKG_CONFIG_PATH:$(brew --prefix zlib)/lib/pkgconfig"
```

### 安装 mysqlclient

`pip install mysqlclient` 报错，需要先安装依赖包 `brew install mysql-client` 然后配置环境变量, 添加以下 3 行到 `.zshrc`

```bash
export PATH="$(brew --prefix mysql-client)/bin:$PATH"
export LDFLAGS="$LDFLAGS -L$(brew --prefix mysql-client)/lib"
export CPPFLAGS="$CPPFLAGS -I$(brew --prefix mysql-client)/include"
```

如果报错 `ld: library 'ssl' not found` ，需要安装 openssl `brew install openssl` 环境变量需要增加：

```bash
export LDFLAGS="$LDFLAGS -L$(brew --prefix openssl)/lib"
export CPPFLAGS="$CPPFLAGS -I$(brew --prefix openssl)/include"
```

如果报错 `ld: library 'zstd' not found`， 需要安装 zstd `brew install zstd` 环境变量需要增加：

```bash
export LDFLAGS="$LDFLAGS -L$(brew --prefix zstd)/lib"
```

### 使用 pkg-config 查找参数

```bash
# 安装pkg-config
brew install pkg-config

# 查看所有的pkg-config路径，需要配置到变量 PKG_CONFIG_PATH 中
# Intel芯片的Mac
export PKG_CONFIG_PATH=$(find /usr/local/Cellar -name 'pkgconfig' -type d | grep lib/pkgconfig | tr '\n' ':' | sed s/.$//)

# Apple芯片的Mac
export PKG_CONFIG_PATH=$(find /opt/homebrew/Cellar -name 'pkgconfig' -type d | grep lib/pkgconfig | tr '\n' ':' | sed s/.$//)

# 查看openssl的 CPPFLAGS 参数， 需要配置到变量 CPPFLAGS 中
❯ pkg-config --cflags openssl
-I/usr/local/Cellar/openssl@3/3.3.1/include

# 查看openssl的 LDFLAGS 参数， 需要配置到变量 LDFLAGS 中
❯ pkg-config --libs openssl
-L/usr/local/Cellar/openssl@3/3.3.1/lib -lssl -lcrypto
```

## 挂载 EFI

```bash
# 查看
sudo diskutil list
```

![image.png|652](https://s3.babudiu.com/iuxt/images/202401241434966.png)

```bash
# 挂载
sudo diskutil mount disk0s1

# 卸载
sudo diskutil umount disk0s1
```

## 卸载输入法

搜狗输入法 macOS 版安装程序提供了卸载选项, 可以使用安装程序来进行卸载. 可是微信输入法没有, 删除方法如下:

### 系统设置中移除输入法

在系统设置中移除微信输入法

### 停止输入法

打开活动监视器, 找到微信输入法, 停止进程

### 删除输入法

打开访达, 按下 `shift + command + G` 输入：`/Library/Input Methods` 回车
选中 WeType ，右键选择 移到废纸篓
`${HOME}/Library/Application Support` 删除 `wetype`

## 查看 Bundle ID

```bash
codesign -dr - /Applications/Microsoft\ Edge.app

# 或者：
osascript -e 'id of app "iterm2"'
```

## Rosetta

终端切换到 `x86_64` 架构

```bash
arch -x86_64 zsh
```

安装 Rosetta 2

```bash
softwareupdate --install-rosetta --agree-to-license
```
