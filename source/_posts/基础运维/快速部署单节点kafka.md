---
title: 快速部署单节点kafka
categories:
  - 基础运维
tags:
  - Kafka
  - Docker
abbrlink: slhl3q
cover: ''
date: 2024-10-17 14:09:25
---

如果需要集群部署的文档你可以在站内搜搜，之前写过。

单节点部署，不考虑高可用性，只求快速搭建出环境，一般都是自己开发或者运维做测试使用。或者业务的测试环境为了节省服务器资源采取的方案。不过我不一样，我们测试环境资源充足，我只是单纯的懒。

## 第一步 安装 Docker

部署是基于 docker 来部署的，所以要先安装 docker，安装 docker 的过程可以看这个文档：[快速搭建环境记录](/posts/5e168f7e)

## 第二步 选择镜像

打开 docker 镜像仓库 `https://hub.docker.com` 找了找， 按照下载量排序，有以下几种，我选择 bitnami 打包的 kafka

![image.png|1048](https://static.zahui.fan/images/202410171116643.png)

## 第三步 编写启动脚本

我个人不喜欢 docker-compose ，总觉得这个东西不伦不类的，论灵活不如 bash 脚本，论专业不如 Kubernetes 甚至 Docker Swarm，还不如自己写脚本来做。

需要创建一个 docker network ，默认的 bridge 网络不能通过 dns 名字找到对应的容器。

```bash
#!/bin/bash

mkdir kafka-data
sudo chown -R 1001:1001 kafka-data

sudo docker network create ops

sudo docker run -d --name kafka-server --hostname kafka-server \
    --network ops \
    -e KAFKA_CFG_NODE_ID=0 \
    -e KAFKA_CFG_PROCESS_ROLES=controller,broker \
    -e KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093 \
    -e KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT \
    -e KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@kafka-server:9093 \
    -e KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER \
    -e KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE=true \
    -v ./kafka-data:/bitnami/kafka \
    -p 9092:9092 \
    -p 9093:9093 \
    bitnami/kafka:3.8.0
```

其中：

kafka 的启动用户 id 是 1001，所以需要给 kafka-data 目录授权，不然可能会不能写入挂载的目录。

## 第四步 使用

### 控制台生产

```bash
docker run -it --network ops --rm bitnami/kafka:3.8.0 kafka-console-producer.sh --producer.config /opt/bitnami/kafka/config/producer.properties --bootstrap-server kafka-server:9092 --topic iuxt_test
```

![image.png](https://static.zahui.fan/images/202410171408280.png)

### 控制台消费

```bash
docker run -it --network ops --rm bitnami/kafka:3.8.0 kafka-console-consumer.sh --consumer.config /opt/bitnami/kafka/config/consumer.properties --bootstrap-server kafka-server:9092 --topic iuxt_test --from-beginning
```

![image.png](https://static.zahui.fan/images/202410171409368.png)

其他命令查看 [Kafka常用操作记录](/posts/12ab226e)