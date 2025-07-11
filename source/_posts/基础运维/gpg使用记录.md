---
title: gpg使用记录
categories:
  - 基础运维
tags:
  - gpg
  - 加密
abbrlink: e0fe652d
cover: 'https://s3.babudiu.com/iuxt/images/202212261651813.svg'
date: 2022-12-26 08:48:05
---

要了解什么是 GPG，就要先了解 PGP。

1991 年，程序员 Phil Zimmermann 为了避开政府监视，开发了加密软件 PGP。这个软件非常好用，迅速流传开来，成了许多程序员的必备工具。但是，它是商业软件，不能自由使用。所以，自由软件基金会决定，开发一个 PGP 的替代品，取名为 GnuPG。这就是 GPG 的由来。

GPG 有许多用途，本文主要介绍文件加密。至于邮件的加密，不同的邮件客户端有不同的设置。

当前我的系统环境是 `Ubuntu 22.04` gpg 版本是 `gpg (GnuPG) 2.2.27`。

## Key 管理

Key ID: 该 GPG Key 的唯一标识，值为主公钥的指纹，支持多种格式 (Fingerprint, Long key ID, Short key ID)。
UID: 1 个或多个，每个 UID 由 name、email、comment 组成，email 和 comment 可以为空。
Expire: 过期时间，可以为永久。
主秘钥和主公钥（Primary Key）、子秘钥和子公钥（Sub Key）都是成对出现的，其用途也是一致的。
每一对都包含一个 key id 属性（为 public key 的指纹），其中主密钥/主公钥的 key id 就是当前 GPG Key 的 Key ID。

## 创建密钥对

```bash
# 快速生成密钥对
gpg --gen-key

# 交互式创建
gpg --full-gen-key
```

这里我们使用 --full-gen-key 来生成密钥对，首先选择密钥类型，选择 1 (默认) 即可

```bash
$ gpg --full-gen-key

gpg (GnuPG) 2.2.27; Copyright (C) 2021 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Please select what kind of key you want:
   (1) RSA and RSA (default)
   (2) DSA and Elgamal
   (3) DSA (sign only)
   (4) RSA (sign only)
  (14) Existing key from card
Your selection?
```

然后选择密钥长度，没有特殊需求的话保持 3072 的默认选项即可

```bash
RSA keys may be between 1024 and 4096 bits long.
What keysize do you want? (3072)
```

然后设置密钥的有效期，因为我们需要长期使用，所以选择 0 ，密钥永不过期, 也可以输入 2y， 表示 2 年。

```bash
Please specify how long the key should be valid.
         0 = key does not expire
      <n>  = key expires in n days
      <n>w = key expires in n weeks
      <n>m = key expires in n months
      <n>y = key expires in n years
Key is valid for? (0)
```

确定后，依次输入姓名、电子邮件和注释 (可以不填)，然后选择 o 确定, 确定后会出现一个窗口让输入密码，自行设置一个密码。然后密钥就创建成功了， 通过命令 `gpg --list-keys` 可以查看当前的密钥

这里有一串字符。就是 key 的 id，后面的操作都需要这个。

