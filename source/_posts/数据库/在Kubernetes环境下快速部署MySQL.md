---
title: 在Kubernetes环境下快速部署MySQL
categories:
  - 数据库
tags: ['']
abbrlink: sgch4h
cover: ''
date: 2024-07-09 15:07:29
updated: 2025-07-24 18:21:20
---

收到个需求，开发团队希望快速启动一套业务环境，包括所有业务服务（部署在 `Kubernetes` 中）、`MySQL` 数据库、`Redis` 等中间件也一并创建出来并初始化，业务也需要自动连接上这些中间件。

本文记录一下在 `Kubernetes` 中部署 `MySQL` 并完成初始化操作（设置密码、创建数据库）

## 遇到的问题

### 表名大小写敏感问题

我们的业务需要数据库设置为表名大小写不敏感，即无论大小写都转换为小写，需要设置参数：

```ini
[mysqld]
lower_case_table_names=1
```

那么在容器中，参考官方文档，可以将 cnf 文件挂载到 `/etc/mysql/conf.d/` 中。

![image.png|928](https://s3.babudiu.com/iuxt/images/202407091515566.png)

## 创建多个数据库

业务需要用到多个库，检查官方环境变量，有个 `MYSQL_DATABASE` 不过我测试可以创建一个库，不满足我们的需求。并且除了建库，可能还有其他的操作。

![image.png|944](https://s3.babudiu.com/iuxt/images/202407091520705.png)

可以将你需要的 sql 文件放到 `/docker-entrypoint-initdb.d` 目录中，初始化的时候会自动执行。

## 完整的 yaml 文件

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mysql-config
  namespace: default
data:
  custom.cnf: |
    [mysqld]
    lower_case_table_names=1

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: mysql-init-sql
  namespace: default
data:
  init1.sql: |
    CREATE DATABASE IF NOT EXISTS database1;
  init2.sql: |
    CREATE DATABASE IF NOT EXISTS database2;

---
kind: StatefulSet
apiVersion: apps/v1
metadata:
  name: mysql
  namespace: default
  labels:
    app: mysql
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      volumes:
        - name: host-time
          hostPath:
            path: /etc/localtime
            type: ''
        - name: mysql-config
          configMap:
            name: mysql-config
        - name: mysql-init-sql
          configMap:
            name: mysql-init-sql

      containers:
        - name: mysql
          # arm64 设置为mysql:oracle, amd64设置为mysql:latest
          image: registry.cn-hangzhou.aliyuncs.com/iuxt/mysql:8.0.38
          ports:
            - name: tcp-3306
              containerPort: 3306
              protocol: TCP
            - name: tcp-33060
              containerPort: 33060
              protocol: TCP
          env:
            - name: MYSQL_ROOT_PASSWORD
              value: com.012

          volumeMounts:
            - name: mysql-config
              mountPath: /etc/mysql/conf.d
            - name: mysql-init-sql
              mountPath: /docker-entrypoint-initdb.d
            - name: host-time
              mountPath: /etc/localtime
            - name: mysql-data
              mountPath: /var/lib/mysql
          imagePullPolicy: IfNotPresent
      restartPolicy: Always
      dnsPolicy: ClusterFirst
  volumeClaimTemplates:
    - kind: PersistentVolumeClaim
      apiVersion: v1
      metadata:
        name: mysql-data
        namespace: default
      spec:
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: 10Gi
        storageClassName: nfs-storage
        volumeMode: Filesystem
  serviceName: mysql

---
kind: Service
apiVersion: v1
metadata:
  name: mysql
  namespace: default
  labels:
    app: mysql
spec:
  ports:
    - name: http-3306
      protocol: TCP
      port: 3306
      targetPort: 3306
      nodePort: 30001
  selector:
    app: mysql
  type: NodePort
```

这种挂载方式是将 configmap 中的所有 key 都挂载到指定的目录中。目录中原文件不可见（本来就没有文件），如果想要以单个文件形式挂载，参考文章：[在Kubernetes集群中挂载configmap到pod中](/posts/75a76e3b/)
