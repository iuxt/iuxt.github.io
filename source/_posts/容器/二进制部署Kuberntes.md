---
title: 二进制部署Kuberntes
categories:
  - 容器
tags: [Kubernetes, 配置记录, keepalived, HA]
abbrlink: 67853ccb
cover: 'https://s3.babudiu.com/iuxt/public/kubernetes.svg'
date: 2023-06-13 17:53:43
updated: 2025-10-19 23:00:22
---

## 一些基本信息

我这里以 AlmaLinux9 系统为例，类似 CentOS9 或 RHEL9 ，其他系统部分操作需要根据情况修改。

| 主机名称    | IP 地址      | 说明       | Kubernetes 组件                                                                  | 其他软件                          |
| ------- | --------- | -------- | ----------------------------------------------------------------------------- | ----------------------------- |
| master1 | 10.0.0.11 | master 节点 | kube-apiserver、kube-controller-manager、kube-scheduler、etcd、kubelet、kube-proxy | haproxy、keepalived、containerd |
| master2 | 10.0.0.12 | master 节点 | kube-apiserver、kube-controller-manager、kube-scheduler、etcd、kubelet、kube-proxy | haproxy、keepalived、containerd |
| master3 | 10.0.0.13 | master 节点 | kube-apiserver、kube-controller-manager、kube-scheduler、etcd、kubelet、kube-proxy | haproxy、keepalived、containerd |
| worker1 | 10.0.0.21 | node 节点   | kubelet、kube-proxy                                                            | containerd                    |
| worker2 | 10.0.0.22 | node 节点   | kubelet、kube-proxy                                                            | containerd                    |

| 名称                           | IP 地址         | 说明                  |
| ---------------------------- | ------------- | ------------------- |
| SERVICE_CIDR                 | 10.96.0.0/12  |                     |
| CLUSTER_CIDR / Pod CIDR      | 10.244.0.0/16 | 这个配置需要和网络插件中的配置保持一致 |
| 集群 DNS kube-dns 的 Cluster IP | 10.96.0.10    |                     |

## 服务器基础配置

这里的步骤在所有节点上都需要执行。

### 关闭防火墙

```bash
systemctl disable --now firewalld
```

### 关闭 SELinux

```bash
setenforce 0
sed -i "s/^SELINUX=.*/SELINUX=disabled/g" /etc/selinux/config
```

### 关闭交换分区

```bash
sed -ri 's/.*swap.*/#&/' /etc/fstab
swapoff -a
```

### 配置 ulimit 限制

```bash
ulimit -SHn 65535
cat > /etc/security/limits.d/k8s-limits.conf <<EOF
* soft nofile 65535
* hard nofile 65535
* soft nproc 65535
* hard nproc 65535
* soft memlock unlimited
* hard memlock unlimited
EOF
```

{% note success flat %}
参数解释

soft nofile 655360
soft 表示软限制，nofile 表示一个进程可打开的最大文件数，默认值为 1024。这里的软限制设置为 655360，即一个进程可打开的最大文件数为 655360。

hard nofile 131072
hard 表示硬限制，即系统设置的最大值。nofile 表示一个进程可打开的最大文件数，默认值为 4096。这里的硬限制设置为 131072，即系统设置的最大文件数为 131072。

soft nproc 655350
soft 表示软限制，nproc 表示一个用户可创建的最大进程数，默认值为 30720。这里的软限制设置为 655350，即一个用户可创建的最大进程数为 655350。

hard nproc 655350
hard 表示硬限制，即系统设置的最大值。nproc 表示一个用户可创建的最大进程数，默认值为 4096。这里的硬限制设置为 655350，即系统设置的最大进程数为 655350。

soft memlock unlimited
seft 表示软限制，memlock 表示一个进程可锁定在 RAM 中的最大内存，默认值为 64 KB。这里的软限制设置为 unlimited，即一个进程可锁定的最大内存为无限制。

hard memlock unlimited
hard 表示硬限制，即系统设置的最大值。memlock 表示一个进程可锁定在 RAM 中的最大内存，默认值为 64 KB。这里的硬限制设置为 unlimited，即系统设置的最大内存锁定为无限制。
{% endnote %}

### 内核模块配置

```bash
yum install ipvsadm ipset sysstat conntrack libseccomp -y

cat > /etc/modules-load.d/ipvs.conf <<'EOF'
ip_vs
ip_vs_rr
ip_vs_wrr
ip_vs_sh
nf_conntrack
ip_tables
ip_set
xt_set
ipt_set
ipt_rpfilter
ipt_REJECT
ipip
EOF

# 重新加载内核模块
systemctl restart systemd-modules-load.service

# 验证配置结果
lsmod | grep -e ip_vs -e nf_conntrack
# ip_vs_sh               16384  0
# ip_vs_wrr              16384  0
# ip_vs_rr               16384  0
# ip_vs                 180224  6 ip_vs_rr,ip_vs_sh,ip_vs_wrr
# nf_conntrack          176128  1 ip_vs
# nf_defrag_ipv6         24576  2 nf_conntrack,ip_vs
# nf_defrag_ipv4         16384  1 nf_conntrack
# libcrc32c              16384  3 nf_conntrack,xfs,ip_vs
```

{% note success flat %}
参数解释

ip_vs
IPVS 是 Linux 内核中的一个模块，用于实现负载均衡和高可用性。它通过在前端代理服务器上分发传入请求到后端实际服务器上，提供了高性能和可扩展的网络服务。

ip_vs_rr
IPVS 的一种调度算法之一，使用轮询方式分发请求到后端服务器，每个请求按顺序依次分发。

ip_vs_wrr
IPVS 的一种调度算法之一，使用加权轮询方式分发请求到后端服务器，每个请求按照指定的权重比例分发。

ip_vs_sh
IPVS 的一种调度算法之一，使用哈希方式根据源 IP 地址和目标 IP 地址来分发请求。

nf_conntrack
这是一个内核模块，用于跟踪和管理网络连接，包括 TCP、UDP 和 ICMP 等协议。它是实现防火墙状态跟踪的基础。

ip_tables
这是一个内核模块，提供了对 Linux 系统 IP 数据包过滤和网络地址转换（NAT）功能的支持。

ip_set
这是一个内核模块，扩展了 iptables 的功能，支持更高效的 IP 地址集合操作。

xt_set
这是一个内核模块，扩展了 iptables 的功能，支持更高效的数据包匹配和操作。

ipt_set
这是一个用户空间工具，用于配置和管理 xt_set 内核模块。

ipt_rpfilter
这是一个内核模块，用于实现反向路径过滤，用于防止 IP 欺骗和 DDoS 攻击。

ipt_REJECT
这是一个 iptables 目标，用于拒绝 IP 数据包，并向发送方发送响应，指示数据包被拒绝。

ipip
这是一个内核模块，用于实现 IP 封装在 IP（IP-over-IP）的隧道功能。它可以在不同网络之间创建虚拟隧道来传输 IP 数据包。
{% endnote %}

### 内核参数配置

```bash
cat > /etc/sysctl.d/k8s.conf <<'EOF'
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-iptables = 1
fs.may_detach_mounts = 1
vm.overcommit_memory=1
vm.panic_on_oom=0
fs.inotify.max_user_watches=89100
fs.file-max=52706963
fs.nr_open=52706963
net.netfilter.nf_conntrack_max=2310720

net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_probes = 3
net.ipv4.tcp_keepalive_intvl =15
net.ipv4.tcp_max_tw_buckets = 36000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_max_orphans = 327680
net.ipv4.tcp_orphan_retries = 3
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 16384
net.ipv4.ip_conntrack_max = 65536
net.ipv4.tcp_max_syn_backlog = 16384
net.ipv4.tcp_timestamps = 0
net.core.somaxconn = 16384

EOF

sysctl --system
```

{% note success flat %}
1. net.ipv4.ip_forward = 1
   - 这个参数启用了 IPv4 的 IP 转发功能，允许服务器作为网络路由器转发数据包。

2. net.bridge.bridge-nf-call-iptables = 1
   - 当使用网络桥接技术时，将数据包传递到 iptables 进行处理。

3. fs.may_detach_mounts = 1
   - 允许在挂载文件系统时，允许被其他进程使用。

4. vm.overcommit_memory=1
   - 该设置允许原始的内存过量分配策略，当系统的内存已经被完全使用时，系统仍然会分配额外的内存。

5. vm.panic_on_oom=0
   - 当系统内存不足（OOM）时，禁用系统崩溃和重启。

6. fs.inotify.max_user_watches=89100
   - 设置系统允许一个用户的 inotify 实例可以监控的文件数目的上限。

7. fs.file-max=52706963
   - 设置系统同时打开的文件数的上限。

8. fs.nr_open=52706963
   - 设置系统同时打开的文件描述符数的上限。

9. net.netfilter.nf_conntrack_max=2310720
   - 设置系统可以创建的网络连接跟踪表项的最大数量。

10. net.ipv4.tcp_keepalive_time = 600
    - 设置 TCP 套接字的空闲超时时间（秒），超过该时间没有活动数据时，内核会发送心跳包。

11. net.ipv4.tcp_keepalive_probes = 3
    - 设置未收到响应的 TCP 心跳探测次数。

12. net.ipv4.tcp_keepalive_intvl = 15
    - 设置 TCP 心跳探测的时间间隔（秒）。

