---
title: Kubernetes 绑定Hosts的正确姿势
abbrlink: 23f11af0
cover: 'https://static.zahui.fan/public/kubernetes.svg'
categories:
  - 容器
tags:
  - k8s
  - Container
  - Docker
date: 2022-04-12 11:06:50
---

有的时候我们需要在容器里面绑定 hosts，比如我们用 logstash 需要消费 kafka 消息，但是 kafka 监听的地址是 hostname，这个时候就需要绑定 hosts（规范一点是做解析）
在容器里面绑定 hosts 常见的方法一种是挂载主机的 hosts 文件，一种是修改容器的启动 CMD，每次启动修改 hosts，这两种方法都有个缺点，就是不受 kubelet 管理了，默认的 hosts 内容也会被覆盖掉
在 k8s 环境下有更好的解决方案：那就是让 k8s 自己来管理

## 使用 hostAliases 来绑定 hosts

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: logstash-k8s
  namespace: ops
spec:
  replicas: 1
  selector:
    matchLabels:
      app: logstash-k8s
  template:
    metadata:
      labels:
        app: logstash-k8s
    spec:
      hostAliases:
      - ip: "10.0.0.17"
        hostnames:
        - "elk1"
      - ip: "10.0.0.18"
        hostnames:
        - "elk2"
      - ip: "10.0.0.19"
        hostnames:
        - "elk3"
```

## 进入容器查看 hosts 文件

```bash
kubectl exec -n ops logstash-k8s-68d6bf4dff-sxnst -- cat /etc/hosts
```

```conf
# Kubernetes-managed hosts file.
127.0.0.1    localhost
::1    localhost ip6-localhost ip6-loopback
fe00::0    ip6-localnet
fe00::0    ip6-mcastprefix
fe00::1    ip6-allnodes
fe00::2    ip6-allrouters
172.20.16.108    logstash-k8s-68d6bf4dff-sxnst

# Entries added by HostAliases.
10.0.0.17    elk1
10.0.0.18    elk2
10.0.0.19    elk3
```

这个 hosts 包括两个部分，一部分是容器自带的 hosts，另一部分是我们自己添加的

## 在 docker 下绑定 hosts

### 运行时候修改

docker 可以通过 --add-host 参数来添加 hosts 信息到容器的/etc/hosts 文件中

```bash
docker run --rm --add-host=example.com:192.168.1.2 ubuntu cat /etc/hosts
```

```conf
127.0.0.1    localhost
::1    localhost ip6-localhost ip6-loopback
fe00::0    ip6-localnet
ff00::0    ip6-mcastprefix
ff02::1    ip6-allnodes
ff02::2    ip6-allrouters
192.168.1.2    example.com
172.17.0.2    eece89ee8fc7
```

### 构建时修改

Dockerfile 中，可以在 CMD 命令下进行修改，在 RUN 里面修改会提示文件只读无法修改。

```Dockerfile
FROM centos:7
CMD echo "111" >> /etc/hosts && \
    echo "Hosts: " && \
    cat /etc/hosts
```

## 在 docker-compose 环境下绑定 hosts

在 yml 文件里

```yml
extra_hosts:
 - "test.com:192.168.1.1"
 - "example.com:192.168.1.2"
```

显示出来的效果/etc/hosts

```text
192.168.1.1  test.com
192.168.1.2  example.com
```
