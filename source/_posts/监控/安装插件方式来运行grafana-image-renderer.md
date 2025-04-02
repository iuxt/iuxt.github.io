---
title: 安装插件方式来运行grafana-image-renderer
categories:
  - 监控
tags: [grafana, Docker, Puppeteer]
abbrlink: su3lwr
date: 2025-04-03 00:02:51
cover: ""
updated: 2025-04-03 00:10:24
---

```bash
grafana-cli plugins install grafana-image-renderer
```

或者可以到这里<https://grafana.com/grafana/plugins/grafana-image-renderer/?tab=installation>下载离线包，然后放到 plugins 文件夹下。需要注意下 plugins 文件夹的位置，可能使用命令安装的路径和真实的 plugins 目录不一致。
![image.png|654](https://static.zahui.fan/images/20250402181200283.png)

如果插件启动失败，报错：可以检查下 `plugins/grafana-image-renderer/chrome-headless-shell/linux-136.0.7101.0/chrome-headless-shell-linux64` 这个程序能否正常运行，如果报错
![image.png](https://static.zahui.fan/images/20250402181642753.png)

需要安装 `apt install -y libasound2t64`

## 完整配置容器

```bash
unzip 
```

```dockerfile
FROM grafana/grafana-oss:11.6.0-ubuntu
USER root
ADD grafana-image-renderer /var/lib/grafana/plugins/grafana-image-renderer/
```

```bash
docker build . -t xxx
docker run --name a xxx 
docker exec -it a bash
```

{% note default flat %}
这个脚本必须要登录容器后运行，如果写在 dockerfile 中，不能执行，很神奇，暂时不知道原因 (用下面的 Dockerfile 可以百分百复现，有知道原因的大佬麻烦告诉我原因)，所以我容器创建好了之后，再 `docker commit` 做的镜像。

```dockerfile
FROM grafana/grafana-oss:11.6.0-ubuntu
USER root
RUN sed -i 's@//.*archive.ubuntu.com@//mirrors.aliyun.com@g' /etc/apt/sources.list && \
    sed -i 's/security.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list && \
    apt-get update && \
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
    ttf-wqy-zenhei && \
    fc-cache -f -v && \
    apt clean all
ADD grafana-image-renderer /var/lib/grafana/plugins/grafana-image-renderer/
```

{% endnote %}

```bash
sed -i 's@//.*archive.ubuntu.com@//mirrors.aliyun.com@g' /etc/apt/sources.list
sed -i 's/security.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list
apt-get update
apt-get install -y ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils fonts-noto-cjk fonts-wqy-microhei
fc-cache -f -v
apt clean all
```

```bash
# 手动commit
docker commit grafana registry.cn-hangzhou.aliyuncs.com/iuxt/grafana-with-render:1
```

k8s 运行的时候，需要配置 `root_url` 被这个坑了很久

```yml
kind: Deployment
apiVersion: apps/v1
metadata:
  name: sre-grafana
  namespace: ops
  generation: 22
  creationTimestamp: '2024-10-12T08:37:23Z'
  labels:
    app: sre-grafana
  annotations:
    deployment.kubernetes.io/revision: '22'
spec:
  replicas: 1
  selector:
    matchLabels:
      app: sre-grafana
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: sre-grafana
      annotations:
        kubectl.kubernetes.io/redeployAt: '2024-10-28 11:28:33'
    spec:
      volumes:
        - name: ldap-config
          configMap:
            name: grafana-ldap-config
            defaultMode: 420
      containers:
        - name: grafana
          image: registry.cn-hangzhou.aliyuncs.com/iuxt/grafana-with-render:1
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
              value: 10.10.10.10
            - name: GF_DATABASE_PORT
              value: '3306'
            - name: GF_DATABASE_USER
              value: root
            - name: GF_DATABASE_PASSWORD
              value: 123456
            - name: GF_DATABASE_NAME
              value: sre-grafana
            - name: GF_AUTH_LDAP_ENABLED
              value: 'true'
            - name: GF_AUTH_LDAP_ALLOW_SIGN_UP
              value: 'true'
            - name: GF_AUTH_LDAP_CONFIG_FILE
              value: /etc/grafana/ldap.toml
            - name: GF_SERVER_ROOT_URL
              value: https://sre-grafana.ingeek.com/
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
      schedulerName: default-scheduler
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 25%
      maxSurge: 25%
  revisionHistoryLimit: 10
  progressDeadlineSeconds: 600

---

```
