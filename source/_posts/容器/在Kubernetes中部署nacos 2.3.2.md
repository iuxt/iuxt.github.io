---
title: 在Kubernetes中部署nacos 2.3.2
categories:
  - 容器
tags:
  - 部署
  - Kubernetes
  - k8s
  - 记录
  - nacos
abbrlink: sgajkk
cover: https://s3.babudiu.com/iuxt/public/Nacos.svg
date: 2024-07-08 14:05:08
updated: 2025-02-14 15:22:20
---

其他版本参考文档 [在Kubernetes中部署nacos 2.1.0](/posts/sebxm6/)

nacos 官方文档写的太敷衍了，很多东西都需要自己去找，比如容器运行的时候，必须的环境变量都没有写全，遇到的一些坑整理了出来。

## 新版的变化

### 鉴权逻辑优化

官方说明：<https://nacos.io/zh-cn/docs/v2/guide/user/auth.html>

2.2.2 版本之前的 Nacos 默认控制台，无论服务端是否开启鉴权，都会存在一个登录页；这导致很多用户被误导认为 Nacos 默认是存在鉴权的。在社区安全工程师的建议下，Nacos 自 2.2.2 版本开始，在未开启鉴权时，默认控制台将不需要登录即可访问，同时在控制台中给予提示，提醒用户当前集群未开启鉴权。

### 部分环境变量默认值删除

nacos 新版（2.2.1 之后删除了默认值）

