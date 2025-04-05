---
title: 安装插件方式来运行grafana-image-renderer
categories:
  - 监控
tags: [grafana, Docker, Puppeteer]
abbrlink: su3lwr
date: 2025-04-03 00:02:51
cover: ""
updated: 2025-04-05 09:36:57
---

安装可以使用命令：

```bash
grafana-cli plugins install grafana-image-renderer
```

如果不能正常访问网络，或者下载速度太慢，可以使用离线包：到这里<https://grafana.com/grafana/plugins/grafana-image-renderer/?tab=installation>下载离线包，然后放到 plugins 文件夹下。需要注意下 plugins 文件夹的位置，可能使用命令安装的路径和真实的 plugins 目录不一致。

![image.png|654](https://static.zahui.fan/images/20250402181200283.png)

如果插件启动失败，报错：可以检查下 `plugins/grafana-image-renderer/chrome-headless-shell/linux-136.0.7101.0/chrome-headless-shell-linux64` 这个程序能否正常运行，如果报错
![image.png](https://static.zahui.fan/images/20250402181642753.png)

需要安装 `apt install -y libasound2t64`

## 完整配置容器

Dockerfile：

```dockerfile
FROM grafana/grafana-oss:11.5.3-ubuntu
USER root
RUN apt-get update && \
    apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    fonts-noto-cjk \
    ttf-wqy-microhei && \
    fc-cache -f -v && \
    apt clean all
USER grafana
RUN grafana cli plugins install grafana-image-renderer
```

## kubernetes 部署配置

k8s 运行的时候，需要配置 `root_url` 被这个坑了很久，完整的配置文件如下：

```yml
kind: ConfigMap
apiVersion: v1
metadata:
  name: grafana-ldap-config
  namespace: ops
data:
  ldap.toml: |
    [[servers]]
    host = "1.1.1.1"
    port = 389
    use_ssl = false
    start_tls = false
    ssl_skip_verify = false
    bind_dn = "cn=admin,dc=example,dc=com"
    bind_password = "example"
    search_filter = "(uid=%s)"
    search_base_dns = ["dc=example,dc=com"]
    [servers.attributes]
    member_of = "memberOf"
    email =  "uid"
    name = "cn"
    username = "uid"

---

kind: Deployment
apiVersion: apps/v1
metadata:
  name: sre-grafana
  namespace: ops
  labels:
    app: sre-grafana
spec:
  replicas: 1
  selector:
    matchLabels:
      app: sre-grafana
  template:
    metadata:
      labels:
        app: sre-grafana
    spec:
      volumes:
        - name: ldap-config
          configMap:
            name: grafana-ldap-config
            defaultMode: 420
      containers:
        - name: grafana
          image: registry.cn-hangzhou.aliyuncs.com/iuxt/grafana-with-render:11.5.3-ubuntu
          ports:
            - name: http-grafana
              containerPort: 3000
              protocol: TCP
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
              value: 1.1.1.1
            - name: GF_DATABASE_PORT
              value: '3306'
            - name: GF_DATABASE_USER
              value: root
            - name: GF_DATABASE_PASSWORD
              value: example
            - name: GF_DATABASE_NAME
              value: sre-grafana
            - name: GF_AUTH_LDAP_ENABLED
              value: 'true'
            - name: GF_AUTH_LDAP_ALLOW_SIGN_UP
              value: 'true'
            - name: GF_AUTH_LDAP_CONFIG_FILE
              value: /etc/grafana/ldap.toml
            - name: GF_SERVER_ROOT_URL
              value: https://sre-grafana.example.com/
          resources:
            requests:
              cpu: 250m
              memory: 750Mi
          volumeMounts:
            - name: ldap-config
              mountPath: /etc/grafana/ldap.toml
              subPath: ldap.toml
          livenessProbe:
            tcpSocket:
              port: 3000
            initialDelaySeconds: 30
            timeoutSeconds: 1
            periodSeconds: 10
            successThreshold: 1
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /robots.txt
              port: 3000
              scheme: HTTP
            initialDelaySeconds: 10
            timeoutSeconds: 2
            periodSeconds: 30
            successThreshold: 1
            failureThreshold: 3
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
          imagePullPolicy: IfNotPresent
      restartPolicy: Always
      terminationGracePeriodSeconds: 30
      dnsPolicy: ClusterFirst
      securityContext:
        supplementalGroups:
          - 0
        fsGroup: 472

---

kind: Service
apiVersion: v1
metadata:
  name: sre-grafana
  namespace: ops
spec:
  ports:
    - name: sre-grafana
      protocol: TCP
      port: 3000
      targetPort: 3000
  selector:
    app: sre-grafana
  type: ClusterIP

---

kind: Ingress
apiVersion: networking.k8s.io/v1
metadata:
  name: sre-grafana
  namespace: ops
  annotations:
    kubernetes.io/ingress.class: private-nginx
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
spec:
  tls:
    - hosts:
        - sre-grafana.example.com
      secretName: example-com
  rules:
    - host: sre-grafana.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: sre-grafana
                port:
                  number: 3000
```
