---
title: harbor接入外部trivy镜像漏洞扫描
categories:
  - 基础运维
tags:
  - harbor
  - 镜像
  - 容器
  - 漏洞扫描
abbrlink: 8b932a1b
cover: 'https://static.zahui.fan/images/202305181012814.jpg'
date: 2023-05-12 15:55:43
---

harbor 接入 trivy 漏洞扫描, 用到的开源工具 [harbor-scanner-trivy](https://github.com/aquasecurity/harbor-scanner-trivy)

## 安装

需要依赖 Redis, 先安装 Redis

### 安装 trivy

trivy 是扫描核心组件， 需要安装，参考 trivy 官网安装文档

<https://aquasecurity.github.io/trivy/v0.41/getting-started/installation/>

```bash
RELEASE_VERSION=$(grep -Po '(?<=VERSION_ID=")[0-9]' /etc/os-release)
cat << EOF | sudo tee -a /etc/yum.repos.d/trivy.repo
[trivy]
name=Trivy repository
baseurl=https://aquasecurity.github.io/trivy-repo/rpm/releases/$RELEASE_VERSION/\$basearch/
gpgcheck=1
enabled=1
gpgkey=https://aquasecurity.github.io/trivy-repo/rpm/public.key
EOF
sudo yum -y install trivy
```

trivy 首次运行会从 github 下载漏洞数据库，需要确保机器可以连接 GitHub，执行 `trivy image --download-db-only` 会下载 db，db 数据存储在 `~/.cache/trivy`

### 安装 scanner-trivy

开源地址：<https://github.com/aquasecurity/harbor-scanner-trivy>

scanner-trivy 是通过环境变量读取配置

启动命令：

```bash
SCANNER_API_SERVER_ADDR=:8181 SCANNER_REDIS_URL=redis://localhost:6379 ./scanner-trivy
```

或者通过 supervisor 运行

```bash
[program:trivy]
numprocs=1
user=root
command=/data/server/trivy/scanner-trivy
directory=/data/server/trivy/
redirect_stderr=true
stdout_logfile=/data/logs/trivy.log
autostart=true
autorestart=true
startsecs=10
environment=SCANNER_API_SERVER_ADDR=:8181,SCANNER_REDIS_URL=redis://localhost:6379
```

## 使用

harbor 系统管理 审查服务 扫描器 里面添加 trivy 地址：

![trivy扫描器](https://static.zahui.fan/images/202305121619236.png)

然后就可以正常扫描镜像了

![扫描结果](https://static.zahui.fan/images/202305121624912.png)

## 其他

### 使用国内镜像更新

借助 [oras](https://github.com/oras-project/oras) 来拉取镜像， 需要先安装 [oras](https://github.com/oras-project/oras)

更新数据库的脚本：

```bash
#!/bin/bash

cd /tmp

rm -rf /tmp/trivy && rm -rf /tmp/db.tar.gz

if ! /usr/local/bin/oras  pull ghcr.nju.edu.cn/aquasecurity/trivy-db:2 -v --insecure ;then
    echo "pull trivy-db failed" >> /tmp/trivy.log
    exit
fi

mkdir /tmp/trivy && tar -zxvf /tmp/db.tar.gz -C /tmp/trivy
/bin/cp -rfp /tmp/trivy/* /root/.cache/trivy/db/
rm -rf /tmp/trivy && rm -rf /tmp/db.tar.gz

rm -rf /tmp/trivy-java && rm -rf /tmp/javadb.tar.gz
if ! /usr/local/bin/oras  pull ghcr.nju.edu.cn/aquasecurity/trivy-java-db:1  -v --insecure ;then
    echo "pull trivy-java-db failed" >> /tmp/trivy.log
    exit
fi

mkdir /tmp/trivy-java  && tar -zxvf /tmp/javadb.tar.gz -C /tmp/trivy-java
/bin/cp -rfp /tmp/trivy-java/* /root/.cache/trivy/java-db
rm -rf /tmp/trivy-java && rm -rf /tmp/javadb.tar.gz
```

使用 `crontab` 执行此脚本， 一天一次即可。
