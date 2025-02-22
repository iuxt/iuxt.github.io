---
title: 使用 Elasticsearch 二进制 tar 包部署并初始化三节点集群
categories:
  - 基础运维
tags: [Elasticsearch, ES, 搭建]
cover: https://static.zahui.fan/public/elasticsearch.svg
abbrlink: a07ebcb
date: 2022-11-02 12:48:18
updated: 2025-02-22 22:51:58
---

需要初始化配置一个 3 节点的集群，我的机器详情是：

| hostname | IP 地址     | 系统版本          | 备注          |
| -------- | --------- | ------------- | ----------- |
| node-1   | 10.0.0.11 | AlmaLinux 9.5 | 初始化 master 节点 |
| node-2   | 10.0.0.12 | AlmaLinux 9.5 | 初始化 master 节点 |
| node-3   | 10.0.0.13 | AlmaLinux 9.5 | 初始化 master 节点 |
| node-4   | 10.0.0.14 | AlmaLinux 9.5 | 新增节点        |

## 环境准备

### 主机名规范 (可选)

```bash
hostnamectl set-hostname es_1
```

### 内核参数修改

{% tabs TabName %}

<!-- tab 临时修改 -->
重启后配置会丢失

```bash
sudo sysctl -w vm.max_map_count=262144
```

<!-- endtab -->

<!-- tab 永久修改 -->

`vim /etc/sysctl.conf`

```bash
vm.max_map_count=262144
```

马上生效，执行

```bash
sudo sysctl -p
```

<!-- endtab -->

{% endtabs %}

### 关闭 selinux

redhat 系需要，Ubuntu 不用, 如果启动服务提示 `Permission Denied` ，如果权限没问题，那可能是 selinux 的问题。

{% tabs TabName %}

<!-- tab 临时修改 -->

```bash
sudo setenforce 0
```

<!-- endtab -->

<!-- tab 永久修改 -->

`vim /etc/selinux/config`

```bash
SELINUX=disabled
```

<!-- endtab -->

{% endtabs %}

### 关闭防火墙

```bash
# CentOS
sudo systemctl disable --now firewalld

# Ubuntu
sudo systemctl disable --now ufw
```

### 准备 ES 安装包

```bash
[ ! -d /data/elasticsearch ] && mkdir -p /data/elasticsearch
cd /data/elasticsearch
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.16.2-linux-x86_64.tar.gz
tar xf elasticsearch-7.16.2-linux-x86_64.tar.gz
cd elasticsearch-7.16.2
```

### 创建用户

```bash
sudo useradd elasticsearch -m -s /usr/sbin/nologin
```

## 初始化集群配置

`vim config/elasticsearch.yml`

修改配置文件为

```yml
# 集群名字
cluster.name: es_cluster

# 给节点定义个名字，每个节点不一样
node.name: node-1
# 节点监听的ip，本机IP
network.host: 10.0.0.11
http.port: 9200
# 尽量不要配置自身ip，避免自引用问题。
discovery.seed_hosts:
  - "10.0.0.12:9300"
  - "10.0.0.13:9300"

# master节点的 node.mane 配置，初始化配置哪些节点有资格选举成主节点，初始化的时候会选举一个master节点出来。
cluster.initial_master_nodes:
  - "node-1"
  - "node-2"
  - "node-3"
transport.tcp.port: 9300
http.cors.enabled: true
http.cors.allow-origin: "*"
http.cors.allow-headers: Authorization

# 节点间认证配置
xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true
xpack.security.transport.ssl.verification_mode: certificate
xpack.security.transport.ssl.keystore.path: elastic-certificates.p12
xpack.security.transport.ssl.truststore.path: elastic-certificates.p12
```

### 生成证书

> 在一个 master 上执行即可, 所有选项全部保持默认

```bash
./bin/elasticsearch-certutil ca
./bin/elasticsearch-certutil cert --ca elastic-stack-ca.p12
```

### 复制证书

>把生成的文件放到 conf 下

```bash
mv elastic-certificates.p12  elastic-stack-ca.p12 config/
```

