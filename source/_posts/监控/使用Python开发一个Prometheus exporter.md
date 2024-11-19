---
title: 使用Python开发一个Prometheus exporter
categories:
  - 监控
abbrlink: siij5o
cover: https://static.zahui.fan/public/Prometheus.svg
date: 2024-08-20 18:44:11
tags:
---

需求：需要监控指定的邮箱发送邮件是否正常，使用 Prometheus 官方的 Python sdk，代码如下：

## 代码

```python
from prometheus_client import start_http_server, Gauge
import smtplib
import argparse
import time

# 创建一个 Gauge 类型的指标
EMAIL_AUTHENTICATION_SUCCESS = Gauge('email_authentication_success', 'Indicates if the email authentication was successful', ['email'])

def check_email_authentication(email, password, smtp_server, smtp_port):
    try:
        server = smtplib.SMTP_SSL(smtp_server, smtp_port)
        server.login(email, password)
        # 如果登录成功，则更新指标为 1
        EMAIL_AUTHENTICATION_SUCCESS.labels(email=email).set(1)
        server.quit()
    except Exception as e:
        # 如果登录失败，则更新指标为 0
        EMAIL_AUTHENTICATION_SUCCESS.labels(email=email).set(0)
        print(f"Failed to authenticate email {email}: {e}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Email Authentication Prometheus Exporter')
    parser.add_argument('--email', required=True, help='Email address to authenticate')
    parser.add_argument('--password', required=True, help='Password for the email account')
    parser.add_argument('--smtp_server', default='smtp.gmail.com', help='SMTP server address')
    parser.add_argument('--smtp_port', type=int, default=587, help='SMTP server port')

    args = parser.parse_args()

    # 启动 Prometheus HTTP 服务
    start_http_server(8000)

    print("Prometheus exporter is running on port 80. Use CTRL+C to exit.")

    # 让程序保持运行
    while True:
        # 进行邮箱验证
        check_email_authentication(args.email, args.password, args.smtp_server, args.smtp_port)
        # 等待一小时，频率太快容易被ban？
        time.sleep(3600)
```

## 展示

邮件登录正常：
![image.png](https://static.zahui.fan/images/202408201734136.png)

断开网络，或者修改邮箱密码：
![image.png](https://static.zahui.fan/images/202408201741839.png)

Prometheus 界面查询
![image.png](https://static.zahui.fan/images/202408201838450.png)

## 使用方式

安装依赖包

```bash
pip3 install prometheus-client
```

```bash
# 启动 exporter
python3.8 email_exporter.py --email qq@qq.com --password xxx --smtp_server smtp.feishu.cn --smtp_port 465
```

## 部署到 Kubernetes

### Dockerfile

```dockerfile
FROM python:3.9-slim
ADD email-exporter.py /
RUN pip3 install prometheus-client
```

### yaml

部署到 Kubernetes，借助 Prometheus 服务发现将 service 的 metrics 数据接入

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: email-exporter
  namespace: ops
spec:
  replicas: 1
  selector:
    matchLabels:
      app: email-exporter
  template:
    metadata:
      labels:
        app: email-exporter
    spec:
      containers:
        - image: registry.cn-hangzhou.aliyuncs.com/iuxt/email-exporter:1
          name: email-exporter
          command:
            - "bash"
          args:
            - "-c"
            - "python3 -u /email-exporter.py --email qq@qq.com --password xxx --smtp_server smtp.feishu.cn --smtp_port 465"
          resources:
            limits:
              cpu: 200m
              memory: 200Mi
            requests:
              cpu: 200m
              memory: 200Mi
---
apiVersion: v1
kind: Service
metadata:
  annotations:
    prometheus.io/env: dev
    prometheus.io/path: /
    prometheus.io/port: "80"
    prometheus.io/project: idp
    prometheus.io/scrape: "true"
  name: email-exporter
  namespace: ops
spec:
  ports:
    - port: 80
      protocol: TCP
      targetPort: 80
  selector:
    app: email-exporter
  type: ClusterIP

```

## 其他问题

python 容器化部署不产生控制台日志：

```bash
# 在部署python的容器服务时，docker logs/kubectl logs获取不到的主要原因是print的标准控制台输出，产生了buffer，导致控制台输出不及时。解决该缓存问题或者禁止buffer即可
python -u xx.py
```