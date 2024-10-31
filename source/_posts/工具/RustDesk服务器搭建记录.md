---
title: RustDesk服务器搭建记录
categories:
  - 工具
tags:
  - 配置记录
  - 开源软件
  - 部署
  - 搭建
abbrlink: cb24765f
cover: 'https://static.zahui.fan/public/RustDesk.svg'
date: 2024-03-13 16:20:02
---

RustDesk 是一个远程控制工具，开源跨平台，可以使用官方的服务器，也可以自建服务器使用。服务器分为开源版 oss 和付费版 pro，我使用的是开源版。

## 部署服务器

服务端是 rust 开发的，单文件直接运行即可。你可以使用你喜欢的进程管理工具来管理，比如 nodejs 写的 pm2， Python 写的 supervisor， 或者使用 docker 运行，我选择 docker。

### 启动命令

```bash
docker run -td --name hbbs \
    -v ./data:/root \
    --net=host \
    --restart unless-stopped \
    rustdesk/rustdesk-server hbbs

docker run -td --name hbbr \
    -v ./data:/root \
    --net=host \
    --restart unless-stopped \
    rustdesk/rustdesk-server hbbr
```

### 文件说明

data 目录（容器内的 root 目录）下的文件：

| 文件名            | 说明                  |
| -------------- | ------------------- |
| db 开头的文件       |  SQLite 数据库文件       |
| id_ed25519     | 私钥                  |
| id_ed25519.pub | 公钥，文件内容就是客户端需要的 key |

### 网络端口

我使用了 host 网络，如果使用 bridge 网络（docker 默认网络），需要映射以下端口

#### hbbs 服务

| 端口    | 类型  | 说明                                                 |
| ----- | --- | -------------------------------------------------- |
| 21115 | tcp | used for the NAT type test                         |
| 21116 | tcp | used for TCP hole punching and connection service  |
| 21116 | udp | used for the ID registration and heartbeat service |
| 21118 | tcp | web 使用（开源版本暂时没有 web 页面）                            |

#### hbbr 服务

| 端口    | 类型  | 说明                          |
| ----- | --- | --------------------------- |
| 21117 | tcp | used for the Relay services |
| 21119 | tcp | web 使用（开源版本暂时没有 web 页面）     |

## 客户端配置

在 `设置` --> `网络` 里面配置 `ID 服务器`, ID 服务器填 你的服务器 `IP:21116` 或者直接填写域名，不写端口默认是 21116，另外两个地址可以不填，RustDesk 会自动推导（如果没有特别设定），中继服务器指的是 hbbr（21117）端口。

key 可以填可以不填， 不填的话， 连接不能加密。key 在 hbbs 服务的控制台日志里有， `cat id_ed25519.pub` 也可以看到 key

![image.png|533](https://static.zahui.fan/images/202403131652971.png)

到此为止就已经可以使用了

## 安全性

考虑到上面配置不加密的话，任何人配置上了我的服务器地址都可以使用我的服务了（连接我的电脑还需要 id 和密码），不太安全，所以建议开启加密连接。

`hbbr` 和 `hbbs` 增加启动参数 ` -k _`， docker 启动命令为：

```bash
docker run -td --name hbbs \
    -v ./data:/root \
    --net=host \
    --restart unless-stopped \
    rustdesk/rustdesk-server hbbs -k _

docker run -td --name hbbr \
    -v ./data:/root \
    --net=host \
    --restart unless-stopped \
    rustdesk/rustdesk-server hbbr -k _
```

这个时候再次尝试连接：
![image.png|808](https://static.zahui.fan/images/202403131705610.png)

配置了正确的 key 后，可以正常使用。

## 常见问题

### 第一次无法连接

可以尝试强制中继服务器连接， 只需要在 id 后面加上 `/r` 即可。如
![image.png](https://static.zahui.fan/images/202403152226765.png)

连接成功后，可以打开 强制走中继连接

### 将配置放在文件名中（仅支持 Windows）

将安装程序修改一下名字，按照这个规则：

```bat
rustdesk-host=<host-ip-or-name>,key=<public-key-string>.exe
```

安装完成后可以省去配置。
