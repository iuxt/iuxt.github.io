---
title: 使用cronjob自动重启k8s的deployment
categories:
  - 容器
tags:
  - k8s
  - kubectl
  - Kubernetes
  - Crontab
abbrlink: se4t7a
cover: 'https://s3.babudiu.com/iuxt/public/kubernetes.svg'
date: 2024-05-27 14:40:22
---

## 配置权限

```yml
---
kind: ServiceAccount
apiVersion: v1
metadata:
  name: deployment-restart
  namespace: default
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: deployment-restart
  namespace: default
rules:
  - apiGroups: ["apps", "extensions"]
    resources: ["deployments"]
    resourceNames: []
    verbs: ["get", "patch", "list", "watch"] # list 和 watch 就够用了，如果需要执行 rollout status ，则需要 get patch
---
# 角色绑定账号
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: deployment-restart
  namespace: default
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: deployment-restart
subjects:
  - kind: ServiceAccount
    name: deployment-restart
    namespace: default
```

## 编写 cronjob

```yml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: deployment-restart
  namespace: default
spec:
  # 多少秒后清理已完成的job，1.23版本之后可用。
  ttlSecondsAfterFinished: 100
  concurrencyPolicy: Forbid
  schedule: '37 14 * * *' # 分时日月周
  jobTemplate:
    spec:
      backoffLimit: 2
      activeDeadlineSeconds: 600
      template:
        spec:
          serviceAccountName: deployment-restart
          restartPolicy: Never
          containers:
            - name: kubectl
              # image: bitnami/kubectl:1.30.1
              image: registry.cn-hangzhou.aliyuncs.com/iuxt/kubectl:1.30.1
              command:
                - bash
                - -c
                - >-
                  kubectl rollout restart deployment/nginx &&
                  kubectl rollout status deployment/java-example
```