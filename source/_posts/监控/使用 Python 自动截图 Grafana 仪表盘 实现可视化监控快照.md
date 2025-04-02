---
title: 使用 Python 自动截图 Grafana 仪表盘，实现可视化监控快照
categories:
  - 监控
tags: [grafana, Puppeteer]
abbrlink: stucr2
date: 2025-03-29 00:06:38
cover: ""
updated: 2025-04-03 00:05:44
---

官方配置文档在这里：<https://grafana.com/docs/grafana/latest/setup-grafana/image-rendering/> 使用方式有两种，一种是直接在 grafana 机器上安装插件，另一个是使用外挂渲染器的方式。

## 部署渲染器 grafana-image-renderer

> 官方有现成的镜像，也可以不用自己构建镜像: `grafana/grafana-image-renderer:3.12.3` 也可以用 bitnami 打包的镜像：`bitnami/grafana-image-renderer:latest`， 我哼哧哼哧搞了半天才想起来官方也有镜像😓

我的 grafana 是运行在 kubernetes 里的，所以选择用外挂渲染器的方法。渲染器核心用的是 Puppeteer，根据官网文档安装依赖包：<https://pptr.dev/troubleshooting#chrome-doesnt-launch-on-linux> ，另外增加了中文字体包，解决了中文显示框框的问题。最终的渲染器镜像 dockerfile 如下：

```dockerfile
FROM node:22.14.0
RUN git clone --depth 1 https://github.com/grafana/grafana-image-renderer.git /app && \
    cd /app && \
    yarn install --pure-lockfile && \
    yarn run build
RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list.d/debian.sources && \
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
    fonts-wqy-microhei && \
    fc-cache -f -v && \
    apt clean all
WORKDIR /app
CMD ["node", "build/app.js", "server"]
```

部署在 kubernetes 中，yml 文件如下：

```yml
kind: Deployment
apiVersion: apps/v1
metadata:
  name: grafana-image-renderer
  namespace: ops
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana-image-renderer
  template:
    metadata:
      labels:
        app: grafana-image-renderer
    spec:
      containers:
        - name: grafana-image-renderer
          image: registry.cn-hangzhou.aliyuncs.com/iuxt/grafana-image-renderer:3
          env:
            - name: HTTP_HOST
              value: "0.0.0.0"
            - name: HTTP_PORT
              value: "80"
          resources:
            limits:
              cpu: 2
              memory: 2Gi
            requests:
              cpu: 2
              memory: 2Gi
          imagePullPolicy: IfNotPresent
      restartPolicy: Always
      terminationGracePeriodSeconds: 30
      dnsPolicy: ClusterFirst
---
kind: Service
apiVersion: v1
metadata:
  name: grafana-image-renderer
  namespace: ops
spec:
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  selector:
    app: grafana-image-renderer
  type: ClusterIP
```

## Grafana 接入渲染器

容器运行的 grafana 接入 渲染器，增加这两个环境变量

```yml
            - name: GF_RENDERING_SERVER_URL
              value: http://grafana-image-renderer/render
            - name: GF_RENDERING_CALLBACK_URL
              value: http://grafana:3000/
```

在对应的面板，点击分享 就可以拿到渲染后的图像链接，浏览器打开可以拿到对应的图片。

![image.png|637](https://static.zahui.fan/images/20250329003245507.png)

## 代码

核心代码就是这个，请求接口，然后保存成文件

```python
    def render_panel(self, panel_id, panel_title):
        """渲染面板并保存为 PNG"""
        response = requests.get(
            f"https://sre-grafana.ingeek.com/render/d-solo/{self.uid}?orgId=1&from={self.date_from}&to={self.date_to}&panelId={panel_id}&width=1500&height=750&scale=1&tz=Asia%2FShanghai",
            headers={"Authorization": f"Bearer {self.api_key}"}
        )
        print(response.url)
        safe_filename = re.sub(r'[\\/*?:"<>|]', '_', panel_title) + '.png'
        with open(safe_filename, 'wb') as f:
            f.write(response.content)
        print(f"download png success, save to {safe_filename}")
```

但是比如想自动截取一个 dashboard 里面的每一张图，就需要进行循环 panel 了。这种方式可以拿到 dashboard 的 json：

```python
    def get_dashboard_json(self):
        """获取仪表板 JSON 数据"""
        response = requests.get(
            f"https://sre-grafana.ingeek.com/api/dashboards/uid/{self.uid}",
            headers={"Authorization": f"Bearer {self.api_key}"}
        )
        return response.json()
```