![查看key](https://s3.babudiu.com/iuxt/images/202212271033949.png)

## 创建子密钥

上面创建的是公钥，如果使用这个密钥加密， 那么如果密钥不小心泄露， 就必须吊销整个密钥。所以我们创建子密钥来使用。

```bash
gpg --edit-key 4208C2FA114EE038F9EAD2374808D00D9D910E74
```

进入 gpg 控制台， 输入 `addkey`

输入一些选择， 过期时间建议 2y，然后输入密钥的密码后，在控制台输入 save 保存退出。

## 导出密钥

导出密钥默认是二进制存储，如果需要纯文本，加上 `--armor` 参数

### 导出主密钥

```bash
# 导出公钥和私钥
gpg -o /data/gpg_key --export-secret-keys 4208C2FA114EE038F9EAD2374808D00D9D910E74

# 只导出公钥
gpg -o /data/gpg_pubkey --export 4208C2FA114EE038F9EAD2374808D00D9D910E74
```

主密钥一定要保存好，不要泄露

### 导出子密钥

为什么会存在子密钥？理论上只需一对主密钥，就可以完成所有加密和签名的需要了。而 GPG 支持一对主密钥和若干对子密钥，主要是为了密钥本身的安全考虑。例如需要在多台设备上进行签名和加密操作，如果在每个机器上都使用主密钥，一旦丢失，则所有设备上的信息都将可以被解密。而且除了撤销整个主密钥之外，没有任何其他办法来止损。而如果将主密钥保存在安全的地方，仅在必要的时候使用，其余机器上都使用子密钥。那么如果一台机器上的子密钥丢失，只有这台机器上的信息可能被泄露。而且无需撤销整个主密钥，只需要使用主密钥撤销这个子密钥，然后重新创建一个子密钥即可。

```bash
gpg -o /data/gpg_key.sub --export-secret-subkeys 4208C2FA114EE038F9EAD2374808D00D9D910E74
```

## 查看密钥

```bash
gpg -k                   # 查看公钥
gpg -K                   # 查看私钥
gpg --list-keys          # 查看公钥
gpg --list-secret-keys   # 查看私钥
gpg --list-keys --keyid-format long          # 查看公钥，打印出指纹
gpg --list-secret-keys --keyid-format long   # 查看私钥，打印出指纹
```

### 密钥类型

每个密钥开头都会有这样几个字母：pub/sec/sub/ssb/，表示这个密钥的类型。

在非对称加密算法中，密钥都是成对出现的。pub 和 sec 就分别表示这一对密钥的公钥和私钥，而 sub 和 ssb 则分别表示一对子密钥的公钥和私钥。

| 缩写  | 作用  |
| --- | --- |
| pub | 主公钥 |
| sec | 主私钥 |
| sub | 子公钥 |
| ssb | 子私钥 |

### 密钥用途

每个密钥旁边都会有方括号包围的一个或多个字母，可能取值有 E/S/C/A，表示这个密钥的用途。每个值的含义如下：

| 缩写  | 全称             | 作用               |
| --- | -------------- | ---------------- |
| E   | Encryption     | 加密               |
| S   | Signing        | 签名               |
| C   | Certification  | 认证其他子密钥或 uid     |
| A   | Authentication | 身份认证，例如用于 SSH 登录 |

### 导出公钥

> 公钥是需要公开的，可以将公钥发送给别人，别人用于加密

```bash
gpg --armor --output /data/public-key.txt --export 4208C2FA114EE038F9EAD2374808D00D9D910E74
```

#### 上传公钥

> 也可以将公钥上传到公共服务器上

```bash
gpg --send-keys 4208C2FA114EE038F9EAD2374808D00D9D910E74
```

### 导出吊销证书

```bash
gpg --generate-revocation 4208C2FA114EE038F9EAD2374808D00D9D910E74
```

不过实际上在生成密匙时就已经生成了一份吊销证书了，放在这个目录下面 `~/.gnupg/openpgp-revocs.d/`

## 删除密钥

```bash
# 删除私钥
gpg --delete-secret-keys 4208C2FA114EE038F9EAD2374808D00D9D910E74

# 删除公钥
gpg --delete-keys 4208C2FA114EE038F9EAD2374808D00D9D910E74
```

### 删除子密钥

```bash
gpg --expert --edit-key x@zahui.fan
gpg> list

pub  rsa3072/1065DD1957C255D3
     创建于：2022-12-27  有效至：永不       可用于：SC
     信任度：未知        有效性：未知
ssb  rsa3072/77FD7CF225B6A92B
     创建于：2022-12-27  有效至：永不       可用于：E
ssb  rsa3072/CEA7CACC468ACDFE
     创建于：2022-12-27  有效至：2024-12-26  可用于：S
ssb  rsa3072/539C73E4E4949E97
     创建于：2022-12-27  有效至：2024-12-26  可用于：E
[ 未知 ] (1). zhanglikun (张理坤) <x@zahui.fan>

gpg>
gpg> key 77FD7CF225B6A92B
gpg> delkey
gpg> save
```

## 使用密钥

### 主密钥离线使用

```bash
gpg -K
[keyboxd]
---------
sec#  rsa3072 2022-12-27 [SC]
      3CBE03848A00F025624C14B41065DD1957C255D3
uid             [ 未知 ] zhanglikun (张理坤) <x@zahui.fan>
ssb   rsa3072 2022-12-27 [E]
ssb   rsa3072 2022-12-27 [S] [有效至：2024-12-26]
ssb   rsa3072 2022-12-27 [E] [有效至：2024-12-26]
```

注意这里是 `sec#` 不是 `sec`, 说明没有主密钥。

### 导入密钥

在{%label 自己的 red %}电脑上面

```bash
gpg --import /data/gpg_key.sub
```

### 加密

```bash
gpg -r iuxt@qq.com -e test.txt
```

### 解密

```bash
gpg test.txt.gpg
```

### 签名

有时，我们不需要加密文件，只需要对文件签名，表示这个文件确实是我本人发出的。sign 参数用来签名。

```bash
gpg --sign test.txt
```

然后生成了一个 test.txt.gpg 文件，我们打开这个文件后，发现这也是一个二进制的数据，这并不是加密后的数据，与上边的二进制数据不一样。如果想生成 ASCII 码的签名文件，可以使用 clearsign 参数

```bash
gpg --clearsign test.txt
```

如果想生成单独的签名文件，与文件内容分开存放，可以使用 detach-sign 参数。

```bash
gpg --detach-sign test.txt
```

是一个二进制的数据，如果想采用 ASCII 码形式，要加上 armor 参数

```bash
gpg --armor --detach-sign test.txt
```

### 签名 + 加密

id 也可以换成 email， 可以加多个 --recipient 参数

```bash
gpg --local-user [发信者ID] --recipient [接收者ID] --armor --sign --encrypt test.txt
```

local-user 参数指定用发信者的私钥签名，recipient 参数指定用接收者的公钥加密，armor 参数表示采用 ASCII 码形式显示，sign 参数表示需要签名，encrypt 参数表示指定源文件。

### 验证签名

我们收到别人签名后的文件，需要用对方的公钥验证签名是否为真。verify 参数用来验证

```bash
gpg --verify test.txt.asc test.txt
```

## 配合 GitHub 使用

首先，需要让 Git 知道签名所用的 GPG 密钥 ID

```bash
git config --global user.signingkey {key_id}
```

然后，在每次 commit 的时候，加上 -S 参数，表示这次提交需要用 GPG 密钥进行签名：

```bash
git commit -S -m "..."
```

如果觉得每次都需要手动加上 -S 有些麻烦，可以设置 Git 为每次 commit 自动要求签名：

```bash
git config --global commit.gpgsign true
```

然后添加变量到 `.bashrc`

```bash
export GPG_TTY=$(tty)
```

commit 时皆会弹出对话框，需要输入该密钥的密码，以确保是密钥拥有者本人操作