13. net.ipv4.tcp_max_tw_buckets = 36000
    - 设置系统可以使用的 TIME_WAIT 套接字的最大数量。

14. net.ipv4.tcp_tw_reuse = 1
    - 启用 TIME_WAIT 套接字的重新利用，允许新的套接字使用旧的 TIME_WAIT 套接字。

15. net.ipv4.tcp_max_orphans = 327680
    - 设置系统可以同时存在的 TCP 套接字垃圾回收包裹数的最大数量。

16. net.ipv4.tcp_orphan_retries = 3
    - 设置系统对于孤立的 TCP 套接字的重试次数。

17. net.ipv4.tcp_syncookies = 1
    - 启用 TCP SYN cookies 保护，用于防止 SYN 洪泛攻击。

18. net.ipv4.tcp_max_syn_backlog = 16384
    - 设置新的 TCP 连接的半连接数（半连接队列）的最大长度。

19. net.ipv4.ip_conntrack_max = 65536
    - 设置系统可以创建的网络连接跟踪表项的最大数量。

20. net.ipv4.tcp_timestamps = 0
    - 关闭 TCP 时间戳功能，用于提供更好的安全性。

21. net.core.somaxconn = 16384
    - 设置系统核心层的连接队列的最大值。
{% endnote %}

### 配置 hosts

```bash
cat > /etc/hosts <<'EOF'
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6

10.0.0.11 master1
10.0.0.12 master2
10.0.0.13 master3
EOF
```

## 容器运行时

容器运行时常用的有 `Docker` 和 `containerd`，这里安装 `containerd`

CNI 插件地址： <https://github.com/containernetworking/plugins/>
Containerd 地址： <https://github.com/containerd/containerd/releases/>
runc 地址： <https://github.com/opencontainers/runc/releases>

容器运行时所有节点都要安装

### 配置 Containerd 所需的内核模块

```bash
cat > /etc/modules-load.d/containerd.conf <<'EOF'
overlay
br_netfilter
EOF

systemctl restart systemd-modules-load.service
```

{% note success flat %}
 参数解释：
1. overlay：overlay 是容器 d 默认使用的存储驱动，它提供了一种轻量级的、可堆叠的、逐层增量的文件系统。它通过在现有文件系统上叠加文件系统层来创建容器的文件系统视图。每个容器可以有自己的一组文件系统层，这些层可以共享基础镜像中的文件，并在容器内部进行修改。使用 overlay 可以有效地使用磁盘空间，并使容器更加轻量级。
2. br_netfilter：br_netfilter 是 Linux 内核提供的一个网络过滤器模块，用于在容器网络中进行网络过滤和 NAT 转发。当容器和主机之间的网络通信需要进行 DNAT 或者 SNAT 时，br_netfilter 模块可以将 IP 地址进行转换。它还可以提供基于 iptables 规则的网络过滤功能，用于限制容器之间或容器与外部网络之间的通信。
{% endnote %}

### 配置 Containerd 所需的内核参数

```bash
cat > /etc/sysctl.d/99-kubernetes-cri.conf << 'EOF'
net.bridge.bridge-nf-call-iptables  = 1
net.ipv4.ip_forward                 = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF

sysctl --system
```

{% note success flat %}
参数解释：
- net.bridge.bridge-nf-call-iptables：这个参数控制网络桥接设备是否调用 iptables 规则处理网络数据包。当该参数设置为 1 时，网络数据包将被传递到 iptables 进行处理；当该参数设置为 0 时，网络数据包将绕过 iptables 直接传递。默认情况下，这个参数的值是 1，即启用 iptables 规则处理网络数据包。
- net.ipv4.ip_forward：这个参数用于控制是否启用 IP 转发功能。IP 转发使得操作系统可以将接收到的数据包从一个网络接口转发到另一个网络接口。当该参数设置为 1 时，启用 IP 转发功能；当该参数设置为 0 时，禁用 IP 转发功能。在网络环境中，通常需要启用 IP 转发功能来实现不同网络之间的通信。默认情况下，这个参数的值是 0，即禁用 IP 转发功能。
- net.bridge.bridge-nf-call-ip6tables：这个参数与 net.bridge.bridge-nf-call-iptables 类似，但是它用于 IPv6 数据包的处理。当该参数设置为 1 时，IPv6 数据包将被传递到 ip6tables 进行处理；当该参数设置为 0 时，IPv6 数据包将绕过 ip6tables 直接传递。默认情况下，这个参数的值是 1，即启用 ip6tables 规则处理 IPv6 数据包。
{% endnote %}

### 安装 Containerd

`cri-containerd-cni-*-linux-amd64.tar.gz` 里面包含了 cni 插件和 runc

```bash
# https://github.com/containerd/containerd/releases/
# https://github.com/containerd/containerd/releases/download/v1.7.13/cri-containerd-cni-1.7.13-linux-amd64.tar.gz

tar -xzf cri-containerd-cni-*-linux-amd64.tar.gz -C /
rm -rf /etc/cni/net.d/10-containerd-net.conflist

# 创建服务启动文件
cat > /etc/systemd/system/containerd.service << 'EOF'
[Unit]
Description=containerd container runtime
Documentation=https://containerd.io
After=network.target local-fs.target

[Service]
ExecStartPre=-/sbin/modprobe overlay
ExecStart=/usr/local/bin/containerd
Type=notify
Delegate=yes
KillMode=process
Restart=always
RestartSec=5
LimitNPROC=infinity
LimitCORE=infinity
LimitNOFILE=infinity
TasksMax=infinity
OOMScoreAdjust=-999

[Install]
WantedBy=multi-user.target
EOF

```

{% note success flat %}
参数解释：

这是一个用于启动 containerd 容器运行时的 systemd unit 文件。下面是对该文件不同部分的详细解释：

[Unit]
Description=containerd container runtime
描述该 unit 的作用是作为 containerd 容器运行时。

Documentation=<https://containerd.io>
指向容器运行时的文档的 URL。

After=network.target local-fs.target
定义了在哪些依赖项之后该 unit 应该被启动。在网络和本地文件系统加载完成后启动，确保了容器运行时在这些依赖项可用时才会启动。

[Service]
ExecStartPre=-/sbin/modprobe overlay
在启动 containerd 之前执行的命令。这里的命令是尝试加载内核的 overlay 模块，如果失败则忽略错误继续执行下面的命令。

ExecStart=/usr/local/bin/containerd
实际执行的命令，用于启动 containerd 容器运行时。

Type=notify
指定服务的通知类型。这里使用 notify 类型，表示当服务就绪时会通过通知的方式告知 systemd。

Delegate=yes
允许 systemd 对此服务进行重启和停止操作。

KillMode=process
在终止容器运行时时使用的 kill 模式。这里使用 process 模式，表示通过终止进程来停止容器运行时。

Restart=always
定义了当容器运行时终止后的重启策略。这里设置为 always，表示无论何时终止容器运行时，都会自动重新启动。

RestartSec=5
在容器运行时终止后重新启动之前等待的秒数。

LimitNPROC=infinity
指定容器运行时可以使用的最大进程数量。这里设置为无限制。

LimitCORE=infinity
指定容器运行时可以使用的最大 CPU 核心数量。这里设置为无限制。

LimitNOFILE=infinity
指定容器运行时可以打开的最大文件数。这里设置为无限制。

TasksMax=infinity
指定容器运行时可以创建的最大任务数。这里设置为无限制。

OOMScoreAdjust=-999
指定容器运行时的 OOM（Out-Of-Memory）分数调整值。负数值表示容器运行时的优先级较高。

[Install]
WantedBy=multi-user.target
定义了服务的安装位置。这里指定为 multi-user.target，表示将服务安装为多用户模式下的启动项。
{% endnote %}

如果 containerd 官方不维护带 cni 插件和 runc 的包了，可以这样手动安装

```bash
# 下载cni插件 https://github.com/containernetworking/plugins/
# mkdir -p /etc/cni/net.d /opt/cni/bin 
# tar xf cni-plugins-linux-amd64-v*.tgz -C /opt/cni/bin/

# 下载runc https://github.com/opencontainers/runc/releases
# install -m 755 runc.amd64 /usr/local/sbin/runc
```

### Containerd 配置文件

```bash
# 创建默认配置文件
mkdir -p /etc/containerd
containerd config default | tee /etc/containerd/config.toml

# 修改Containerd的配置文件
sed -i 's#SystemdCgroup = .*#SystemdCgroup = true#g' /etc/containerd/config.toml
sed -i "s#registry.k8s.io#m.daocloud.io/registry.k8s.io#g" /etc/containerd/config.toml

```

### 启动并设置为开机启动

```bash
# 重新加载systemd管理的单位文件。当你修改了某个单位文件（如.service文件、.socket文件等），需要运行该命令来刷新systemd对该文件的配置。
# systemctl daemon-reload

systemctl enable --now containerd.service
systemctl status containerd.service
journalctl -u containerd -f
```

### 配置 crictl 客户端

