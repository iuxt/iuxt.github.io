---
title: hadoop集群搭建记录
categories:
  - 日志
tags:
  - 大数据
  - 部署
  - 配置记录
abbrlink: sds4t1
cover: 'https://s3.babudiu.com/iuxt/public/hadoop.svg'
date: 2024-05-20 18:22:12
---

## 准备工作

### 配置节点间 ssh 免密

略

### 安装 java 环境

略

### 搭建 zookeeper

[zookeeper集群搭建](/posts/sds4db/)

### 绑定 hosts

```bash
cat >> /etc/hosts << 'EOF'
192.168.200.11 hadoop1
192.168.200.12 hadoop2
192.168.200.13 hadoop3
EOF
```

### 环境变量

vim /etc/profile

```bash
# hadoop
export HADOOP_HOME=/data/hadoop-3.2.4/
export PATH=$PATH:$HADOOP_HOME/bin:$HADOOP_HOME/sbin
```

### 创建目录

```bash
mkdir -p /data/hadoop_data/
mkdir -p /var/lib/hadoop-hdfs
```

## 修改配置

workers 这里面是 datanode 节点列表。

```bash
[root@m1 hadoop]# cat workers
hadoop1
hadoop2
hadoop3
```

hadoop-env.sh

```bash
# 配置JAVA_HOME
export JAVA_HOME=/usr/local/java
# 设置用户以执行对应角色shell命令
export HDFS_NAMENODE_USER=root
export HDFS_DATANODE_USER=root
export HDFS_SECONDARYNAMENODE_USER=root
export YARN_RESOURCEMANAGER_USER=root
export YARN_NODEMANAGER_USER=root
export HDFS_JOURNALNODE_USER=root
export HDFS_ZKFC_USER=root
```

hdfs-site.xml

```xml
<configuration>

<!--指定 hdfs 的 nameservice 为 mycluster，需要和 core-site.xml 中的保持一致 -->
<property>
    <name>dfs.nameservices</name>
    <value>mycluster</value>
</property>
<!-- mycluster 下面有两个 NameNode，分别是 nn1，nn2 -->
<property>
    <name>dfs.ha.namenodes.mycluster</name>
    <value>nn1,nn2</value>
</property>
<!-- nn1 的 RPC 通信地址 -->
<property>
    <name>dfs.namenode.rpc-address.mycluster.nn1</name>
    <value>hadoop1:8020</value>
</property>
<!-- nn1 的 http 通信地址 -->
<property>
    <name>dfs.namenode.http-address.mycluster.nn1</name>
    <value>hadoop1:9870</value>
</property>
<!-- nn2 的 RPC 通信地址 -->
<property>
    <name>dfs.namenode.rpc-address.mycluster.nn2</name>
    <value>hadoop2:8020</value>
</property>
<!-- nn2 的 http 通信地址 -->
<property>
    <name>dfs.namenode.http-address.mycluster.nn2</name>
    <value>hadoop2:9870</value>
</property>
<!-- 指定 NameNode 的 edits 元数据在 JournalNode 上的存放位置 -->
<property>
    <name>dfs.namenode.shared.edits.dir</name>
    <value>qjournal://hadoop1:8485;hadoop2:8485;hadoop3:8485/mycluster</value>
</property>
<!-- 指定 JournalNode 在本地磁盘存放数据的位置 -->
<property>
    <name>dfs.journalnode.edits.dir</name>
    <value>/data/hadoop_data/journaldata</value>
</property>
<!-- 开启 NameNode 失败自动切换 -->
<property>
    <name>dfs.ha.automatic-failover.enabled</name>
    <value>true</value>
</property>
<!-- 指定该集群出故障时，哪个实现类负责执行故障切换 -->
<property>
    <name>dfs.client.failover.proxy.provider.mycluster</name>
    <value>org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider</value>
</property>
<!-- 配置隔离机制方法-->
<property>
    <name>dfs.ha.fencing.methods</name>
    <value>shell(/bin/true)</value>
</property>
<!-- 开启短路本地读取功能 -->
<property>
  <name>dfs.client.read.shortcircuit</name>
  <value>true</value>
</property>
<!-- 需手动创建目录 mkdir -p /var/lib/hadoop-hdfs -->
<property>
  <name>dfs.domain.socket.path</name>
  <value>/var/lib/hadoop-hdfs/dn_socket</value>
</property>
<!-- 开启黑名单 -->
<property>
  <name>dfs.hosts.exclude</name>
  <value>/data/hadoop-3.2.4/etc/hadoop/excludes</value>
</property>

</configuration>
```

core-site.xml

```xml
<configuration>
<!-- HA 集群名称，该值要和 hdfs-site.xml 中的配置保持一致 -->
<property>
    <name>fs.defaultFS</name>
    <value>hdfs://mycluster</value>
</property>
<!-- hadoop 本地数据存储目录 format 时自动生成 -->
<property>
    <name>hadoop.tmp.dir</name>
    <value>/data/hadoop_data/tmp</value>
</property>
<!-- 在 Web UI 访问 HDFS 使用的用户名。-->
<property>
    <name>hadoop.http.staticuser.user</name>
    <value>root</value>
</property>
<!-- ZooKeeper 集群的地址和端口-->
<property>
    <name>ha.zookeeper.quorum</name>
    <value>hadoop1:2181,hadoop2:2181,hadoop3:2181</value>
</property>
</configuration>
```

## 集群初始化

```bash
# 1. 首先启动 zookeeper 集群
 
# 2. 手动启动 JN 集群（3台机器）
hdfs --daemon start journalnode
 
# 3. 在 hadoop01 执行格式化 namenode 并启动 namenode
[root@hadoop1 ~]# hdfs namenode -format
[root@hadoop1 ~]# hdfs --daemon start namenode
 
# 4. 在 hadoop02 上进行 namenode 元数据同步
[root@hadoop2 ~]# hdfs namenode -bootstrapStandby
 
# 5. 格式化 zkfc。注意：在哪台机器上执行，哪台机器就将成为第一次的 Active NN
[root@hadoop1 ~]# hdfs zkfc -formatZK
```

start-dfs.sh

```bash
[root@hadoop1 ~]# jps
6355 QuorumPeerMain
6516 JournalNode
7573 DataNode
7989 DFSZKFailoverController
8040 Jps
7132 NameNode
 
[root@hadoop2 ~]# jps
4688 JournalNode
5201 NameNode
5521 Jps
5282 DataNode
4536 QuorumPeerMain
5482 DFSZKFailoverController
 
[root@hadoop3 ~]# jps
4384 DataNode
3990 QuorumPeerMain
4136 JournalNode
4511 Jps
```

## 检查

浏览器打开

http://hadoop1:9870 查看状态。
