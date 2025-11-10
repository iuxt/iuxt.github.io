---
title: 使用image-syncer来实现容器镜像同步
categories:
  - 容器
tags: [镜像, 同步, 容器]
abbrlink: le5lzctq
date: 2023-02-15 19:47:31
updated: 2025-11-10 19:05:50
---

`image-syncer` 是一个 docker 镜像同步工具，可用来进行多对多的镜像仓库同步，支持目前绝大多数主流的 docker 镜像仓库服务

- 支持多对多镜像仓库同步
- 支持基于 Docker Registry V2 搭建的 docker 镜像仓库服务 (如 Docker Hub、 Quay、 阿里云镜像服务 ACR、 Harbor 等)
- 同步只经过内存和网络，不依赖磁盘存储，同步速度快
- 增量同步, 通过对同步过的镜像 blob 信息落盘，不重复同步已同步的镜像
- 并发同步，可以通过配置文件调整并发数
- 自动重试失败的同步任务，可以解决大部分镜像同步中的网络抖动问题
- 不依赖 docker 以及其他程序

image-syncer 的官方地址是：<https://github.com/AliyunContainerService/image-syncer>, 是 golang 开发的， 官方没有给打包成 windows 版， 所以 windows 和 mac 用户需要自己编译一下。

## 编译

### 安装 golang 环境

略

### 开始构建

```bat
go build main.go
```

会在当前目录下生成 main.exe, 重命名为 image-syncer.exe

## 使用方法

由于我们需求是进行单镜像同步，所以用不到 image-syncer 的仓库同步功能，仓库同步配置注释在了配置文件中。

### 账号密码配置： auth.yaml

```yaml
registry.cn-hangzhou.aliyuncs.com:
  username: <username>
  password: <password>
docker.io:
  username: <username>
  password: <password>
  insecure: true
```

- 仓库名支持 "registry" 和 "registry/namespace"（v1.0.3 之后的版本） 的形式，需要跟下面 images 中的 registry(registry/namespace) 对应 ,images 中被匹配到的的 url 会使用对应账号密码进行镜像同步, 优先匹配 "registry/namespace" 的形式
- "username": "xxx", // 用户名，可选，（v1.3.1 之后支持）valuse 使用 "`${env}`" 或者 "$env" 类型的字符串可以引用环境变量
- "password": "xxxxxxxxx", // 密码，可选，（v1.3.1 之后支持）valuse 使用 "${env}" 或者 "$env" 类型的字符串可以引用环境变量
- "insecure": true // registry 是否是 http 服务，如果是，insecure 字段需要为 true，默认是 false，可选，支持这个选项需要 image-syncer 版本 > v1.0.1

### 镜像配置 image.yaml

```yaml
quay.io/coreos/kube-rbac-proxy: quay.io/ruohe/kube-rbac-proxy
quay.io/coreos/kube-rbac-proxy:v1.0: quay.io/ruohe/kube-rbac-proxy
quay.io/coreos/kube-rbac-proxy:v1.0,v2.0: quay.io/ruohe/kube-rbac-proxy
quay.io/coreos/kube-rbac-proxy@sha256:14b267eb38aa85fd12d0e168fffa2d8a6187ac53a14a0212b0d4fce8d729598c: quay.io/ruohe/kube-rbac-proxy
quay.io/coreos/kube-rbac-proxy:v1.1:
  - quay.io/ruohe/kube-rbac-proxy1
  - quay.io/ruohe/kube-rbac-proxy2
quay.io/coreos/kube-rbac-proxy:/a+/: quay.io/ruohe/kube-rbac-proxy
```

```txt
同步镜像规则字段，其中条规则包括一个源仓库（键）和一个目标仓库（值）
同步的最大单位是仓库（repo），不支持通过一条规则同步整个namespace以及registry
源仓库和目标仓库的格式与docker pull/push命令使用的镜像url类似（registry/namespace/repository:tag）
源仓库和目标仓库（如果目标仓库不为空字符串）都至少包含registry/namespace/repository
源仓库字段不能为空，如果需要将一个源仓库同步到多个目标仓库需要配置多条规则
目标仓库名可以和源仓库名不同（tag也可以不同），此时同步功能类似于：docker pull + docker tag + docker push

"quay.io/coreos/kube-rbac-proxy": "quay.io/ruohe/kube-rbac-proxy",
"xxxx":"xxxxx",
"xxx/xxx/xx:tag1,tag2,tag3":"xxx/xxx/xx"

当源仓库字段中不包含tag时，表示将该仓库所有tag同步到目标仓库，此时目标仓库不能包含tag
当源仓库字段中包含tag时，表示只同步源仓库中的一个tag到目标仓库，如果目标仓库中不包含tag，则默认使用源tag
源仓库字段中的tag可以同时包含多个（比如"a/b/c:1,2,3"），tag之间通过","隔开，此时目标仓库不能包含tag，并且默认使用原来的tag
当目标仓库为空字符串时，会将源镜像同步到默认registry的默认namespace下，并且repo以及tag与源仓库相同，默认registry和默认namespace可以通过命令行参数以及环境变量配置，参考下面的描述
```

### 同步命令

```bat
image-syncer.exe --proc=6 --auth=auth.yaml --images=image.yaml --retries=3
```