```bash
# https://github.com/kubernetes-sigs/cri-tools/releases/
# https://github.com/kubernetes-sigs/cri-tools/releases/download/v1.29.0/crictl-v1.29.0-linux-amd64.tar.gz

# 解压
tar xf crictl-v*-linux-amd64.tar.gz -C /usr/local/bin/

# 生成配置文件
cat > /etc/crictl.yaml <<'EOF'
runtime-endpoint: unix:///run/containerd/containerd.sock
image-endpoint: unix:///run/containerd/containerd.sock
timeout: 10
debug: false
EOF

# 测试
crictl info
```

## ApiServer 高可用方案

高可用方案有很多种，其他方案请参考 [Kubernetes之master高可用方案](/posts/10cef768/)
这里使用**每台**节点部署 nginx 反代来实现高可用。

```bash
mkdir -p /etc/kube-lb/{conf,logs,sbin}

curl -L -C - https://s3.babudiu.com/src/linux/bin/kube-lb -o /etc/kube-lb/sbin/kube-lb
chmod +x /etc/kube-lb/sbin/kube-lb


cat > /etc/kube-lb/conf/kube-lb.conf <<'EOF'
user root;
worker_processes 1;

error_log  /etc/kube-lb/logs/error.log warn;

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
        listen 127.0.0.1:6443;
        proxy_connect_timeout 1s;
        proxy_pass backend;
    }
}
EOF

cat > /etc/systemd/system/kube-lb.service <<'EOF'
[Unit]
Description=l4 nginx proxy for kube-apiservers
After=network.target
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
ExecStartPre=/etc/kube-lb/sbin/kube-lb -c /etc/kube-lb/conf/kube-lb.conf -p /etc/kube-lb -t
ExecStart=/etc/kube-lb/sbin/kube-lb -c /etc/kube-lb/conf/kube-lb.conf -p /etc/kube-lb
ExecReload=/etc/kube-lb/sbin/kube-lb -c /etc/kube-lb/conf/kube-lb.conf -p /etc/kube-lb -s reload
PrivateTmp=true
Restart=always
RestartSec=15
StartLimitInterval=0
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF


# 启动服务
systemctl enable --now kube-lb
```

{% note default flat %}
kube-lb 其实就是自己编译的 Nginx，精简了 http 模块，只开启了 stream 模块用作 4 层转发，详细参数如下：

nginx version: nginx/1.24.0
built by gcc 4.8.5 20150623 (Red Hat 4.8.5-44) (GCC)
configure arguments: --with-stream --without-http --without-http_uwsgi_module --without-http_scgi_module --without-http_fastcgi_module
{% endnote %}

## 准备证书和 kubeconfig 文件

### 安装 cfssl

也可以使用 openssl，但 openssl 相对要稍微麻烦一点

```bash
# master1节点下载证书生成工具
# wget "https://github.com/cloudflare/cfssl/releases/download/v1.6.4/cfssl_1.6.4_linux_amd64" -O /usr/local/bin/cfssl
# wget "https://github.com/cloudflare/cfssl/releases/download/v1.6.4/cfssljson_1.6.4_linux_amd64" -O /usr/local/bin/cfssljson

# 软件包内有
cp cfssl_*_linux_amd64 /usr/local/bin/cfssl
cp cfssljson_*_linux_amd64 /usr/local/bin/cfssljson

# 添加执行权限
chmod +x /usr/local/bin/cfssl /usr/local/bin/cfssljson

mkdir -p ~/kubernetes/ssl/ && cd ~/kubernetes/
```

### 解压 k8s 可执行文件

官方开源地址： <https://github.com/kubernetes/kubernetes/>

```bash
# https://dl.k8s.io/v1.29.2/kubernetes-server-linux-amd64.tar.gz
tar -xf kubernetes-server-linux-amd64.tar.gz  --strip-components=3 -C /usr/local/bin kubernetes/server/bin/kube{let,ctl,-apiserver,-controller-manager,-scheduler,-proxy}

# 这是一个tar命令，用于解压指定的kubernetes-server-linux-amd64.tar.gz文件，并将其中的特定文件提取到/usr/local/bin目录下。
# 
# 命令的解释如下：
# - tar：用于处理tar压缩文件的命令。
# - -xf：表示解压操作。
# - kubernetes-server-linux-amd64.tar.gz：要解压的文件名。
# - --strip-components=3：表示解压时忽略压缩文件中的前3级目录结构，提取文件时直接放到目标目录中。
# - -C /usr/local/bin：指定提取文件的目标目录为/usr/local/bin。
# - kubernetes/server/bin/kube{let,ctl,-apiserver,-controller-manager,-scheduler,-proxy}：要解压和提取的文件名模式，用花括号括起来表示模式中的多个可能的文件名。

# 将组件发送到其他节点
Master='master1 master2 master3'
Worker='worker1 worker2'

# 拷贝master组件
for NODE in $Master; do
    echo $NODE
    scp /usr/local/bin/kube{let,ctl,-apiserver,-controller-manager,-scheduler,-proxy} $NODE:/usr/local/bin/
done

# 拷贝worker组件
for NODE in $Worker; do
    echo $NODE
    scp /usr/local/bin/kube{let,-proxy} $NODE:/usr/local/bin/
done
```

### 准备 Etcd 证书配置文件、证书签名请求

```bash
# 证书在随便一台机器上生成
cat > ca-config.json << 'EOF'
{
  "signing": {
    "default": {
      "expiry": "876000h"
    },
    "profiles": {
      "kubernetes": {
        "usages": [
            "signing",
            "key encipherment",
            "server auth",
            "client auth"
        ],
        "expiry": "876000h"
      }
    }
  }
}
EOF

# CA证书设置过期时间为100年
# `profiles`部分定义了不同的证书配置文件。
# 在这里，只有一个配置文件`kubernetes`。它包含了以下`usages`和过期时间`expiry`：
# 
# 1. `signing`：用于对其他证书进行签名
# 2. `key encipherment`：用于加密和解密传输数据
# 3. `server auth`：用于服务器身份验证
# 4. `client auth`：用于客户端身份验证

cat > etcd-ca-csr.json  << 'EOF'
{
  "CN": "etcd",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Shanghai",
      "L": "Shanghai",
      "O": "etcd",
      "OU": "Etcd Security"
    }
  ],
  "ca": {
    "expiry": "876000h"
  }
}
EOF

# 这是一个用于生成证书签名请求（Certificate Signing Request，CSR）的JSON配置文件。JSON配置文件指定了生成证书签名请求所需的数据。
# 
# - "CN": "etcd" 指定了希望生成的证书的CN字段（Common Name），即证书的主题，通常是该证书标识的实体的名称。
# - "key": {} 指定了生成证书所使用的密钥的配置信息。"algo": "rsa" 指定了密钥的算法为RSA，"size": 2048 指定了密钥的长度为2048位。
# - "names": [] 包含了生成证书时所需的实体信息。在这个例子中，只包含了一个实体，其相关信息如下：
#   - "C": "CN" 指定了实体的国家/地区代码，这里是中国。
#   - "ST": "Shanghai" 指定了实体所在的省/州。
#   - "L": "Shanghai" 指定了实体所在的城市。
#   - "O": "etcd" 指定了实体的组织名称。
#   - "OU": "Etcd Security" 指定了实体所属的组织单位。
# - "ca": {} 指定了生成证书时所需的CA（Certificate Authority）配置信息。
#   - "expiry": "876000h" 指定了证书的有效期，这里是876000小时。

# 生成了Etcd的CA证书
cfssl gencert -initca etcd-ca-csr.json | cfssljson -bare ssl/etcd-ca

cat > etcd-csr.json << 'EOF'
{
  "CN": "etcd",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Shanghai",
      "L": "Shanghai",
      "O": "etcd",
      "OU": "Etcd Security"
    }
  ]
}
EOF

# 使用etcd的ca证书和证书签名请求来生成etcd的证书
cfssl gencert \
   -ca=ssl/etcd-ca.pem \
   -ca-key=ssl/etcd-ca-key.pem \
   -config=ca-config.json \
   -hostname=127.0.0.1,master1,master2,master3,10.0.0.11,10.0.0.12,10.0.0.13 \
   -profile=kubernetes \
   etcd-csr.json | cfssljson -bare ssl/etcd
```

### 生成 apiserver 证书

```bash
# 在随便一台机器上执行
cat > ca-csr.json << 'EOF'
{
  "CN": "kubernetes",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Shanghai",
      "L": "Shanghai",
      "O": "Kubernetes",
      "OU": "Kubernetes-manual"
    }
  ],
  "ca": {
    "expiry": "876000h"
  }
}
EOF

# 生成CA证书，Kubernetes使用
cfssl gencert -initca ca-csr.json | cfssljson -bare ssl/ca


cat > apiserver-csr.json << 'EOF'
{
  "CN": "kube-apiserver",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Shanghai",
      "L": "Shanghai",
      "O": "Kubernetes",
      "OU": "Kubernetes-manual"
    }
  ]
}
EOF

# 使用CA生成apiserver证书
cfssl gencert \
  -ca=ssl/ca.pem   \
  -ca-key=ssl/ca-key.pem   \
  -config=ca-config.json   \
  -hostname=10.96.0.1,127.0.0.1,kubernetes,kubernetes.default,kubernetes.default.svc,kubernetes.default.svc.cluster,kubernetes.default.svc.cluster.local,10.0.0.10,10.0.0.11,10.0.0.12,10.0.0.13,10.0.0.14,10.0.0.15 \
  -profile=kubernetes apiserver-csr.json | cfssljson -bare ssl/apiserver

```

