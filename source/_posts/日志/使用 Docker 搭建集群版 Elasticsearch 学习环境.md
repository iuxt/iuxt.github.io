---
title: 使用 Docker 搭建集群版 Elasticsearch 学习环境
categories:
  - 日志
tags:
  - ES
  - Elasticsearch
  - Docker
  - 部署
  - 搭建
  - 开源软件
abbrlink: schwdt
cover: https://static.zahui.fan/images/202412031037042.png
date: 2024-04-25 19:10:40
updated: 2025-03-13 17:11:51
---

一般来说，学习 ES 都是自己先搭建几台虚拟机，然后在虚拟机里部署 ES 集群，这样做资源消耗比较大，一般的电脑都没有这么高的配置，我们可以使用 Docker 来快速部署一套 Elasticsearch 集群，这里以 3 节点集群为例：

## 准备 Docker 网络

集群节点之间是通过 ip 进行交互的，所以需要固定一下 ip，固定 ip 之前需要先创建一个 Docker 私有网络，并固定网段 (网段不要和你的内网冲突)

```bash
docker network create --subnet=172.16.0.0/24 elasticsearch-br0
```

## 集群版 Elasticsearch 需要生成证书

默认生成 3 年证书，我指定生成了 100 年的证书， 生成到了 `certs` 目录下。

```bash
docker run --rm -it -v $(pwd)/certs:/tmp/certs elasticsearch:7.17.14 bash -c \
    'echo -e "\n\n" | /usr/share/elasticsearch/bin/elasticsearch-certutil ca -s -days 36500 && \
    echo -e "\n\n\n" | /usr/share/elasticsearch/bin/elasticsearch-certutil cert -s -days 36500 --ca elastic-stack-ca.p12 && \
    mv /usr/share/elasticsearch/*.p12 /tmp/certs && \
    chmod 777 -R /tmp/certs'
```

## 指定 IP 运行容器

我这里将数据持久化到了 docker 卷中，通过 `docker volume ls` 可以查看。

### elasticsearch1

```bash
docker run -d --name elasticsearch1 \
    --ulimit memlock=-1:-1 \
    -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
    -e node.name=elasticsearch1 \
    -e cluster.name=es-cluster \
    -e discovery.seed_hosts=elasticsearch2,elasticsearch3 \
    -e cluster.initial_master_nodes=elasticsearch1,elasticsearch2,elasticsearch3 \
    -e bootstrap.memory_lock=true \
    -e xpack.security.enabled=true \
    -e http.cors.enabled=true \
    -e http.cors.allow-origin="*" \
    -e http.cors.allow-headers=Authorization \
    -e xpack.security.enabled=true \
    -e xpack.security.transport.ssl.enabled=true \
    -e xpack.security.transport.ssl.verification_mode=certificate \
    -e xpack.security.transport.ssl.keystore.path=/usr/share/elasticsearch/config/elastic-certificates.p12 \
    -e xpack.security.transport.ssl.truststore.path=/usr/share/elasticsearch/config/elastic-certificates.p12 \
    -v es-data1:/usr/share/elasticsearch/data:rw \
    -v es-logs1:/usr/share/elasticsearch/logs:rw \
    --mount type=bind,source=$(pwd)/certs/elastic-certificates.p12,target=/usr/share/elasticsearch/config/elastic-certificates.p12 \
    --network elasticsearch-br0 \
    --ip 172.16.0.11 \
    -p 9201:9200 -p 9301:9300 \
    elasticsearch:7.17.14
```

### elasticsearch2

