---
title: 在Kubernetes集群中挂载configmap到pod中
categories:
  - 容器
tags:
  - 挂载
  - configmap
  - volume
abbrlink: 75a76e3b
cover: 'https://s3.babudiu.com/iuxt/public/kubernetes.svg'
date: 2023-06-01 14:27:38
---

## 挂载整个 configmap

```yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: busybox-configmap
data:
  1.txt: |
    11111111111111111
  2.txt: |
    22222222222222222

---

apiVersion: apps/v1
kind: Deployment
metadata:
  name: busybox
spec:
  selector:
    matchLabels:
      app: busybox
  replicas: 1
  template:
    metadata:
      labels:
        app: busybox
    spec:
      volumes:
      - name: busybox-volume
        configMap:
          name: busybox-configmap

      containers:
      - name: busybox
        image: registry.cn-hangzhou.aliyuncs.com/iuxt/busybox:1.36.1
        args:
        - /bin/sh
        - -c
        - sleep infinity

        volumeMounts:
        - name: busybox-volume                 # volumes的名字
          mountPath: /var/                     # 容器内的目录
```

此时 pod 内 `/var` 目录下会有两个文件 1.txt 和 2.txt。另外，如果 `/var` 目录原来是有数据的，那么挂载后里面也就只有 1.txt 和 2.txt， 看不到原来的文件了。（和挂载类似）

## 挂载指定的 key 到目录

```yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: busybox-configmap
data:
  1.txt: |
    11111111111111111
  2.txt: |
    22222222222222222

---

apiVersion: apps/v1
kind: Deployment
metadata:
  name: busybox
spec:
  selector:
    matchLabels:
      app: busybox
  replicas: 1
  template:
    metadata:
      labels:
        app: busybox
    spec:
      volumes:
      - name: busybox-volume
        configMap:
          name: busybox-configmap
          items:
            - key: 1.txt                      # 对应的configmap的key
              path: logstash.yml              # 挂载到容器内的文件名
            - key: 2.txt
              path: jvm.options

      containers:
      - name: busybox
        image: registry.cn-hangzhou.aliyuncs.com/iuxt/busybox:1.36.1
        args:
        - /bin/sh
        - -c
        - sleep infinity

        volumeMounts:
        - name: busybox-volume                 # volumes的名字
          mountPath: /var/                     # 容器内的目录
```

如上配置， 在容器中文件即为：

```bash
/var/logstash.yml     -->    11111111111111111
/var/jvm.options      -->    22222222222222222
```

这种挂载方式 会影响到原 /var/ 目录中的文件和目录。

增加 item 有两个作用：
- 可以自定义挂载后的文件名
- 可以选择 configmap 里面哪些 key 挂载，哪些 key 不挂载

## 使用 subpath 挂载 configmap

```yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: busybox-configmap
data:
  1.txt: |
    11111111111111111
  2.txt: |
    22222222222222222

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: busybox
spec:
  selector:
    matchLabels:
      app: busybox
  replicas: 1
  template:
    metadata:
      labels:
        app: busybox
    spec:
      volumes:
      - name: busybox-volume
        configMap:
          name: busybox-configmap

      containers:
      - name: busybox
        image: registry.cn-hangzhou.aliyuncs.com/iuxt/busybox:1.36.1
        args:
        - /bin/sh
        - -c
        - sleep infinity
        volumeMounts:
        - name: busybox-volume                      # volume的名字
          mountPath: /var/1.txt                     # 容器内的路径
          subPath: 1.txt                            # 指定configmap里面的key
        - name: busybox-volume
          mountPath: /var/2.txt
          subPath: 2.txt
```

这种挂载方式不会影响到 /var 目录内原始的文件，只是增加了这两个文件。