然后把这两个文件复制到其他的节点 config 目录下.

### 文件权限

```bash
chown -R elasticsearch:elasticsearch /data/elasticsearch
```

### 生成 systemd 启动脚本

```bash
cat > /usr/lib/systemd/system/elasticsearch.service <<EOF
[Unit]
Description=elasticsearch
After=network.target

[Service]
Type=simple
User=elasticsearch
Group=elasticsearch
LimitNOFILE=100000
LimitNPROC=100000
Restart=no
ExecStart=/data/elasticsearch/elasticsearch-7.16.2/bin/elasticsearch
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
```

### 启动集群

一个 3 节点的集群至少启动 2 个节点才能正常服务。

```bash
sudo systemctl enable --now elasticsearch
```

### 设置密码

初始化密码，只需要执行一次。如果不能正常设置，检查下是不是只启动了一个节点。

{% tabs TabName %}

<!-- tab 自动生成所有密码 -->

```bash
./bin/elasticsearch-setup-passwords auto
```

<!-- endtab -->

<!-- tab 手动设置每个密码 -->

```bash
./bin/elasticsearch-setup-passwords interactive
```

<!-- endtab -->
<!-- tab 手动设置每个密码 -->
设置成固定密码

```bash
ELASTIC_PASSWORD="12345678"
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
${ELASTIC_PASSWORD}" | ./bin/elasticsearch-setup-passwords interactive
```

<!-- endtab -->
{% endtabs %}

## 检查集群

### 检查日志

```bash
tail -f /data/elasticsearch/elasticsearch-7.16.2/logs/es_cluster.log
```

### 检查节点状态

```bash
[root@test1 logs]# curl -u elastic:6xr7pJvcNmoNlMFZNGP4 10.0.0.11:9200/_cat/nodes?v
ip        heap.percent ram.percent cpu load_1m load_5m load_15m node.role   master name
10.0.0.11           44          95   0    0.00    0.00     0.00 cdfhilmrstw -      node-1
10.0.0.13           25          95   0    0.00    0.00     0.00 cdfhilmrstw -      node-3
10.0.0.12           38          95   0    0.00    0.00     0.00 cdfhilmrstw *      node-2

```

### 检查集群状态

```bash
[root@test1 logs]# curl -u elastic:6xr7pJvcNmoNlMFZNGP4 10.0.0.11:9200/_cat/health?v
epoch      timestamp cluster    status node.total node.data shards pri relo init unassign pending_tasks max_task_wait_time active_shards_percent
1740216850 09:34:10  es_cluster green           4         4      8   4    0    0        0             0                  -                100.0%
```

## 新增节点

新节点按照上面步骤执行一遍，不过不需要生成证书，将生成过的证书复制到新节点的对应目录，不需要设置密码，启动节点后会自动加入集群中。
新节点不需要配置 `cluster.initial_master_nodes:` 了，这个是初始化用到的配置。
新增的节点也可以配置成主节点，也可以配置成数据节点：

### 配置成数据节点

```bash
node.master: false
node.data: true
```

### 配置成主节点

```bash
node.master: true
node.data: false
```

## kibana 搭建（可选）

```bash
wget https://artifacts.elastic.co/downloads/kibana/kibana-7.16.2-linux-x86_64.tar.gz
tar xf kibana-7.16.2-linux-x86_64.tar.gz
```

准备 kibana 的配置文件 `kibana.yml`

```yml
server.name: kibana
server.port: 5601
server.host: "0.0.0.0"
elasticsearch.username: "elastic"
elasticsearch.password: "12345678"

elasticsearch.hosts: ["http://10.0.0.11:9200", "http://10.0.0.12:9200", "http://10.0.0.13:9200"]
i18n.locale: "zh-CN"
```

启动 kibana

## 其他

tar 包安装的要关闭 selinux，不然提示 `Permission denied`

```bash
sudo setenforce 0
```

`vm.max_map_count [65530] is too low, increase to at least [262144]` 需要执行：

```bash
sudo sysctl -w vm.max_map_count=262144
```