```bash
docker run -d --name elasticsearch2 \
    --ulimit memlock=-1:-1 \
    -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
    -e node.name=elasticsearch2 \
    -e cluster.name=es-cluster \
    -e discovery.seed_hosts=elasticsearch1,elasticsearch3 \
    -e cluster.initial_master_nodes=elasticsearch1,elasticsearch2,elasticsearch3 \
    -e bootstrap.memory_lock=true \
    -e xpack.security.enabled=true \
    -e http.cors.enabled=true \
    -e http.cors.allow-origin="*" \
    -e http.cors.allow-headers=Authorization \
    -e xpack.security.enabled=true \
    -e xpack.security.transport.ssl.enabled=true \
    -e xpack.security.transport.ssl.verification_mode=certificate \
    -e xpack.security.transport.ssl.keystore.path=/usr/share/elasticsearch/config/elastic-certificates.p12 \
    -e xpack.security.transport.ssl.truststore.path=/usr/share/elasticsearch/config/elastic-certificates.p12 \
    -v es-data2:/usr/share/elasticsearch/data:rw \
    -v es-logs2:/usr/share/elasticsearch/logs:rw \
    --mount type=bind,source=$(pwd)/certs/elastic-certificates.p12,target=/usr/share/elasticsearch/config/elastic-certificates.p12 \
    --network elasticsearch-br0 \
    --ip 172.16.0.12 \
    -p 9202:9200 -p 9302:9300 \
    elasticsearch:7.17.14
```

### elasticsearch3

```bash
docker run -d --name elasticsearch3 \
    --ulimit memlock=-1:-1 \
    -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
    -e node.name=elasticsearch3 \
    -e cluster.name=es-cluster \
    -e discovery.seed_hosts=elasticsearch1,elasticsearch2 \
    -e cluster.initial_master_nodes=elasticsearch1,elasticsearch2,elasticsearch3 \
    -e bootstrap.memory_lock=true \
    -e xpack.security.enabled=true \
    -e http.cors.enabled=true \
    -e http.cors.allow-origin="*" \
    -e http.cors.allow-headers=Authorization \
    -e xpack.security.enabled=true \
    -e xpack.security.transport.ssl.enabled=true \
    -e xpack.security.transport.ssl.verification_mode=certificate \
    -e xpack.security.transport.ssl.keystore.path=/usr/share/elasticsearch/config/elastic-certificates.p12 \
    -e xpack.security.transport.ssl.truststore.path=/usr/share/elasticsearch/config/elastic-certificates.p12 \
    -v es-data3:/usr/share/elasticsearch/data:rw \
    -v es-logs3:/usr/share/elasticsearch/logs:rw \
    --mount type=bind,source=$(pwd)/certs/elastic-certificates.p12,target=/usr/share/elasticsearch/config/elastic-certificates.p12 \
    --network elasticsearch-br0 \
    --ip 172.16.0.13 \
    -p 9203:9200 -p 9303:9300 \
    elasticsearch:7.17.14
```

## 初始化密码

需要等待服务启动后才可设置初始化密码，命令只能生成一次。

```bash
# 自动生成密码
docker exec elasticsearch1 bash -c "echo y | /usr/share/elasticsearch/bin/elasticsearch-setup-passwords auto"

# 初始化生成指定的密码
ELASTIC_PASSWORD="123456"
echo "y
${ELASTIC_PASSWORD}
${ELASTIC_PASSWORD}
${ELASTIC_PASSWORD}
${ELASTIC_PASSWORD}
${ELASTIC_PASSWORD}
${ELASTIC_PASSWORD}
${ELASTIC_PASSWORD}
${ELASTIC_PASSWORD}
${ELASTIC_PASSWORD}
${ELASTIC_PASSWORD}
${ELASTIC_PASSWORD}
${ELASTIC_PASSWORD}" | docker exec -i elasticsearch /usr/share/elasticsearch/bin/elasticsearch-setup-passwords interactive
```

## 部署 kibana

### 准备 kibana.yml

密码按照实际情况修改

```yml
server.name: kibana
server.port: 5601
server.host: "0.0.0.0"
elasticsearch.username: "elastic"
elasticsearch.password: "123456"

elasticsearch.hosts: ["http://elasticsearch1:9200", "http://elasticsearch2:9200", "http://elasticsearch3:9200"]
i18n.locale: "zh-CN"
```

### 准备 kibana.sh

```bash
docker run -d --name kibana \
    --net elasticsearch-br0 \
    -p 5601:5601 \
    -v "$(pwd)"/kibana.yml:/usr/share/kibana/config/kibana.yml \
    kibana:7.17.14
```
