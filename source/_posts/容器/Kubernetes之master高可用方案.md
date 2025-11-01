---
title: Kubernetes之master高可用方案
abbrlink: 10cef768
cover: 'https://s3.babudiu.com/iuxt/public/kubernetes.svg'
categories:
  - 容器
tags: [Kubernetes, k8s, HA, keepalived]
date: 2022-03-14 20:50:24
updated: 2025-11-01 08:52:35
---

之前一直用使用的负载方案是搭建一台负载均衡器，可以是 haproxy 或 nginx 或 lvs，来将多个 master 节点的 6443 端口做个负载均衡，但是考虑到负载均衡也需要高可用，所以会引入类似 keepalived 的方案来解决问题。偶然看到了 kubeasz 这个开源项目，宣称解决了 master 高可用问题，部署了一遍发现并没有额外搭建负载均衡器，研究了一下，发现了另一种思路。

## 使用额外的负载均衡来做高可用

这种就是比较容易想到的一种方案，比如 3 个 master 节点，前面有一台负载均衡（nginx、haproxy、lvs）等，但是负载均衡本身就是一个单点故障，所以一般来说还需要另一台负载均衡，通过 keepalived 来实现 VIP 的切换
[使用Keepalived来实现Nginx高可用](/posts/0cebb8ae)