### 生成 apiserver 聚合证书

```bash
cat > front-proxy-ca-csr.json  << 'EOF'
{
  "CN": "kubernetes",
  "key": {
     "algo": "rsa",
     "size": 2048
  },
  "ca": {
    "expiry": "876000h"
  }
}
EOF


cfssl gencert -initca front-proxy-ca-csr.json | cfssljson -bare ssl/front-proxy-ca 

cat > front-proxy-client-csr.json  << 'EOF'
{
  "CN": "front-proxy-client",
  "key": {
     "algo": "rsa",
     "size": 2048
  }
}
EOF

cfssl gencert  \
    -ca=ssl/front-proxy-ca.pem   \
    -ca-key=ssl/front-proxy-ca-key.pem   \
    -config=ca-config.json   \
    -profile=kubernetes front-proxy-client-csr.json | cfssljson -bare ssl/front-proxy-client

```

### 生成 kube-controller-manager 证书

```bash
cat > kube-controller-manager-csr.json << 'EOF'
{
  "CN": "system:kube-controller-manager",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Shanghai",
      "L": "Shanghai",
      "O": "system:kube-controller-manager",
      "OU": "Kubernetes-manual"
    }
  ]
}
EOF


cfssl gencert \
   -ca=ssl/ca.pem \
   -ca-key=ssl/ca-key.pem \
   -config=ca-config.json \
   -profile=kubernetes \
   kube-controller-manager-csr.json | cfssljson -bare ssl/controller-manager

```

### 生成 controller-manager.kubeconfig

```bash
kubectl config set-cluster kubernetes \
     --certificate-authority=ssl/ca.pem \
     --embed-certs=true \
     --server=https://127.0.0.1:6443 \
     --kubeconfig=controller-manager.kubeconfig

kubectl config set-context system:kube-controller-manager@kubernetes \
    --cluster=kubernetes \
    --user=system:kube-controller-manager \
    --kubeconfig=controller-manager.kubeconfig

kubectl config set-credentials system:kube-controller-manager \
      --client-certificate=ssl/controller-manager.pem \
      --client-key=ssl/controller-manager-key.pem \
      --embed-certs=true \
      --kubeconfig=controller-manager.kubeconfig

kubectl config use-context system:kube-controller-manager@kubernetes \
     --kubeconfig=controller-manager.kubeconfig

```

### 生成 scheduler 的证书

```bash
cat > scheduler-csr.json << 'EOF'
{
  "CN": "system:kube-scheduler",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Shanghai",
      "L": "Shanghai",
      "O": "system:kube-scheduler",
      "OU": "Kubernetes-manual"
    }
  ]
}
EOF

cfssl gencert \
  -ca=ssl/ca.pem \
  -ca-key=ssl/ca-key.pem \
  -config=ca-config.json \
  -profile=kubernetes \
  scheduler-csr.json | cfssljson -bare ssl/scheduler
```

### 生成 scheduler.kubeconfig

```bash
kubectl config set-cluster kubernetes \
  --certificate-authority=ssl/ca.pem \
  --embed-certs=true \
  --server=https://127.0.0.1:6443 \
  --kubeconfig=scheduler.kubeconfig

kubectl config set-credentials system:kube-scheduler \
  --client-certificate=ssl/scheduler.pem \
  --client-key=ssl/scheduler-key.pem \
  --embed-certs=true \
  --kubeconfig=scheduler.kubeconfig

kubectl config set-context system:kube-scheduler@kubernetes \
  --cluster=kubernetes \
  --user=system:kube-scheduler \
  --kubeconfig=scheduler.kubeconfig

kubectl config use-context system:kube-scheduler@kubernetes \
  --kubeconfig=scheduler.kubeconfig

```

### 生成 kubectl 的证书配置

```bash
cat > admin-csr.json << 'EOF'
{
  "CN": "admin",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Shanghai",
      "L": "Shanghai",
      "O": "system:masters",
      "OU": "Kubernetes-manual"
    }
  ]
}
EOF

cfssl gencert \
   -ca=ssl/ca.pem \
   -ca-key=ssl/ca-key.pem \
   -config=ca-config.json \
   -profile=kubernetes \
   admin-csr.json | cfssljson -bare ssl/admin

```

### 生成 kubectl 的 admin.kubeconfig

```bash

kubectl config set-cluster kubernetes     \
  --certificate-authority=ssl/ca.pem     \
  --embed-certs=true     \
  --server=https://127.0.0.1:6443     \
  --kubeconfig=admin.kubeconfig

kubectl config set-credentials kubernetes-admin  \
  --client-certificate=ssl/admin.pem     \
  --client-key=ssl/admin-key.pem     \
  --embed-certs=true     \
  --kubeconfig=admin.kubeconfig

kubectl config set-context kubernetes-admin@kubernetes    \
  --cluster=kubernetes     \
  --user=kubernetes-admin     \
  --kubeconfig=admin.kubeconfig

kubectl config use-context kubernetes-admin@kubernetes --kubeconfig=admin.kubeconfig

echo "export KUBECONFIG='/etc/kubernetes/admin.kubeconfig'" >> ~/.bashrc && source ~/.bashrc
```

### 创建 kube-proxy 证书

```bash
cat > kube-proxy-csr.json  << 'EOF'
{
  "CN": "system:kube-proxy",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Shanghai",
      "L": "Shanghai",
      "O": "system:kube-proxy",
      "OU": "Kubernetes-manual"
    }
  ]
}
EOF

cfssl gencert \
   -ca=ssl/ca.pem \
   -ca-key=ssl/ca-key.pem \
   -config=ca-config.json \
   -profile=kubernetes \
   kube-proxy-csr.json | cfssljson -bare ssl/kube-proxy
```

### 创建 kube-proxy.kubeconfig

```bash
kubectl config set-cluster kubernetes     \
  --certificate-authority=ssl/ca.pem     \
  --embed-certs=true     \
  --server=https://127.0.0.1:6443     \
  --kubeconfig=kube-proxy.kubeconfig

kubectl config set-credentials kube-proxy  \
  --client-certificate=ssl/kube-proxy.pem     \
  --client-key=ssl/kube-proxy-key.pem     \
  --embed-certs=true     \
  --kubeconfig=kube-proxy.kubeconfig

kubectl config set-context kube-proxy@kubernetes    \
  --cluster=kubernetes     \
  --user=kube-proxy     \
  --kubeconfig=kube-proxy.kubeconfig

kubectl config use-context kube-proxy@kubernetes --kubeconfig=kube-proxy.kubeconfig
```

### 创建 ServiceAccount Key

```bash
openssl genrsa -out ssl/sa.key 2048
openssl rsa -in ssl/sa.key -pubout -out ssl/sa.pub
```

### 将证书发送到其他 master 节点

```bash
#!/bin/bash

for NODE in master1 master2 master3; do
    ssh ${NODE} "mkdir /etc/kubernetes/pki/ -p"
    ssh ${NODE} "mkdir /etc/etcd/ssl/ -p"
    for FILE in etcd-ca-key.pem etcd-ca.pem etcd-key.pem etcd.pem; do scp ~/kubernetes/ssl/${FILE} $NODE:/etc/etcd/ssl/${FILE}; done

    for FILE in admin.pem admin-key.pem apiserver.pem apiserver-key.pem front-proxy-ca.pem front-proxy-client-key.pem sa.pub sa.key ca.pem ca-key.pem front-proxy-ca-key.pem front-proxy-client.pem; do
        scp ~/kubernetes/ssl/${FILE} $NODE:/etc/kubernetes/pki/${FILE}
    done

    for FILE in kube-proxy.kubeconfig admin.kubeconfig controller-manager.kubeconfig scheduler.kubeconfig; do
        scp ~/kubernetes/${FILE} $NODE:/etc/kubernetes/${FILE}
    done
done
```

## Etcd 部署

下载地址： <https://github.com/etcd-io/etcd/releases/>

### 准备可执行文件

```bash
# https://github.com/etcd-io/etcd/releases/download/v3.5.12/etcd-v3.5.12-linux-amd64.tar.gz
tar -xf etcd*.tar.gz

Master='master1 master2 master3'

# 拷贝master组件
for NODE in $Master; do
    echo $NODE
    scp etcd-*/etcd* $NODE:/usr/local/bin/
done
```

### Etcd master1 配置

