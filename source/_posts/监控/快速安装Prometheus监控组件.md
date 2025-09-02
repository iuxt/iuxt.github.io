---
title: 快速安装Prometheus监控组件
categories:
  - 监控
tags: [prometheus, 监控, 配置记录, node_exporter]
abbrlink: ln38vw8d
cover: 'https://s3.babudiu.com/iuxt/public/Prometheus.svg'
date: 2023-09-28 22:02:43
updated: 2025-07-23 18:42:42
---

复制粘贴就能用，适用于非容器化安装， k8s 环境看这个， 更方便 [Kubernetes中使用Prometheus对集群节点做监控](/posts/61baae6f/)

安装方式为二进制安装，使用 systemd 来管理（也可以使用 supervisor 等进程管理工具）

## 安装 node_exporter

```bash
[ -d /data/src ] || mkdir -p /data/src
cd /data/src/
curl -OL -C - https://s3.babudiu.com/src/linux/tar/node_exporter-1.6.1.linux-amd64.tar.gz
tar xf node_exporter-1.6.1.linux-amd64.tar.gz
ln -sf /data/src/node_exporter-1.6.1.linux-amd64 ../node_exporter

cat >/etc/systemd/system/node_exporter.service <<EOF
[Unit]
Description=node_exporter
Documentation=https://prometheus.io/
After=network.target
[Service]
Type=simple
ExecStart=/data/node_exporter/node_exporter
Restart=on-failure
[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now node_exporter
```

## 安装 Prometheus

```bash
[ -d /data/src ] || mkdir -p /data/src
cd /data/src/
curl -OL -C - https://s3.babudiu.com/src/linux/tar/prometheus-2.49.1.linux-amd64.tar.gz
tar xf prometheus-2.49.1.linux-amd64.tar.gz
ln -sf /data/src/prometheus-2.49.1.linux-amd64 ../prometheus

cat >/etc/systemd/system/prometheus.service <<EOF
[Unit]
Description=Prometheus Server
Documentation=https://prometheus.io/docs/introduction/overview/
After=network-online.target

[Service]
Restart=on-failure
ExecStart=/data/prometheus/prometheus \
  --config.file=/data/prometheus/prometheus.yml \
  --storage.tsdb.path=/data/prometheus/data
ExecReload=/bin/kill -HUP $MAINPID
[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now prometheus
```
