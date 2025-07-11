---
title: Grafana 接入 LDAP 认证
categories:
  - 监控
tags:
  - grafana
  - OpenLDAP
abbrlink: sl8dop
cover: ''
date: 2024-10-12 14:50:48
---

`Grafana` 是一个非常好用的展示数据软件，我一直以为可以直接在设置里增加 ldap 配置，没想到啊没想到 必须要修改配置文件才能接入到 `LDAP`，还是记录一下吧，免得下次部署浪费时间。

我是在 `Kubernetes` 中部署的，数据存储用的是 `MySQL`，所以 `Grafana` 本身可以当作一个无状态服务来看待。也可以不做数据持久化。

## 先创建 ldap 配置文件

这里包括 ldap 数据的映射关系，可以自己尝试修改调整。

```yaml
kind: ConfigMap
apiVersion: v1
metadata:
  name: grafana-ldap-config
  namespace: ops
data:
  ldap.toml: |
    [[servers]]
    host = "10.0.0.11"
    port = 389
    use_ssl = false
    start_tls = false
    ssl_skip_verify = false
    bind_dn = "cn=admin,dc=i,dc=com"
    bind_password = "password"
    search_filter = "(uid=%s)"
    search_base_dns = ["dc=i,dc=com"]
    [servers.attributes]
    member_of = "memberOf"
    email =  "uid"
    name = "cn"
    username = "uid"
```

## 创建 deployment 和 service

```yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  namespace: ops
  labels:
    app: grafana
  name: grafana
spec:
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      securityContext:
        fsGroup: 472
        supplementalGroups:
          - 0
      volumes:
        - name: ldap-config
          configMap:
            name: grafana-ldap-config
            defaultMode: 420
      containers:
        - name: grafana
          image: registry.cn-hangzhou.aliyuncs.com/yaml/images:grafana-11.2.2-ubuntu
          env:
            - name: GF_AUTH_BASIC_ENABLED
              value: 'true'
            - name: GF_AUTH_ANONYMOUS_ENABLED
              value: 'false'
            - name: GF_AUTH_ANONYMOUS_ORG_ROLE
              value: Admin
            - name: GF_DASHBOARDS_JSON_ENABLED
              value: 'true'
            - name: GF_SECURITY_ADMIN_USER
              value: admin
            - name: GF_SECURITY_ADMIN_PASSWORD
              value: admin
            - name: GF_DATABASE_TYPE
              value: mysql
            - name: GF_DATABASE_HOST
              value: 10.0.0.65
            - name: GF_DATABASE_PORT
              value: '3306'
            - name: GF_DATABASE_USER
              value: root
            - name: GF_DATABASE_PASSWORD
              value: password
            - name: GF_DATABASE_NAME
              value: grafana
            - name: GF_AUTH_LDAP_ENABLED
              value: 'true'
            - name: GF_AUTH_LDAP_ALLOW_SIGN_UP
              value: 'true'
            - name: GF_AUTH_LDAP_CONFIG_FILE
              value: /etc/grafana/ldap.toml
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 3000
              name: http-grafana
              protocol: TCP
          readinessProbe:
            failureThreshold: 3
            httpGet:
              path: /robots.txt
              port: 3000
              scheme: HTTP
            initialDelaySeconds: 10
            periodSeconds: 30
            successThreshold: 1
            timeoutSeconds: 2
          livenessProbe:
            failureThreshold: 3
            initialDelaySeconds: 30
            periodSeconds: 10
            successThreshold: 1
            tcpSocket:
              port: 3000
            timeoutSeconds: 1
          resources:
            requests:
              cpu: 250m
              memory: 750Mi
          volumeMounts:
            - name: ldap-config
              mountPath: /etc/grafana/ldap.toml
              subPath: ldap.toml
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: ops
spec:
  # type: NodePort
  ports:
    - port: 3000
      protocol: TCP
      targetPort: http-grafana
      # nodePort: 30030
  selector:
    app: grafana
  sessionAffinity: None
```

## 创建 ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: grafana
  namespace: ops
  annotations:
    # kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"

spec:
  ingressClassName: internet
  tls:
  - hosts:
    - grafana.i.com
    secretName: i-com
  rules:
  - host: grafana.i.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: grafana
            port:
              number: 3000
```

## 验证 LADP 字段配置

配置好以后，使用默认管理员账户登录： 默认账号密码：`admin/admin` 登录以后，在 `管理` -- `身份验证` -- `LDAP` 里验证字段的映射情况。
![image.png](https://s3.babudiu.com/iuxt/images/202410121607340.png)

## LADP 用户权限调整

默认情况下，权限是 viewer，只可以查看，不能编辑，系统后台也不能修改权限。如图：
![image.png](https://s3.babudiu.com/iuxt/images/202410121551118.png)

需要到 ldap 来配置权限并同步到 Grafana，我们只希望 ldap 做个轻量的用户数据库，不希望赋予 ldap 太多的功能，这里我们直接修改数据库来修改权限。

1. 先到 user 表查询用户 id
    ![image.png](https://s3.babudiu.com/iuxt/images/202410121559413.png)
2. 再到 org_user 表中修改 role 字段为 Admin 即可赋予该用户 Admin 权限
    ![image.png](https://s3.babudiu.com/iuxt/images/202410121600773.png)

