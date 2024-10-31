---
title: zookeeper集群搭建
categories:
  - 日志
tags:
  - HA
  - 搭建
  - 配置记录
  - 有状态服务
abbrlink: sds4db
cover: 'https://static.zahui.fan/public/apache_zookeeper.svg'
date: 2021-05-20 18:12:46
---

## 下载

```bash
wget https://dlcdn.apache.org/zookeeper/zookeeper-3.8.4/apache-zookeeper-3.8.4-bin.tar.gz
```

Zookeeper 是为其他分布式程序提供服务的，所以本身自己不能随便就挂了，所以 zookeeper 自身的集群机制就很重要。zookeeper 的集群机制采用的是半数存活机制，也就是整个集群节点中有半数以上的节点存活，那么整个集群环境可用。这也就是说们的集群节点最好是奇数个节点。

```bash
yum install -y java-1.8.0-openjdk
```

## 创建配置文件

```bash
mkdir -p /data/zookeeper_{log,data}
```

调整配置文件 `/data/apache-zookeeper-3.8.4-bin/conf/zoo.cfg`

```ini
tickTime=2000
initLimit=10
syncLimit=5
dataLogDir=/data/zookeeper_log
dataDir=/data/zookeeper_data
clientPort=2181
autopurge.snapRetainCount=500
autopurge.purgeInterval=24
server.1=10.0.0.11:2888:3888
server.2=10.0.0.12:2888:3888
server.3=10.0.0.13:2888:3888
```

## myid 配置

除了修改 zoo.cfg 配置文件外,zookeeper 集群模式下还要配置一个 myid 文件,这个文件需要放在 dataDir 目录下
这个文件里面有一个数据就是 A 的值（该 A 就是 zoo.cfg 文件中 server.A=B:C:D 中的 A）,在 zoo.cfg 文件中配置的 dataDir 路径中创建 myid 文件。

不同服务器配置不一样

```bash
# 第一台服务器
echo "1" > /data/zookeeper_data/myid

# 第二台服务器
echo "2" > /data/zookeeper_data/myid

# 第三台服务器
echo "3" > /data/zookeeper_data/myid
```

## 常用命令

```bash
# 启动zookeeper
/data/apache-zookeeper-3.8.4-bin/bin/zkServer.sh start

# 查看zookeeper服务状态
/data/apache-zookeeper-3.8.4-bin/bin/zkServer.sh status
```