```bash
cat > /etc/etcd/etcd.config.yml << 'EOF'
name: 'master1'
data-dir: /var/lib/etcd
wal-dir: /var/lib/etcd/wal
snapshot-count: 5000
heartbeat-interval: 100
election-timeout: 1000
quota-backend-bytes: 0
listen-peer-urls: 'https://10.0.0.11:2380'
listen-client-urls: 'https://10.0.0.11:2379,http://127.0.0.1:2379'
max-snapshots: 3
max-wals: 5
cors:
initial-advertise-peer-urls: 'https://10.0.0.11:2380'
advertise-client-urls: 'https://10.0.0.11:2379'
discovery:
discovery-fallback: 'proxy'
discovery-proxy:
discovery-srv:
initial-cluster: 'master1=https://10.0.0.11:2380,master2=https://10.0.0.12:2380,master3=https://10.0.0.13:2380'
initial-cluster-token: 'etcd-k8s-cluster'
initial-cluster-state: 'new'
strict-reconfig-check: false
enable-v2: true
enable-pprof: true
proxy: 'off'
proxy-failure-wait: 5000
proxy-refresh-interval: 30000
proxy-dial-timeout: 1000
proxy-write-timeout: 5000
proxy-read-timeout: 0
client-transport-security:
  cert-file: '/etc/etcd/ssl/etcd.pem'
  key-file: '/etc/etcd/ssl/etcd-key.pem'
  client-cert-auth: true
  trusted-ca-file: '/etc/etcd/ssl/etcd-ca.pem'
  auto-tls: true
peer-transport-security:
  cert-file: '/etc/etcd/ssl/etcd.pem'
  key-file: '/etc/etcd/ssl/etcd-key.pem'
  peer-client-cert-auth: true
  trusted-ca-file: '/etc/etcd/ssl/etcd-ca.pem'
  auto-tls: true
debug: false
log-package-levels:
log-outputs: [default]
force-new-cluster: false
EOF
```

### Etcd master2 配置

```bash
cat > /etc/etcd/etcd.config.yml << 'EOF'
name: 'master2'
data-dir: /var/lib/etcd
wal-dir: /var/lib/etcd/wal
snapshot-count: 5000
heartbeat-interval: 100
election-timeout: 1000
quota-backend-bytes: 0
listen-peer-urls: 'https://10.0.0.12:2380'
listen-client-urls: 'https://10.0.0.12:2379,http://127.0.0.1:2379'
max-snapshots: 3
max-wals: 5
cors:
initial-advertise-peer-urls: 'https://10.0.0.12:2380'
advertise-client-urls: 'https://10.0.0.12:2379'
discovery:
discovery-fallback: 'proxy'
discovery-proxy:
discovery-srv:
initial-cluster: 'master1=https://10.0.0.11:2380,master2=https://10.0.0.12:2380,master3=https://10.0.0.13:2380'
initial-cluster-token: 'etcd-k8s-cluster'
initial-cluster-state: 'new'
strict-reconfig-check: false
enable-v2: true
enable-pprof: true
proxy: 'off'
proxy-failure-wait: 5000
proxy-refresh-interval: 30000
proxy-dial-timeout: 1000
proxy-write-timeout: 5000
proxy-read-timeout: 0
client-transport-security:
  cert-file: '/etc/etcd/ssl/etcd.pem'
  key-file: '/etc/etcd/ssl/etcd-key.pem'
  client-cert-auth: true
  trusted-ca-file: '/etc/etcd/ssl/etcd-ca.pem'
  auto-tls: true
peer-transport-security:
  cert-file: '/etc/etcd/ssl/etcd.pem'
  key-file: '/etc/etcd/ssl/etcd-key.pem'
  peer-client-cert-auth: true
  trusted-ca-file: '/etc/etcd/ssl/etcd-ca.pem'
  auto-tls: true
debug: false
log-package-levels:
log-outputs: [default]
force-new-cluster: false
EOF
```

### Etcd master3 配置

```bash
cat > /etc/etcd/etcd.config.yml << 'EOF'
name: 'master3'
data-dir: /var/lib/etcd
wal-dir: /var/lib/etcd/wal
snapshot-count: 5000
heartbeat-interval: 100
election-timeout: 1000
quota-backend-bytes: 0
listen-peer-urls: 'https://10.0.0.13:2380'
listen-client-urls: 'https://10.0.0.13:2379,http://127.0.0.1:2379'
max-snapshots: 3
max-wals: 5
cors:
initial-advertise-peer-urls: 'https://10.0.0.13:2380'
advertise-client-urls: 'https://10.0.0.13:2379'
discovery:
discovery-fallback: 'proxy'
discovery-proxy:
discovery-srv:
initial-cluster: 'master1=https://10.0.0.11:2380,master2=https://10.0.0.12:2380,master3=https://10.0.0.13:2380'
initial-cluster-token: 'etcd-k8s-cluster'
initial-cluster-state: 'new'
strict-reconfig-check: false
enable-v2: true
enable-pprof: true
proxy: 'off'
proxy-failure-wait: 5000
proxy-refresh-interval: 30000
proxy-dial-timeout: 1000
proxy-write-timeout: 5000
proxy-read-timeout: 0
client-transport-security:
  cert-file: '/etc/etcd/ssl/etcd.pem'
  key-file: '/etc/etcd/ssl/etcd-key.pem'
  client-cert-auth: true
  trusted-ca-file: '/etc/etcd/ssl/etcd-ca.pem'
  auto-tls: true
peer-transport-security:
  cert-file: '/etc/etcd/ssl/etcd.pem'
  key-file: '/etc/etcd/ssl/etcd-key.pem'
  peer-client-cert-auth: true
  trusted-ca-file: '/etc/etcd/ssl/etcd-ca.pem'
  auto-tls: true
debug: false
log-package-levels:
log-outputs: [default]
force-new-cluster: false
EOF
```

### 创建 Etcd 的 Systemd service

```bash
# 所有的master节点都需要执行
cat > /usr/lib/systemd/system/etcd.service << 'EOF'

[Unit]
Description=Etcd Service
Documentation=https://coreos.com/etcd/docs/latest/
After=network.target

[Service]
Type=notify
ExecStart=/usr/local/bin/etcd --config-file=/etc/etcd/etcd.config.yml
Restart=on-failure
RestartSec=10
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
Alias=etcd3.service

EOF

# 启动Etcd， etcd需要只要两个节点才能启动，尽量这几个节点一块启动。
systemctl daemon-reload
systemctl enable --now etcd
systemctl status etcd
journalctl -u etcd -f
```

### 查看 Etcd 状态

```bash
export ETCDCTL_API=3
etcdctl --endpoints="10.0.0.13:2379,10.0.0.12:2379,10.0.0.11:2379" --cacert=/etc/etcd/ssl/etcd-ca.pem --cert=/etc/etcd/ssl/etcd.pem --key=/etc/etcd/ssl/etcd-key.pem endpoint status --write-out=table
```

## master 节点组件安装

### 安装 Apiserver

#### master1 节点配置

```bash
cat > /usr/lib/systemd/system/kube-apiserver.service << 'EOF'

[Unit]
Description=Kubernetes API Server
Documentation=https://github.com/kubernetes/kubernetes
After=network.target

[Service]
ExecStart=/usr/local/bin/kube-apiserver \
      --v=2  \
      --allow-privileged=true  \
      --bind-address=10.0.0.11  \
      --secure-port=6443  \
      --advertise-address=10.0.0.11 \
      --service-cluster-ip-range=10.96.0.0/12 \
      --service-node-port-range=30000-32767  \
      --etcd-servers=https://10.0.0.11:2379,https://10.0.0.12:2379,https://10.0.0.13:2379 \
      --etcd-cafile=/etc/etcd/ssl/etcd-ca.pem  \
      --etcd-certfile=/etc/etcd/ssl/etcd.pem  \
      --etcd-keyfile=/etc/etcd/ssl/etcd-key.pem  \
      --client-ca-file=/etc/kubernetes/pki/ca.pem  \
      --tls-cert-file=/etc/kubernetes/pki/apiserver.pem  \
      --tls-private-key-file=/etc/kubernetes/pki/apiserver-key.pem  \
      --kubelet-client-certificate=/etc/kubernetes/pki/apiserver.pem  \
      --kubelet-client-key=/etc/kubernetes/pki/apiserver-key.pem  \
      --service-account-key-file=/etc/kubernetes/pki/sa.pub  \
      --service-account-signing-key-file=/etc/kubernetes/pki/sa.key  \
      --service-account-issuer=https://kubernetes.default.svc.cluster.local \
      --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname  \
      --enable-admission-plugins=NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,DefaultTolerationSeconds,NodeRestriction,ResourceQuota  \
      --authorization-mode=Node,RBAC  \
      --enable-bootstrap-token-auth=true  \
      --requestheader-client-ca-file=/etc/kubernetes/pki/front-proxy-ca.pem  \
      --proxy-client-cert-file=/etc/kubernetes/pki/front-proxy-client.pem  \
      --proxy-client-key-file=/etc/kubernetes/pki/front-proxy-client-key.pem  \
      --requestheader-allowed-names=aggregator  \
      --requestheader-group-headers=X-Remote-Group  \
      --requestheader-extra-headers-prefix=X-Remote-Extra-  \
      --requestheader-username-headers=X-Remote-User \
      --enable-aggregator-routing=true
Restart=on-failure
RestartSec=10s
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target

EOF
```

#### master2 节点配置

