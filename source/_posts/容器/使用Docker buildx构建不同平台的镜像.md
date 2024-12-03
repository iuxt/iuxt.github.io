---
title: 使用 docker buildx 构建不同平台的镜像
abbrlink: ffacccf0
categories:
  - 容器
tags:
  - Container
  - Docker
cover: https://static.zahui.fan/images/202412031037042.png
date: 2021-09-29 16:51:31
---

> 一直使用 oracle 提供的免费 arm 云服务器，自己的 pc 又是 x86 架构，x86 构建出来的镜像不能在 arm 平台使用

使用 buildx 可以生成跨平台镜像，跨平台镜像就是同一个镜像名称，同一个 tag，但是 arm 机器和 amd64 机器拉下来的镜像 hash 是不一样的

## 创建 docker buildx 构建环境

> 这里的 driver 有两种，一种是 docker-container，一种是 docker，构建多平台版本只能使用 docker-container, --use 是将切换为默认

```bash
docker buildx create --use --name buildx --node buildx --driver-opt network=host
```

## 准备 qemu 模拟器

构建不通架构的镜像是通过 qemu 来模拟的，你会发现构建过程中，和 build 机器同架构的会构建很快，不同架构构建很慢。

```bash
# 安装全部模拟器
docker run --privileged --rm tonistiigi/binfmt --install all

# 安装指定的模拟器
docker run --privileged --rm tonistiigi/binfmt --install arm64,riscv64,arm

# 卸载指定模拟器
docker run --privileged --rm tonistiigi/binfmt --uninstall qemu-aarch64
```

## buildx 构建镜像

准备一个简单的 Dockerfile

```dockerfile
FROM ubuntu
CMD ["uname", "-i"]
```

```bash
docker buildx build --push \
    --tag iuxt/ubuntu:latest \
    --platform linux/amd64,linux/arm64 .
```

这个时候登录 dockerhub 查看

![docker镜像](https://static.zahui.fan/images/20220518103637.png)
可以看到已经是多平台支持了。

```bash
docker run --rm iuxt/test

> x86_64
```

正常构建的时候，也需要考虑到不同的架构区别，在构建命令里面做判断，比如

**Dockerfile**

```dockerfile
FROM ubuntu:latest
ADD build.sh /
RUN /build.sh

ENV REDIS_ADDR=127.0.0.1:6379
ENV REDIS_PASSWORD=111111

CMD /redis_exporter -redis.addr ${REDIS_ADDR} -redis.password ${REDIS_PASSWORD}
```

**build.sh**

```bash
apt update && apt install curl -y && apt clean all
cd /tmp/ 

case $(uname -m) in
x86_64)
    filename="redis_exporter-v1.37.0.linux-amd64.tar.gz"
    bin="redis_exporter-v1.37.0.linux-amd64/redis_exporter"
    ;;
aarch64)
    filename="redis_exporter-v1.37.0.linux-arm64.tar.gz"
    bin="redis_exporter-v1.37.0.linux-arm64/redis_exporter"
    ;;
*)
    echo "don't support $(uname -i)"
    ;;
esac

curl -OL https://github.com/oliver006/redis_exporter/releases/download/v1.37.0/$filename
tar xf $filename && mv $bin /
rm -rf /tmp/*
```

## docker buildx 常用命令

```bash
# 查看所有的builder列表
docker buildx ls

# 删除创建的builder
docker buildx rm mybuilder

# 切换默认builder
docker buildx use mybuilder
```