![针对master节点做负载均衡](https://s3.babudiu.com/iuxt/images/lb_keepalived.png)

{% tabs TabName %}

<!-- tab 使用Nginx做负载均衡 -->

`vim nginx.conf` 在文件最后添加

```conf
stream {
    include stream.conf;
}
```

然后 `vim /etc/nginx/stream.conf`

```conf
upstream k8s-apiserver {
    server master1:6443;
    server master2:6443;
    server master3:6443;
}
server {
    listen 6443;
    proxy_connect_timeout 1s;
    proxy_pass k8s-apiserver;
}

upstream ingress-http {
    server 10.0.0.21:30080;   # 这里需要更改成ingress的NodePort
    server 10.0.0.22:30080;   # 这里需要更改成ingress的NodePort
}
server {
    listen 80;
    proxy_connect_timeout 1s;
    proxy_pass ingress-http;
}

upstream ingress-https {
    server 10.0.0.21:30443;   # 这里需要更改成ingress的NodePort
    server 10.0.0.22:30443;   # 这里需要更改成ingress的NodePort
}
server {
    listen 443;
    proxy_connect_timeout 1s;
    proxy_pass ingress-https;
}
```

因为我们用 nginx 四层负载 ingress，需要监听 80 端口，与 nginx 默认的端口监听冲突，所以需要删除默认的配置文件

```bash
rm -f /etc/nginx/sites-enabled/default
```

<!-- endtab -->

<!-- tab 使用HAproxy做负载均衡 -->

```bash
apt install -y haproxy
```

```conf
# /etc/haproxy/haproxy.cfg
# https://github.com/kubernetes/kubeadm/blob/main/docs/ha-considerations.md#options-for-software-load-balancing
#---------------------------------------------------------------------
# Global settings
#---------------------------------------------------------------------
global
    log /dev/log local0
    log /dev/log local1 notice
    daemon

#---------------------------------------------------------------------
# common defaults that all the 'listen' and 'backend' sections will
# use if not designated in their block
#---------------------------------------------------------------------
defaults
    mode                    http
    log                     global
    option                  httplog
    option                  dontlognull
    option http-server-close
    option forwardfor       except 127.0.0.0/8
    option                  redispatch
    retries                 1
    timeout http-request    10s
    timeout queue           20s
    timeout connect         5s
    timeout client          20s
    timeout server          20s
    timeout http-keep-alive 10s
    timeout check           10s


#---------------------------------------------------------------------
# apiserver frontend which proxys to the control plane nodes
#---------------------------------------------------------------------
frontend apiserver
    bind *:6443
    mode tcp
    option tcplog
    default_backend apiserverbackend

#---------------------------------------------------------------------
# round robin balancing for apiserver
#---------------------------------------------------------------------
backend apiserverbackend
    option httpchk GET /healthz
    http-check expect status 200
    mode tcp
    option ssl-hello-chk
    balance     roundrobin
        server master1 10.0.0.11:6443 check
        server master2 10.0.0.12:6443 check
        server master3 10.0.0.13:6443 check



frontend http_ingress_traffic_fe
    bind :80
    default_backend http_ingress_traffic_be
    mode tcp
    option tcplog
backend http_ingress_traffic_be
    balance source
    mode tcp
    server      worker1 10.0.0.21:30080 check   # 这里需要更改成ingress的NodePort
    server      worker2 10.0.0.22:30080 check   # 这里需要更改成ingress的NodePort

frontend https_ingress_traffic_fe
    bind *:443
    default_backend https_ingress_traffic_be
    mode tcp
    option tcplog
backend https_ingress_traffic_be
    balance source
    mode tcp
    server      worker1 10.0.0.21:30443 check   # 这里需要更改成ingress的NodePort
    server      worker2 10.0.0.22:30443 check   # 这里需要更改成ingress的NodePort
```

<!-- endtab -->

<!-- tab 使用LVS做负载均衡 -->

[使用keepalived完成LVS高可用](/posts/675d47a9/)

<!-- endtab -->

{% endtabs %}

## 在 master 上使用 vip

架构图如图所示， 使用 keepalived 维护 vip，每台 master 节点上都运行着一个负载均衡

![在master上使用vip](https://s3.babudiu.com/iuxt/images/202207050032858.jpg)

可以参考：[使用Keepalived来实现Nginx高可用](/posts/0cebb8ae/)

### haproxy

每台 master 都部署 haproxy

```conf
# https://github.com/kubernetes/kubeadm/blob/main/docs/ha-considerations.md#options-for-software-load-balancing
global
    log /dev/log local0
    log /dev/log local1 notice
    daemon

#---------------------------------------------------------------------
# common defaults that all the 'listen' and 'backend' sections will
# use if not designated in their block
#---------------------------------------------------------------------
defaults
    mode                    http
    log                     global
    option                  httplog
    option                  dontlognull
    option http-server-close
    option forwardfor       except 127.0.0.0/8
    option                  redispatch
    retries                 1
    timeout http-request    10s
    timeout queue           20s
    timeout connect         5s
    timeout client          20s
    timeout server          20s
    timeout http-keep-alive 10s
    timeout check           10s

#---------------------------------------------------------------------
# apiserver frontend which proxys to the control plane nodes
#---------------------------------------------------------------------
frontend apiserver
    bind *:8443
    mode tcp
    option tcplog
    default_backend apiserverbackend

#---------------------------------------------------------------------
# round robin balancing for apiserver
#---------------------------------------------------------------------
backend apiserverbackend
    option httpchk GET /healthz
    http-check expect status 200
    mode tcp
    option ssl-hello-chk
    balance     roundrobin
        server master1 10.0.0.11:6443 check
        server master2 10.0.0.12:6443 check
        server master3 10.0.0.13:6443 check

```

### master1

keepalived 配置

```conf
global_defs {
    script_user root            # 脚本执行者
    enable_script_security      # 标记脚本安全
}

vrrp_script check_apiserver {
    script "/usr/bin/curl -k https://localhost:8443/healthz"      # 脚本路径
    interval 3                                                    # 脚本执行间隔
    fall 2                                                        # 失败几次认为有问题
    rise 2
}

vrrp_instance VI_1 {                        # 实例名
    state  BACKUP                           # 这个是初始的状态， MASTER 或者 BACKUP， 非抢占模式必须为 BACKUP
    interface eth0               # 网卡
    virtual_router_id 251                   # ID主备需一致
    priority 100                            # 默认权重，3个节点保持不一致，并且MASTER最大，priority之间的差值要小于weight
    nopreempt                               # 设置非抢占模式，state必须设置为BACKUP才能生效

    authentication {
        auth_type PASS                      # 主备验证信息，需一致
        auth_pass 123456
    }
    track_script {
        check_apiserver                     # 调用脚本,若脚本最后的执行结果是非0的，则判断端口down掉，此时vip会漂移到keepalived-BACKUP上
    }
    unicast_src_ip 10.0.0.11              # 配置源地址的IP地址，自己的ip
    unicast_peer {
       10.0.0.12
       10.0.0.13                          # 配置其他keepalived节点
    }
    virtual_ipaddress {
        10.0.0.10 dev eth0         # vip 和 网卡
    }
}

```

### master2

keepalived 配置

```conf
global_defs {
    script_user root
    enable_script_security
}

vrrp_script check_apiserver {
    script "/usr/bin/curl -k https://localhost:8443/healthz"
    interval 3
    fall 2
    rise 2
}

vrrp_instance VI_1 {
    state  BACKUP
    interface eth0
    virtual_router_id 251
    priority 99
    nopreempt

    authentication {
        auth_type PASS
        auth_pass 123456
    }
    track_script {
        check_apiserver
    }
    unicast_src_ip 10.0.0.12
    unicast_peer {
       10.0.0.11
       10.0.0.13
    }
    virtual_ipaddress {
        10.0.0.10 dev eth0
    }
}

```

### master3

keepalived 配置

```conf
global_defs {
    script_user root
    enable_script_security
}

vrrp_script check_apiserver {
    script "/usr/bin/curl -k https://localhost:8443/healthz"
    interval 3
    fall 2
    rise 2
}

vrrp_instance VI_1 {
    state  BACKUP
    interface eth0
    virtual_router_id 251
    priority 98
    nopreempt

    authentication {
        auth_type PASS
        auth_pass 123456
    }
    track_script {
        check_apiserver
    }
    unicast_src_ip 10.0.0.13
    unicast_peer {
       10.0.0.11
       10.0.0.12
    }
    virtual_ipaddress {
        10.0.0.10 dev eth0
    }
}

```

## 在每个节点上部署负载均衡

是看到了有些开源项目不用额外的负载均衡器也可以完成 master 高可用
方案就是所有节点上安装负载均衡，架构图如下, 监听的是 `127.0.0.1:6443`，所有的服务都连接 `127.0.0.1:6443` 端口，然后负载到 3 台 master，这样不用担心负载均衡挂掉，挂掉也只会影响自己，缺点就是每台机器都需要额外部署服务，master 节点发生变化后, 每台机器都需要更新负载均衡的配置。**负载均衡在所有机器上都要安装（包括 worker 节点）**

![在worker节点搭建负载均衡](https://s3.babudiu.com/iuxt/images/worker_lb.jpg)

### 安装集群的时候

安装集群的时候,指定 `apiserver` 为 `127.0.0.1:8443`，然后每台机器上都部署一个负载均衡，监听 8443 端口， 转发到每个 master 节点的 6443

```bash
sudo kubeadm init \
--control-plane-endpoint "127.0.0.1:8443" \
--upload-certs \
--service-cidr=10.96.0.0/12 \
--pod-network-cidr=10.244.0.0/16
```

### 配置负载均衡

`Nginx` 和 `HAproxy` 选择一个就行, 所有 master 和 worker 节点都需要部署.

{% tabs TabName %}
<!-- tab 使用HAproxy -->

```conf
global
        log /dev/log    local1 warning
        chroot /var/lib/haproxy
        user haproxy
        group haproxy
        daemon
        nbproc 1

defaults
        log     global
        timeout connect 5s
        timeout client  10m
        timeout server  10m

listen kube_master
        bind 127.0.0.1:8443
        mode tcp
        option tcplog
        option dontlognull
        option dontlog-normal
        balance roundrobin
        server 10.0.0.11 10.0.0.11:6443 check inter 10s fall 2 rise 2 weight 1
        server 10.0.0.12 10.0.0.12:6443 check inter 10s fall 2 rise 2 weight 1
        server 10.0.0.13 10.0.0.13:6443 check inter 10s fall 2 rise 2 weight 1
```

<!-- endtab -->

<!-- tab 使用Nginx -->

```conf
user root;
worker_processes 1;

# 加载模块
include /usr/share/nginx/modules/*.conf;

error_log  /var/log/nginx/error.log warn;

events {
    worker_connections  3000;
}

stream {
    upstream backend {
        server 10.0.0.11:6443    max_fails=2 fail_timeout=3s;
        server 10.0.0.12:6443    max_fails=2 fail_timeout=3s;
        server 10.0.0.13:6443    max_fails=2 fail_timeout=3s;
    }

    server {
        listen 127.0.0.1:8443;
        proxy_connect_timeout 1s;
        proxy_pass backend;
    }
}
```

<!-- endtab -->
{% endtabs %}

### 如果需要用 6443 端口

master 上也需要安装负载均衡， apiserver 默认监听的地址是 `*:6443` ，如果需要使用 6443 端口，需要将 apiserver 监听地址修改成 `<主机IP>:6443` 这样 Nginx 才能监听 `127.0.0.1:6443`, 修改方式：

```bash
vim /etc/kubernetes/manifests/kube-apiserver.yaml
```

启动参数增加 `--bind-address=10.0.0.11`

```yaml
spec:
  containers:
  - command:
    - kube-apiserver
    - --advertise-address=10.0.0.11
...
    - --bind-address=10.0.0.11
    image: registry.k8s.io/kube-apiserver:v1.28.4
```

查看监听端口, 此时可以正常启动 负载均衡了.

![image.png](https://s3.babudiu.com/iuxt/images/202311171817270.png)