```bash
cat > /usr/lib/systemd/system/kube-apiserver.service << 'EOF'
[Unit]
Description=Kubernetes API Server
Documentation=https://github.com/kubernetes/kubernetes
After=network.target

[Service]
ExecStart=/usr/local/bin/kube-apiserver \
      --v=2  \
      --allow-privileged=true  \
      --bind-address=10.0.0.12  \
      --secure-port=6443  \
      --advertise-address=10.0.0.12 \
      --service-cluster-ip-range=10.96.0.0/12  \
      --service-node-port-range=30000-32767  \
      --etcd-servers=https://10.0.0.11:2379,https://10.0.0.12:2379,https://10.0.0.13:2379 \
      --etcd-cafile=/etc/etcd/ssl/etcd-ca.pem  \
      --etcd-certfile=/etc/etcd/ssl/etcd.pem  \
      --etcd-keyfile=/etc/etcd/ssl/etcd-key.pem  \
      --client-ca-file=/etc/kubernetes/pki/ca.pem  \
      --tls-cert-file=/etc/kubernetes/pki/apiserver.pem  \
      --tls-private-key-file=/etc/kubernetes/pki/apiserver-key.pem  \
      --kubelet-client-certificate=/etc/kubernetes/pki/apiserver.pem  \
      --kubelet-client-key=/etc/kubernetes/pki/apiserver-key.pem  \
      --service-account-key-file=/etc/kubernetes/pki/sa.pub  \
      --service-account-signing-key-file=/etc/kubernetes/pki/sa.key  \
      --service-account-issuer=https://kubernetes.default.svc.cluster.local \
      --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname  \
      --enable-admission-plugins=NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,DefaultTolerationSeconds,NodeRestriction,ResourceQuota  \
      --authorization-mode=Node,RBAC  \
      --enable-bootstrap-token-auth=true  \
      --requestheader-client-ca-file=/etc/kubernetes/pki/front-proxy-ca.pem  \
      --proxy-client-cert-file=/etc/kubernetes/pki/front-proxy-client.pem  \
      --proxy-client-key-file=/etc/kubernetes/pki/front-proxy-client-key.pem  \
      --requestheader-allowed-names=aggregator  \
      --requestheader-group-headers=X-Remote-Group  \
      --requestheader-extra-headers-prefix=X-Remote-Extra-  \
      --requestheader-username-headers=X-Remote-User \
      --enable-aggregator-routing=true

Restart=on-failure
RestartSec=10s
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target

EOF
```

#### master3 节点配置

```bash
cat > /usr/lib/systemd/system/kube-apiserver.service  << 'EOF'

[Unit]
Description=Kubernetes API Server
Documentation=https://github.com/kubernetes/kubernetes
After=network.target

[Service]
ExecStart=/usr/local/bin/kube-apiserver \
      --v=2  \
      --allow-privileged=true  \
      --bind-address=10.0.0.13  \
      --secure-port=6443  \
      --advertise-address=10.0.0.13 \
      --service-cluster-ip-range=10.96.0.0/12 \
      --service-node-port-range=30000-32767  \
      --etcd-servers=https://10.0.0.11:2379,https://10.0.0.12:2379,https://10.0.0.13:2379 \
      --etcd-cafile=/etc/etcd/ssl/etcd-ca.pem  \
      --etcd-certfile=/etc/etcd/ssl/etcd.pem  \
      --etcd-keyfile=/etc/etcd/ssl/etcd-key.pem  \
      --client-ca-file=/etc/kubernetes/pki/ca.pem  \
      --tls-cert-file=/etc/kubernetes/pki/apiserver.pem  \
      --tls-private-key-file=/etc/kubernetes/pki/apiserver-key.pem  \
      --kubelet-client-certificate=/etc/kubernetes/pki/apiserver.pem  \
      --kubelet-client-key=/etc/kubernetes/pki/apiserver-key.pem  \
      --service-account-key-file=/etc/kubernetes/pki/sa.pub  \
      --service-account-signing-key-file=/etc/kubernetes/pki/sa.key  \
      --service-account-issuer=https://kubernetes.default.svc.cluster.local \
      --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname  \
      --enable-admission-plugins=NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,DefaultTolerationSeconds,NodeRestriction,ResourceQuota  \
      --authorization-mode=Node,RBAC  \
      --enable-bootstrap-token-auth=true  \
      --requestheader-client-ca-file=/etc/kubernetes/pki/front-proxy-ca.pem  \
      --proxy-client-cert-file=/etc/kubernetes/pki/front-proxy-client.pem  \
      --proxy-client-key-file=/etc/kubernetes/pki/front-proxy-client-key.pem  \
      --requestheader-allowed-names=aggregator  \
      --requestheader-group-headers=X-Remote-Group  \
      --requestheader-extra-headers-prefix=X-Remote-Extra-  \
      --requestheader-username-headers=X-Remote-User \
      --enable-aggregator-routing=true

Restart=on-failure
RestartSec=10s
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target

EOF
```

#### 启动 apiserver（所有 master 节点）

```bash
systemctl daemon-reload
systemctl enable --now kube-apiserver.service
systemctl status kube-apiserver.service
journalctl -u kube-apiserver -f
```

### 配置 kube-controller-manager service

```bash
# 所有master节点配置，且配置相同
# 10.244.0.0/16为pod网段，按需求设置你自己的网段

cat > /usr/lib/systemd/system/kube-controller-manager.service << 'EOF'

[Unit]
Description=Kubernetes Controller Manager
Documentation=https://github.com/kubernetes/kubernetes
After=network.target

[Service]
ExecStart=/usr/local/bin/kube-controller-manager \
      --v=2 \
      --bind-address=0.0.0.0 \
      --root-ca-file=/etc/kubernetes/pki/ca.pem \
      --cluster-signing-cert-file=/etc/kubernetes/pki/ca.pem \
      --cluster-signing-key-file=/etc/kubernetes/pki/ca-key.pem \
      --service-account-private-key-file=/etc/kubernetes/pki/sa.key \
      --kubeconfig=/etc/kubernetes/controller-manager.kubeconfig \
      --leader-elect=true \
      --use-service-account-credentials=true \
      --node-monitor-grace-period=40s \
      --node-monitor-period=5s \
      --controllers=*,bootstrapsigner,tokencleaner \
      --allocate-node-cidrs=true \
      --service-cluster-ip-range=10.96.0.0/12 \
      --cluster-cidr=10.244.0.0/16 \
      --requestheader-client-ca-file=/etc/kubernetes/pki/front-proxy-ca.pem

Restart=always
RestartSec=10s

[Install]
WantedBy=multi-user.target

EOF
```

#### 启动 kube-controller-manager，并查看状态

```bash
systemctl daemon-reload
systemctl enable --now kube-controller-manager.service
systemctl status kube-controller-manager.service
journalctl -u kube-controller-manager.service -f
```

### 配置 kube-scheduler service

#### 所有 master 节点配置，且配置相同

```bash
cat > /usr/lib/systemd/system/kube-scheduler.service << 'EOF'

[Unit]
Description=Kubernetes Scheduler
Documentation=https://github.com/kubernetes/kubernetes
After=network.target

[Service]
ExecStart=/usr/local/bin/kube-scheduler \
      --v=2 \
      --bind-address=0.0.0.0 \
      --leader-elect=true \
      --kubeconfig=/etc/kubernetes/scheduler.kubeconfig

Restart=always
RestartSec=10s

[Install]
WantedBy=multi-user.target

EOF
```

#### 启动并查看服务状态

```bash
systemctl daemon-reload
systemctl enable --now kube-scheduler.service
systemctl status kube-scheduler.service
journalctl -u kube-scheduler -f
```

### TLS Bootstrapping 配置

#### 在 master1 上配置

```bash
# name token-id token-secret 如要修改一块修改
cat > bootstrap.secret.yaml << 'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: bootstrap-token-g1yhn5
  namespace: kube-system
type: bootstrap.kubernetes.io/token
stringData:
  description: "The default bootstrap token generated by 'kubelet '."
  token-id: g1yhn5
  token-secret: vqvd8tenyvtjn7lq
  usage-bootstrap-authentication: "true"
  usage-bootstrap-signing: "true"
  auth-extra-groups:  system:bootstrappers:default-node-token,system:bootstrappers:worker,system:bootstrappers:ingress
 
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: kubelet-bootstrap
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:node-bootstrapper
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: system:bootstrappers:default-node-token
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: node-autoapprove-bootstrap
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:certificates.k8s.io:certificatesigningrequests:nodeclient
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: system:bootstrappers:default-node-token
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: node-autoapprove-certificate-rotation
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:certificates.k8s.io:certificatesigningrequests:selfnodeclient
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: system:nodes
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  annotations:
    rbac.authorization.kubernetes.io/autoupdate: "true"
  labels:
    kubernetes.io/bootstrapping: rbac-defaults
  name: system:kube-apiserver-to-kubelet
rules:
  - apiGroups:
      - ""
    resources:
      - nodes/proxy
      - nodes/stats
      - nodes/log
      - nodes/spec
      - nodes/metrics
    verbs:
      - "*"
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: system:kube-apiserver
  namespace: ""
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:kube-apiserver-to-kubelet
subjects:
  - apiGroup: rbac.authorization.k8s.io
    kind: User
    name: kube-apiserver
EOF

kubectl config set-cluster kubernetes     \
    --certificate-authority=/etc/kubernetes/pki/ca.pem     \
    --embed-certs=true     --server=https://127.0.0.1:6443     \
    --kubeconfig=bootstrap-kubelet.kubeconfig

# 和上面的token保持一致
kubectl config set-credentials tls-bootstrap-token-user     \
    --token=g1yhn5.vqvd8tenyvtjn7lq \
    --kubeconfig=bootstrap-kubelet.kubeconfig

kubectl config set-context tls-bootstrap-token-user@kubernetes     \
    --cluster=kubernetes     \
    --user=tls-bootstrap-token-user     \
    --kubeconfig=bootstrap-kubelet.kubeconfig


kubectl config use-context tls-bootstrap-token-user@kubernetes     \
    --kubeconfig=bootstrap-kubelet.kubeconfig

kubectl create -f bootstrap.secret.yaml

# bootstrap-kubelet.kubeconfig 文件分发到其他所有节点，包括master和worker
scp bootstrap-kubelet.kubeconfig master1:/etc/kubernetes/
scp bootstrap-kubelet.kubeconfig master2:/etc/kubernetes/
scp bootstrap-kubelet.kubeconfig master3:/etc/kubernetes/
```