![image.png|782](https://s3.babudiu.com/iuxt/images/202407081430186.png)

可以查看 `/home/nacos/conf/application.properties` 这个文件，如果有环境变量名不确认也可以到这个文件里查询：

![image.png|940](https://s3.babudiu.com/iuxt/images/202407081433781.png)

比如： `server.port=${NACOS_APPLICATION_PORT:8848}` NACOS_APPLICATION_PORT 是环境变量名，8848 是默认值。

## 遇到的问题

### the length of secret key must great than or equal 32 bytes; And the secret key must be encoded by base64.Please see https://nacos.io/zh-cn/docs/v2/guide/user/auth.html

这个问题是因为 `NACOS_AUTH_IDENTITY_KEY` `NACOS_AUTH_IDENTITY_VALUE` `NACOS_AUTH_TOKEN` 这三个变量没有默认值，需要配置环境变量

`NACOS_AUTH_IDENTITY_KEY` 设置成 `serverIdentity`

`NACOS_AUTH_IDENTITY_VALUE` 值推荐将配置项设置为 Base64 编码的字符串，且原始密钥长度不得低于 32 字符。生成随机字符串，并使用 base64 编码一下：

```bash
echo EbDxUpWcw3G9lCBZqZoKtqZyqmsCH2Ktex5TA1zTXxOIVm6f1q | base64
```

`NACOS_AUTH_TOKEN` 我设置成了 `SecretKeyXXjYYn7qwURG1bqBSDc8fBYqi5NwFOGgtwRX1lfKy0Ihl5Cdva3B7nJpZlV0`

### errCode: 102, errMsg: dataSource or tableName is null

这个是同样的问题，`SPRING_DATASOURCE_PLATFORM` 默认环境变量被删除

将环境变量 `SPRING_DATASOURCE_PLATFORM` 设置成 `mysql` 即可。

## MySQL 数据库准备

```sql
/*
 * Copyright 1999-2018 Alibaba Group Holding Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/******************************************/
/*   表名称 = config_info                  */
/******************************************/
CREATE TABLE `config_info` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'id',
  `data_id` varchar(255) NOT NULL COMMENT 'data_id',
  `group_id` varchar(128) DEFAULT NULL COMMENT 'group_id',
  `content` longtext NOT NULL COMMENT 'content',
  `md5` varchar(32) DEFAULT NULL COMMENT 'md5',
  `gmt_create` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '修改时间',
  `src_user` text COMMENT 'source user',
  `src_ip` varchar(50) DEFAULT NULL COMMENT 'source ip',
  `app_name` varchar(128) DEFAULT NULL COMMENT 'app_name',
  `tenant_id` varchar(128) DEFAULT '' COMMENT '租户字段',
  `c_desc` varchar(256) DEFAULT NULL COMMENT 'configuration description',
  `c_use` varchar(64) DEFAULT NULL COMMENT 'configuration usage',
  `effect` varchar(64) DEFAULT NULL COMMENT '配置生效的描述',
  `type` varchar(64) DEFAULT NULL COMMENT '配置的类型',
  `c_schema` text COMMENT '配置的模式',
  `encrypted_data_key` text NOT NULL COMMENT '密钥',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_configinfo_datagrouptenant` (`data_id`,`group_id`,`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='config_info';

/******************************************/
/*   表名称 = config_info_aggr             */
/******************************************/
CREATE TABLE `config_info_aggr` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'id',
  `data_id` varchar(255) NOT NULL COMMENT 'data_id',
  `group_id` varchar(128) NOT NULL COMMENT 'group_id',
  `datum_id` varchar(255) NOT NULL COMMENT 'datum_id',
  `content` longtext NOT NULL COMMENT '内容',
  `gmt_modified` datetime NOT NULL COMMENT '修改时间',
  `app_name` varchar(128) DEFAULT NULL COMMENT 'app_name',
  `tenant_id` varchar(128) DEFAULT '' COMMENT '租户字段',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_configinfoaggr_datagrouptenantdatum` (`data_id`,`group_id`,`tenant_id`,`datum_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='增加租户字段';


/******************************************/
/*   表名称 = config_info_beta             */
/******************************************/
CREATE TABLE `config_info_beta` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'id',
  `data_id` varchar(255) NOT NULL COMMENT 'data_id',
  `group_id` varchar(128) NOT NULL COMMENT 'group_id',
  `app_name` varchar(128) DEFAULT NULL COMMENT 'app_name',
  `content` longtext NOT NULL COMMENT 'content',
  `beta_ips` varchar(1024) DEFAULT NULL COMMENT 'betaIps',
  `md5` varchar(32) DEFAULT NULL COMMENT 'md5',
  `gmt_create` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '修改时间',
  `src_user` text COMMENT 'source user',
  `src_ip` varchar(50) DEFAULT NULL COMMENT 'source ip',
  `tenant_id` varchar(128) DEFAULT '' COMMENT '租户字段',
  `encrypted_data_key` text NOT NULL COMMENT '密钥',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_configinfobeta_datagrouptenant` (`data_id`,`group_id`,`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='config_info_beta';

/******************************************/
/*   表名称 = config_info_tag              */
/******************************************/
CREATE TABLE `config_info_tag` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'id',
  `data_id` varchar(255) NOT NULL COMMENT 'data_id',
  `group_id` varchar(128) NOT NULL COMMENT 'group_id',
  `tenant_id` varchar(128) DEFAULT '' COMMENT 'tenant_id',
  `tag_id` varchar(128) NOT NULL COMMENT 'tag_id',
  `app_name` varchar(128) DEFAULT NULL COMMENT 'app_name',
  `content` longtext NOT NULL COMMENT 'content',
  `md5` varchar(32) DEFAULT NULL COMMENT 'md5',
  `gmt_create` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '修改时间',
  `src_user` text COMMENT 'source user',
  `src_ip` varchar(50) DEFAULT NULL COMMENT 'source ip',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_configinfotag_datagrouptenanttag` (`data_id`,`group_id`,`tenant_id`,`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='config_info_tag';

/******************************************/
/*   表名称 = config_tags_relation         */
/******************************************/
CREATE TABLE `config_tags_relation` (
  `id` bigint(20) NOT NULL COMMENT 'id',
  `tag_name` varchar(128) NOT NULL COMMENT 'tag_name',
  `tag_type` varchar(64) DEFAULT NULL COMMENT 'tag_type',
  `data_id` varchar(255) NOT NULL COMMENT 'data_id',
  `group_id` varchar(128) NOT NULL COMMENT 'group_id',
  `tenant_id` varchar(128) DEFAULT '' COMMENT 'tenant_id',
  `nid` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'nid, 自增长标识',
  PRIMARY KEY (`nid`),
  UNIQUE KEY `uk_configtagrelation_configidtag` (`id`,`tag_name`,`tag_type`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='config_tag_relation';

/******************************************/
/*   表名称 = group_capacity               */
/******************************************/
CREATE TABLE `group_capacity` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `group_id` varchar(128) NOT NULL DEFAULT '' COMMENT 'Group ID，空字符表示整个集群',
  `quota` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '配额，0表示使用默认值',
  `usage` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '使用量',
  `max_size` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '单个配置大小上限，单位为字节，0表示使用默认值',
  `max_aggr_count` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '聚合子配置最大个数，，0表示使用默认值',
  `max_aggr_size` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '单个聚合数据的子配置大小上限，单位为字节，0表示使用默认值',
  `max_history_count` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '最大变更历史数量',
  `gmt_create` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '修改时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_id` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='集群、各Group容量信息表';

/******************************************/
/*   表名称 = his_config_info              */
/******************************************/
CREATE TABLE `his_config_info` (
  `id` bigint(20) unsigned NOT NULL COMMENT 'id',
  `nid` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'nid, 自增标识',
  `data_id` varchar(255) NOT NULL COMMENT 'data_id',
  `group_id` varchar(128) NOT NULL COMMENT 'group_id',
  `app_name` varchar(128) DEFAULT NULL COMMENT 'app_name',
  `content` longtext NOT NULL COMMENT 'content',
  `md5` varchar(32) DEFAULT NULL COMMENT 'md5',
  `gmt_create` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '修改时间',
  `src_user` text COMMENT 'source user',
  `src_ip` varchar(50) DEFAULT NULL COMMENT 'source ip',
  `op_type` char(10) DEFAULT NULL COMMENT 'operation type',
  `tenant_id` varchar(128) DEFAULT '' COMMENT '租户字段',
  `encrypted_data_key` text NOT NULL COMMENT '密钥',
  PRIMARY KEY (`nid`),
  KEY `idx_gmt_create` (`gmt_create`),
  KEY `idx_gmt_modified` (`gmt_modified`),
  KEY `idx_did` (`data_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='多租户改造';


/******************************************/
/*   表名称 = tenant_capacity              */
/******************************************/
CREATE TABLE `tenant_capacity` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `tenant_id` varchar(128) NOT NULL DEFAULT '' COMMENT 'Tenant ID',
  `quota` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '配额，0表示使用默认值',
  `usage` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '使用量',
  `max_size` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '单个配置大小上限，单位为字节，0表示使用默认值',
  `max_aggr_count` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '聚合子配置最大个数',
  `max_aggr_size` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '单个聚合数据的子配置大小上限，单位为字节，0表示使用默认值',
  `max_history_count` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '最大变更历史数量',
  `gmt_create` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '修改时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='租户容量信息表';


CREATE TABLE `tenant_info` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'id',
  `kp` varchar(128) NOT NULL COMMENT 'kp',
  `tenant_id` varchar(128) default '' COMMENT 'tenant_id',
  `tenant_name` varchar(128) default '' COMMENT 'tenant_name',
  `tenant_desc` varchar(256) DEFAULT NULL COMMENT 'tenant_desc',
  `create_source` varchar(32) DEFAULT NULL COMMENT 'create_source',
  `gmt_create` bigint(20) NOT NULL COMMENT '创建时间',
  `gmt_modified` bigint(20) NOT NULL COMMENT '修改时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_info_kptenantid` (`kp`,`tenant_id`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='tenant_info';

CREATE TABLE `users` (
	`username` varchar(50) NOT NULL PRIMARY KEY COMMENT 'username',
	`password` varchar(500) NOT NULL COMMENT 'password',
	`enabled` boolean NOT NULL COMMENT 'enabled'
);

CREATE TABLE `roles` (
	`username` varchar(50) NOT NULL COMMENT 'username',
	`role` varchar(50) NOT NULL COMMENT 'role',
	UNIQUE INDEX `idx_user_role` (`username` ASC, `role` ASC) USING BTREE
);

CREATE TABLE `permissions` (
    `role` varchar(50) NOT NULL COMMENT 'role',
    `resource` varchar(128) NOT NULL COMMENT 'resource',
    `action` varchar(8) NOT NULL COMMENT 'action',
    UNIQUE INDEX `uk_role_permission` (`role`,`resource`,`action`) USING BTREE
);

INSERT INTO users (username, password, enabled) VALUES ('nacos', '$2a$10$EuWPZHzz32dJN7jexM34MOeYirDdFAZm2kuWj7VEOJhhZkDrxfvUu', TRUE);

INSERT INTO roles (username, role) VALUES ('nacos', 'ROLE_ADMIN');

```

## yaml 文件

```yaml
[root@op-k8s-master1 ~]# cat nacos-2.3.2.yaml
apiVersion: v1
kind: Service
metadata:
  name: nacos-headless
  namespace: public
  labels:
    app: nacos-headless
spec:
  type: ClusterIP
  clusterIP: None
  ports:
    - port: 8848
      name: server
      targetPort: 8848
    - port: 9848
      name: client-rpc
      targetPort: 9848
    - port: 9849
      name: raft-rpc
      targetPort: 9849
    - port: 7848
      name: old-raft-rpc
      targetPort: 7848
  selector:
    app: nacos
---
apiVersion: v1
kind: Service
metadata:
  name: nacos-svc
  namespace: public
  labels:
    app: nacos
  # annotations:
    # prometheus.io/path: /nacos/actuator/prometheus
    # prometheus.io/port: "8848"
    # prometheus.io/scrape: "true"
    # service.alpha.kubernetes.io/tolerate-unready-endpoints: "true"
spec:
  ports:
    - port: 8848
      name: server
      targetPort: 8848
    - port: 9848
      name: client-rpc
      targetPort: 9848
    - port: 9849
      name: raft-rpc
      targetPort: 9849
    ## 兼容1.4.x版本的选举端口
    - port: 7848
      name: old-raft-rpc
      targetPort: 7848
  type: ClusterIP
  selector:
    app: nacos
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: nacos-cm
  namespace: public
data:
  mysql.host: "10.186.128.93"
  mysql.db.name: "nacos"
  mysql.port: "3306"
  mysql.user: "root"
  mysql.password: "6pH5M1mrH^JLD8mU"
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: nacos
  namespace: public
spec:
  serviceName: nacos-headless
  replicas: 3
  template:
    metadata:
      labels:
        app: nacos
      annotations:
        pod.alpha.kubernetes.io/initialized: "true"
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchExpressions:
                  - key: "app"
                    operator: In
                    values:
                      - nacos
              topologyKey: "kubernetes.io/hostname"
      containers:
        - name: k8snacos
          imagePullPolicy: Always
          image: registry.cn-hangzhou.aliyuncs.com/iuxt/nacos-server:v2.3.2
          resources:
            requests:
              memory: "2Gi"
              cpu: "500m"
          ports:
            - containerPort: 8848
              name: client
            - containerPort: 9848
              name: client-rpc
            - containerPort: 9849
              name: raft-rpc
            - containerPort: 7848
              name: old-raft-rpc
          env:
            - name: NACOS_REPLICAS
              value: "3"
            - name: SPRING_DATASOURCE_PLATFORM
              value: mysql
            - name: MYSQL_SERVICE_HOST
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.host
            - name: MYSQL_SERVICE_DB_NAME
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.db.name
            - name: MYSQL_SERVICE_PORT
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.port
            - name: MYSQL_SERVICE_USER
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.user
            - name: MYSQL_SERVICE_PASSWORD
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.password
            - name: NACOS_SERVER_PORT
              value: "8848"
            - name: NACOS_APPLICATION_PORT
              value: "8848"
            - name: PREFER_HOST_MODE
              value: "hostname"
            - name: NACOS_SERVERS
              value: >-
                nacos-0.nacos-headless.public.svc.cluster.local:8848
                nacos-1.nacos-headless.public.svc.cluster.local:8848
                nacos-2.nacos-headless.public.svc.cluster.local:8848
            - name: NACOS_AUTH_ENABLE
              value: "true"
            - name: NACOS_AUTH_IDENTITY_KEY
              value: serverIdentity
            - name: NACOS_AUTH_IDENTITY_VALUE
              value: RWJEeFVwV2N3M0c5bENCWnFab0t0cVp5cW1zQ0gyS3RleDVUQTF6VFh4T0lWbTZmMXEK
            - name: NACOS_AUTH_TOKEN
              value: SecretKeyXXjYYn7qwURG1bqBSDc8fBYqi5NwFOGgtwRX1lfKy0Ihl5Cdva3B7nJpZlV0

  selector:
    matchLabels:
      app: nacos
```

## ingress 规则

```yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    # kubernetes.io/ingress.class: "nginx"                   # 这里是ingressclass名字, 老版本k8s用这个
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/app-root: "/nacos"
    # 下面的配置和上面的app-root效果一样，就是跳转到 /nacos
    # nginx.ingress.kubernetes.io/configuration-snippet: |
    #   rewrite ^/$ https://$host/nacos/ redirect;
  name: prod-nacos-ingress
  namespace: public
spec:
  ingressClassName: "public-nginx"    # 这里是ingressclass名字, 新版本k8s用这个
  rules:
  - host: 这里修改为nacos的域名
    http:
      paths:
      - backend:
          service:
            name: nacos-svc
            port:
              number: 8848
        path: /
        pathType: ImplementationSpecific
  tls:
  - hosts:
    - 这里修改为nacos的域名
    secretName: i-com     # 这里配置ssl证书的secret名字
```

其他常见问题可以参考 [在Kubernetes中部署nacos 2.1.0](/posts/sebxm6/)