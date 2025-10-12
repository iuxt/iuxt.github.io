---
title: 使用 Docker 搭建单节点 Elasticsearch 学习环境
categories:
  - 日志
tags: [ES, Elasticsearch, 开源软件, 部署, Docker, 搭建]
abbrlink: st219s
date: 2024-04-25 19:00:00
cover: https://s3.babudiu.com/iuxt/images/202412031037042.png
updated: 2025-10-13 00:41:30
---

一般来说，学习 ES 都是自己先搭建几台虚拟机，然后在虚拟机里部署 ES 集群，这样做资源消耗比较大，一般的电脑都没有这么高的配置，我们可以使用 Docker 来快速部署 Elasticsearch，这里搭建单节点：

## 启动 Elasticsearch

```bash
docker network create elasticsearch

# 保证目录权限正确
mkdir es-data es-logs
sudo chown -R 1000 es-data es-logs

docker run -d --name elasticsearch \
    -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
    -e "discovery.type=single-node" \
    -v "$(pwd)"/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml:ro \
    -v "$(pwd)"/es-data:/usr/share/elasticsearch/data:rw \
    -v "$(pwd)"/es-logs:/usr/share/elasticsearch/logs:rw \
    --privileged --network elasticsearch \
    -p 9200:9200 -p 9300:9300 \
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

elasticsearch.hosts: ["http://elasticsearch:9200"]
i18n.locale: "zh-CN"
```

### 准备 kibana.sh

```bash
docker run -d --name kibana \
    --net elasticsearch \
    -p 5601:5601 \
    -v "$(pwd)"/kibana.yml:/usr/share/kibana/config/kibana.yml \
    kibana:7.17.14
```