#### 查看集群状态

```bash

kubectl get cs
Warning: v1 ComponentStatus is deprecated in v1.19+
NAME                 STATUS    MESSAGE   ERROR
scheduler            Healthy   ok        
controller-manager   Healthy   ok        
etcd-0               Healthy   ok 

```

## worker 节点配置（新增 worker 节点）

master 节点上也可以部署 `kubelet` 和 `kube-proxy` ，如果 `master` 节点仅做管理，不进行调度与访问，可以不安装 `kubelet` 和 `kube-proxy`, 不安装 `kubelet`，那么 `kubectl get node` 不显示。

### 在 master1 上将证书复制到 node 节点

```bash
cd ~/kubernetes/

for NODE in worker1 worker2; do
    ssh $NODE mkdir -p /etc/kubernetes/pki
    scp ssl/ca.pem $NODE:/etc/kubernetes/pki/
    scp bootstrap-kubelet.kubeconfig kube-proxy.kubeconfig $NODE:/etc/kubernetes/
done
```

### kubelet 配置

```bash
mkdir -p /var/lib/kubelet /var/log/kubernetes /etc/systemd/system/kubelet.service.d /etc/kubernetes/manifests/

# 所有k8s节点配置kubelet service
cat > /usr/lib/systemd/system/kubelet.service << 'EOF'

[Unit]
Description=Kubernetes Kubelet
Documentation=https://github.com/kubernetes/kubernetes
After=network-online.target firewalld.service containerd.service
Wants=network-online.target
Requires=containerd.service

[Service]
ExecStart=/usr/local/bin/kubelet \
    --bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.kubeconfig  \
    --kubeconfig=/etc/kubernetes/kubelet.kubeconfig \
    --config=/etc/kubernetes/kubelet-conf.yml \
    --container-runtime-endpoint=unix:///run/containerd/containerd.sock  \
    --node-labels=node.kubernetes.io/node=

[Install]
WantedBy=multi-user.target
EOF
```

```bash
# 所有k8s节点创建kubelet的配置文件
cat > /etc/kubernetes/kubelet-conf.yml <<'EOF'
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
address: 0.0.0.0
port: 10250
readOnlyPort: 10255
authentication:
  anonymous:
    enabled: false
  webhook:
    cacheTTL: 2m0s
    enabled: true
  x509:
    clientCAFile: /etc/kubernetes/pki/ca.pem
authorization:
  mode: Webhook
  webhook:
    cacheAuthorizedTTL: 5m0s
    cacheUnauthorizedTTL: 30s
cgroupDriver: systemd
cgroupsPerQOS: true
clusterDNS:
- 10.96.0.10
clusterDomain: cluster.local
containerLogMaxFiles: 5
containerLogMaxSize: 10Mi
contentType: application/vnd.kubernetes.protobuf
cpuCFSQuota: true
cpuManagerPolicy: none
cpuManagerReconcilePeriod: 10s
enableControllerAttachDetach: true
enableDebuggingHandlers: true
enforceNodeAllocatable:
- pods
eventBurst: 10
eventRecordQPS: 5
evictionHard:
  imagefs.available: 15%
  memory.available: 100Mi
  nodefs.available: 10%
  nodefs.inodesFree: 5%
evictionPressureTransitionPeriod: 5m0s
failSwapOn: true
fileCheckFrequency: 20s
hairpinMode: promiscuous-bridge
healthzBindAddress: 127.0.0.1
healthzPort: 10248
httpCheckFrequency: 20s
imageGCHighThresholdPercent: 85
imageGCLowThresholdPercent: 80
imageMinimumGCAge: 2m0s
iptablesDropBit: 15
iptablesMasqueradeBit: 14
kubeAPIBurst: 10
kubeAPIQPS: 5
makeIPTablesUtilChains: true
maxOpenFiles: 1000000
maxPods: 110
nodeStatusUpdateFrequency: 10s
oomScoreAdj: -999
podPidsLimit: -1
registryBurst: 10
registryPullQPS: 5
resolvConf: /etc/resolv.conf
rotateCertificates: true
runtimeRequestTimeout: 2m0s
serializeImagePulls: true
staticPodPath: /etc/kubernetes/manifests
streamingConnectionIdleTimeout: 4h0m0s
syncFrequency: 1m0s
volumeStatsAggPeriod: 1m0s
EOF

```

```bash
# 启动kubelet
systemctl daemon-reload
systemctl enable --now kubelet.service
systemctl status kubelet.service
journalctl -u kubelet -f
```

```bash
# 查看集群
[root@master1 ~]# kubectl  get node
NAME           STATUS   ROLES    AGE   VERSION
master1   Ready    <none>   16s   v1.29.2
master2   Ready    <none>   13s   v1.29.2
master3   Ready    <none>   12s   v1.29.2
worker1   Ready    <none>   10s   v1.29.2
worker2   Ready    <none>   9s    v1.29.2

[root@master1 ~]# kubectl describe node | grep Runtime
  Container Runtime Version:  containerd://1.7.13
  Container Runtime Version:  containerd://1.7.13
  Container Runtime Version:  containerd://1.7.13
  Container Runtime Version:  containerd://1.7.13
  Container Runtime Version:  containerd://1.7.13
```

### kube-proxy 配置

```bash
# 所有节点执行
cat >  /usr/lib/systemd/system/kube-proxy.service << 'EOF'
[Unit]
Description=Kubernetes Kube Proxy
Documentation=https://github.com/kubernetes/kubernetes
After=network.target

[Service]
ExecStart=/usr/local/bin/kube-proxy \
  --config=/etc/kubernetes/kube-proxy.yaml \
  --v=2
Restart=always
RestartSec=10s

[Install]
WantedBy=multi-user.target

EOF

```

```bash
# 所有k8s节点添加kube-proxy的配置
cat > /etc/kubernetes/kube-proxy.yaml << EOF
apiVersion: kubeproxy.config.k8s.io/v1alpha1
bindAddress: 0.0.0.0
clientConnection:
  acceptContentTypes: ""
  burst: 10
  contentType: application/vnd.kubernetes.protobuf
  kubeconfig: /etc/kubernetes/kube-proxy.kubeconfig
  qps: 5
clusterCIDR: 10.244.0.0/16
configSyncPeriod: 15m0s
conntrack:
  max: null
  maxPerCore: 32768
  min: 131072
  tcpCloseWaitTimeout: 1h0m0s
  tcpEstablishedTimeout: 24h0m0s
enableProfiling: false
healthzBindAddress: 0.0.0.0:10256
hostnameOverride: ""
iptables:
  masqueradeAll: false
  masqueradeBit: 14
  minSyncPeriod: 0s
  syncPeriod: 30s
ipvs:
  masqueradeAll: true
  minSyncPeriod: 5s
  scheduler: "rr"
  syncPeriod: 30s
kind: KubeProxyConfiguration
metricsBindAddress: 127.0.0.1:10249
mode: "ipvs"
nodePortAddresses: null
oomScoreAdj: -999
portRange: ""
udpIdleTimeout: 250ms
EOF

```

```bash
# 启动kube-proxy
systemctl enable --now kube-proxy.service
systemctl status kube-proxy.service
journalctl -u kube-proxy -f
```

## 新增 master 节点

未完待续

### 新增 Etcd 节点

略

### 新增 kube-apiserver 和 kube-scheduler 和 kube-controller-manager

略

## 安装网络插件

### 部署 flannel 网络插件

