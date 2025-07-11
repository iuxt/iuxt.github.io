---
title: 在Kubernetes中部署zookeeper集群
categories:
  - 容器
tags:
  - 配置记录
  - Kubernetes
  - 有状态服务
abbrlink: sfbpoq
cover: 'https://s3.babudiu.com/iuxt/public/apache_zookeeper.svg'
date: 2024-06-19 18:41:14
---

## 部署遇到的问题

### 挂载目录没有写入权限

![image.png](https://s3.babudiu.com/iuxt/images/202406191739203.png)

修改容器启动命令，查看到用户 id 是 1001

![image.png](https://s3.babudiu.com/iuxt/images/202406201606689.png)

官方也有说明
![image.png](https://s3.babudiu.com/iuxt/images/202406191741358.png)

#### 解决方法 1: 使用 initcontainer 授权

```yml
      initContainers:
      - name: init
        image: busybox:1.28
        command: ['sh', '-c', "chown -R 1001:1001 /bitnami/"]
        volumeMounts:
          - name: data
            mountPath: /bitnami/zookeeper

```

![image.png|580](https://s3.babudiu.com/iuxt/images/202406191826920.png)

#### 解决方法 2： 增加安全上下文，使用 root 用户

这么做会降低容器的安全性，不推荐！

```yml
          securityContext:
            runAsUser: 0
            runAsGroup: 0
```

![image.png](https://s3.babudiu.com/iuxt/images/202406191746763.png)

## 最终的 yaml 文件

```yml
apiVersion: v1
kind: Service
metadata:
  name: zk-hs
  labels:
    app: zookeeper
spec:
  ports:
    - name: tcp-client
      protocol: TCP
      port: 2181
      targetPort: 2181
    - name: tcp-follower
      port: 2888
      targetPort: 2888
    - name: tcp-election
      port: 3888
      targetPort: 3888
  selector:
    app: zookeeper
  clusterIP: None
  type: ClusterIP

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: zookeeper
  labels:
    app: zookeeper
spec:
  replicas: 3
  selector:
    matchLabels:
      app: zookeeper
  serviceName: zk-hs
  template:
    metadata:
      name: zookeeper
      labels:
        app: zookeeper
    spec:
      # 使用 initContainers 解决挂载目录没有权限写入问题
      initContainers:
      - name: init
        image: busybox:1.28
        command: ['sh', '-c', "chown -R 1001:1001 /bitnami/"]
        volumeMounts:
          - name: data
            mountPath: /bitnami/zookeeper

      containers:
        - name: zookeeper
          image: bitnami/zookeeper:3.8.2
          command:
            - bash
            - '-ec'
            - |
              HOSTNAME="$(hostname -s)"
              if [[ $HOSTNAME =~ (.*)-([0-9]+)$ ]]; then
                ORD=${BASH_REMATCH[2]}
                export ZOO_SERVER_ID="$((ORD + 1 ))"
              else
                echo "Failed to get index from hostname $HOST"
                exit 1
              fi
              exec /entrypoint.sh /run.sh
          resources:
            limits:
              cpu: 1
              memory: 2Gi
            requests:
              cpu: 50m
              memory: 500Mi
          env:
            - name: ZOO_ENABLE_AUTH
              value: "no"
            - name: ALLOW_ANONYMOUS_LOGIN
              value: "yes"
            - name: ZOO_SERVERS
              value: >
                zookeeper-0.zk-hs.default.svc.cluster.local:2888:3888
                zookeeper-1.zk-hs.default.svc.cluster.local:2888:3888
                zookeeper-2.zk-hs.default.svc.cluster.local:2888:3888
          ports:
            - name: client
              containerPort: 2181
            - name: follower
              containerPort: 2888
            - name: election
              containerPort: 3888
          livenessProbe:
            tcpSocket:
              port: client
            failureThreshold: 6
            initialDelaySeconds: 30
            periodSeconds: 10
            successThreshold: 1
            timeoutSeconds: 5
          readinessProbe:
            tcpSocket:
              port: client
            failureThreshold: 6
            initialDelaySeconds: 5
            periodSeconds: 10
            successThreshold: 1
            timeoutSeconds: 5
          volumeMounts:
            - name: data
              mountPath: /bitnami/zookeeper
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: [ "ReadWriteOnce" ]
        storageClassName: "longhorn"
        resources:
          requests:
            storage: 2Gi
```

## 集群验证

```bash
# 检查FQDN
for i in 0 1 2; do kubectl exec zookeeper-$i -- hostname -f; done

# 检查生成的myid文件
for i in 0 1 2; do echo "myid zookeeper-$i";kubectl exec zookeeper-$i -- cat /bitnami/zookeeper/data/myid; done

# 检查自动生成的配置文件
kubectl exec -it zookeeper-0 --  cat /opt/bitnami/zookeeper/conf/zoo.cfg | grep -vE "^#|^$"

# 检查集群状态
for i in 0 1 2; do echo -e "# myid zookeeper-$i \n";kubectl exec zookeeper-$i -- opt/bitnami/zookeeper/bin/zkServer.sh status;echo -e "\n"; done

```

### 数据验证

```bash
kubectl run --rm -it zookeeper-client --image=zookeeper:3.8.2 -- bash

cd /apache-zookeeper-3.8.2-bin/bin

# 连上 zookeeper 第一个节点
./zkCli.sh -server zookeeper-0.zk-hs.default.svc.cluster.local:2181

# 创建测试数据
[zk: zookeeper-0.zk-hs.default.svc.cluster.local:2181(CONNECTED) 0] create /test test-data
Created /test

# 读取测试数据
[zk: zookeeper-0.zk-hs.default.svc.cluster.local:2181(CONNECTED) 1] get /test
test-data

# 连上 zookeeper 第二个节点
./zkCli.sh -server zookeeper-1.zk-hs.default.svc.cluster.local:2181
# 获取数据
[zk: zookeeper-1.zk-hs.default.svc.cluster.local:2181(CONNECTED) 0] get /test
test-data
```
