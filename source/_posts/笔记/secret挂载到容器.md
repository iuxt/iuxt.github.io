---
date: 2026-03-02 18:57:00
updated: 2026-03-02 18:59:51
---

```yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  name: kube-toolkit-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kube-toolkit
  template:
    metadata:
      labels:
        app: kube-toolkit
    spec:
      volumes:
        - name: volume-3y4e6e
          secret:
            secretName: certs
            defaultMode: 420
      containers:
        - name: kube-toolkit
          image: 'registry.cn-hangzhou.aliyuncs.com/iuxt/kube-toolkit:20260126'
          volumeMounts:
            - name: volume-3y4e6e
              readOnly: true
              mountPath: /etc/nginx/certs/
```

图形界面操作：
![PixPin_2026-03-02_19-01-24.png|542](https://s3.babudiu.com/iuxt/2026/03/915b32a25bf2c7b8745173c882e81de6.png)

![PixPin_2026-03-02_19-00-40.png|542](https://s3.babudiu.com/iuxt/2026/03/c7ab164bdfba6d48a085511fa6c83442.png)