```bash
# wget https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
# net-conf.json:  这里需要修改为Pod网段

cat > kube-flannel.yml << 'EOF'
---
kind: Namespace
apiVersion: v1
metadata:
  name: kube-flannel
  labels:
    k8s-app: flannel
    pod-security.kubernetes.io/enforce: privileged
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  labels:
    k8s-app: flannel
  name: flannel
rules:
- apiGroups:
  - ""
  resources:
  - pods
  verbs:
  - get
- apiGroups:
  - ""
  resources:
  - nodes
  verbs:
  - get
  - list
  - watch
- apiGroups:
  - ""
  resources:
  - nodes/status
  verbs:
  - patch
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  labels:
    k8s-app: flannel
  name: flannel
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: flannel
subjects:
- kind: ServiceAccount
  name: flannel
  namespace: kube-flannel
---
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    k8s-app: flannel
  name: flannel
  namespace: kube-flannel
---
kind: ConfigMap
apiVersion: v1
metadata:
  name: kube-flannel-cfg
  namespace: kube-flannel
  labels:
    tier: node
    k8s-app: flannel
    app: flannel
data:
  cni-conf.json: |
    {
      "name": "cbr0",
      "cniVersion": "0.3.1",
      "plugins": [
        {
          "type": "flannel",
          "delegate": {
            "hairpinMode": true,
            "isDefaultGateway": true
          }
        },
        {
          "type": "portmap",
          "capabilities": {
            "portMappings": true
          }
        }
      ]
    }
  net-conf.json: |
    {
      "Network": "10.244.0.0/16",
      "EnableNFTables": false,
      "Backend": {
        "Type": "vxlan"
      }
    }
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: kube-flannel-ds
  namespace: kube-flannel
  labels:
    tier: node
    app: flannel
    k8s-app: flannel
spec:
  selector:
    matchLabels:
      app: flannel
  template:
    metadata:
      labels:
        tier: node
        app: flannel
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: kubernetes.io/os
                operator: In
                values:
                - linux
      hostNetwork: true
      priorityClassName: system-node-critical
      tolerations:
      - operator: Exists
        effect: NoSchedule
      serviceAccountName: flannel
      initContainers:
      - name: install-cni-plugin
        image: registry.cn-hangzhou.aliyuncs.com/iuxt/flannel-cni-plugin:v1.4.1-flannel1
        command:
        - cp
        args:
        - -f
        - /flannel
        - /opt/cni/bin/flannel
        volumeMounts:
        - name: cni-plugin
          mountPath: /opt/cni/bin
      - name: install-cni
        image: registry.cn-hangzhou.aliyuncs.com/iuxt/flannel:v0.25.2
        command:
        - cp
        args:
        - -f
        - /etc/kube-flannel/cni-conf.json
        - /etc/cni/net.d/10-flannel.conflist
        volumeMounts:
        - name: cni
          mountPath: /etc/cni/net.d
        - name: flannel-cfg
          mountPath: /etc/kube-flannel/
      containers:
      - name: kube-flannel
        image: registry.cn-hangzhou.aliyuncs.com/iuxt/flannel:v0.25.2
        command:
        - /opt/bin/flanneld
        args:
        - --ip-masq
        - --kube-subnet-mgr
        resources:
          requests:
            cpu: "100m"
            memory: "50Mi"
        securityContext:
          privileged: false
          capabilities:
            add: ["NET_ADMIN", "NET_RAW"]
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: EVENT_QUEUE_DEPTH
          value: "5000"
        volumeMounts:
        - name: run
          mountPath: /run/flannel
        - name: flannel-cfg
          mountPath: /etc/kube-flannel/
        - name: xtables-lock
          mountPath: /run/xtables.lock
      volumes:
      - name: run
        hostPath:
          path: /run/flannel
      - name: cni-plugin
        hostPath:
          path: /opt/cni/bin
      - name: cni
        hostPath:
          path: /etc/cni/net.d
      - name: flannel-cfg
        configMap:
          name: kube-flannel-cfg
      - name: xtables-lock
        hostPath:
          path: /run/xtables.lock
          type: FileOrCreate
EOF


# 创建flannel插件
kubectl apply -f kube-flannel.yml
```

## 附加组件部署

### 部署 coreDNS

```bash
cat > coredns.yaml <<'EOF'
apiVersion: v1
kind: ServiceAccount
metadata:
  name: coredns
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  labels:
    kubernetes.io/bootstrapping: rbac-defaults
  name: system:coredns
rules:
  - apiGroups:
    - ""
    resources:
    - endpoints
    - services
    - pods
    - namespaces
    verbs:
    - list
    - watch
  - apiGroups:
    - discovery.k8s.io
    resources:
    - endpointslices
    verbs:
    - list
    - watch
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  annotations:
    rbac.authorization.kubernetes.io/autoupdate: "true"
  labels:
    kubernetes.io/bootstrapping: rbac-defaults
  name: system:coredns
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:coredns
subjects:
- kind: ServiceAccount
  name: coredns
  namespace: kube-system
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: coredns
  namespace: kube-system
data:
  Corefile: |
    .:53 {
        errors
        health {
          lameduck 5s
        }
        ready
        kubernetes cluster.local in-addr.arpa ip6.arpa {
          fallthrough in-addr.arpa ip6.arpa
        }
        prometheus :9153
        forward . /etc/resolv.conf {
          max_concurrent 1000
        }
        cache 30
        loop
        reload
        loadbalance
    }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: coredns
  namespace: kube-system
  labels:
    k8s-app: kube-dns
    kubernetes.io/name: "CoreDNS"
    app.kubernetes.io/name: coredns
spec:
  # replicas: not specified here:
  # 1. Default is 1.
  # 2. Will be tuned in real time if DNS horizontal auto-scaling is turned on.
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
  selector:
    matchLabels:
      k8s-app: kube-dns
      app.kubernetes.io/name: coredns
  template:
    metadata:
      labels:
        k8s-app: kube-dns
        app.kubernetes.io/name: coredns
    spec:
      priorityClassName: system-cluster-critical
      serviceAccountName: coredns
      tolerations:
        - key: "CriticalAddonsOnly"
          operator: "Exists"
      nodeSelector:
        kubernetes.io/os: linux
      affinity:
         podAntiAffinity:
           requiredDuringSchedulingIgnoredDuringExecution:
           - labelSelector:
               matchExpressions:
               - key: k8s-app
                 operator: In
                 values: ["kube-dns"]
             topologyKey: kubernetes.io/hostname
      containers:
      - name: coredns
        image: registry.cn-hangzhou.aliyuncs.com/iuxt/coredns:1.9.4
        imagePullPolicy: IfNotPresent
        resources:
          limits:
            memory: 170Mi
          requests:
            cpu: 100m
            memory: 70Mi
        args: [ "-conf", "/etc/coredns/Corefile" ]
        volumeMounts:
        - name: config-volume
          mountPath: /etc/coredns
          readOnly: true
        ports:
        - containerPort: 53
          name: dns
          protocol: UDP
        - containerPort: 53
          name: dns-tcp
          protocol: TCP
        - containerPort: 9153
          name: metrics
          protocol: TCP
        securityContext:
          allowPrivilegeEscalation: false
          capabilities:
            add:
            - NET_BIND_SERVICE
            drop:
            - all
          readOnlyRootFilesystem: true
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
            scheme: HTTP
          initialDelaySeconds: 60
          timeoutSeconds: 5
          successThreshold: 1
          failureThreshold: 5
        readinessProbe:
          httpGet:
            path: /ready
            port: 8181
            scheme: HTTP
      dnsPolicy: Default
      volumes:
        - name: config-volume
          configMap:
            name: coredns
            items:
            - key: Corefile
              path: Corefile
---
apiVersion: v1
kind: Service
metadata:
  name: kube-dns
  namespace: kube-system
  annotations:
    prometheus.io/port: "9153"
    prometheus.io/scrape: "true"
  labels:
    k8s-app: kube-dns
    kubernetes.io/cluster-service: "true"
    kubernetes.io/name: "CoreDNS"
    app.kubernetes.io/name: coredns
spec:
  selector:
    k8s-app: kube-dns
    app.kubernetes.io/name: coredns
  clusterIP: 10.96.0.10
  ports:
  - name: dns
    port: 53
    protocol: UDP
  - name: dns-tcp
    port: 53
    protocol: TCP
  - name: metrics
    port: 9153
    protocol: TCP
EOF
```

```bash
kubectl create -f coredns.yaml
```

### 查看状态

```bash
kubectl get po -n kube-system -l k8s-app=kube-dns
```

### 验证 CoreDNS

```bash
dig @10.96.0.10 kubernetes.default.svc.cluster.local +short
```

## 常见问题

[kubeadm 部署的集群 常见问题汇总](/posts/sepu3k/)

### Ubuntu 里面无法启动 CoreDNS

<https://kubernetes.io/zh-cn/docs/tasks/administer-cluster/dns-debugging-resolution/#known-issues>

有些 Linux 发行版本（比如 Ubuntu）默认使用一个本地的 DNS 解析器（systemd-resolved）。 systemd-resolved 会用一个存根文件（Stub File）来覆盖 /etc/resolv.conf 内容， 从而可能在上游服务器中解析域名产生转发环（forwarding loop）。 这个问题可以通过手动指定 kubelet 的 --resolv-conf 标志为正确的 resolv.conf（如果是 systemd-resolved， 则这个文件路径为 /run/systemd/resolve/resolv.conf）来解决。 kubeadm 会自动检测 systemd-resolved 并对应的更改 kubelet 的命令行标志。

Kubernetes 的安装并不会默认配置节点的 resolv.conf 文件来使用集群的 DNS 服务，因为这个配置对于不同的发行版本是不一样的。这个问题应该迟早会被解决的。

Linux 的 libc（又名 glibc）默认将 DNS nameserver 记录限制为 3， 而 Kubernetes 需要使用 1 条 nameserver 记录。 这意味着如果本地的安装已经使用了 3 个 nameserver，那么其中有些条目将会丢失。 要解决此限制，节点可以运行 dnsmasq，以提供更多 nameserver 条目。 你也可以使用 kubelet 的 --resolv-conf 标志来解决这个问题。

如果你使用 Alpine 3.17 或更早版本作为你的基础镜像，DNS 可能会由于 Alpine 的设计问题而无法工作。 在 musl 1.24 版本之前，DNS 存根解析器都没有包括 TCP 回退， 这意味着任何超过 512 字节的 DNS 调用都会失败。请将你的镜像升级到 Alpine 3.18 或更高版本。
