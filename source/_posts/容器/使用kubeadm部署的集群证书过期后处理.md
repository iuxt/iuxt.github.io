---
title: 使用kubeadm部署的集群证书过期后处理
categories:
  - 容器
tags:
  - Kubernetes
  - kubeadm
  - 记录
abbrlink: ltckjzor
cover: 'https://static.zahui.fan/public/Kubeadm.svg'
date: 2024-03-04 14:37:32
---

之前使用 `kubeadm` 部署的集群，突然有一天执行 `kubectl get pod` 提示：

```bash
Unable to connect to the server: x509: certificate has expired or is not yet valid: current time 2024-03-04T14:26:31+08:00 is after 2024-02-27T08:36:50Z
```

意思是证书有效期到 2024-02-27T08:36:50Z， 已经超过了证书有效期了。

## 查看证书有效期

```bash
[root@ALSHBSITL00061 kubernetes]# kubeadm certs check-expiration
[check-expiration] Reading configuration from the cluster...
[check-expiration] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -o yaml'
[check-expiration] Error reading configuration from the Cluster. Falling back to default configuration

CERTIFICATE                EXPIRES                  RESIDUAL TIME   CERTIFICATE AUTHORITY   EXTERNALLY MANAGED
admin.conf                 Feb 27, 2024 08:36 UTC   <invalid>       ca                      no
apiserver                  Feb 27, 2024 08:36 UTC   <invalid>       ca                      no
apiserver-etcd-client      Feb 27, 2024 08:36 UTC   <invalid>       etcd-ca                 no
apiserver-kubelet-client   Feb 27, 2024 08:36 UTC   <invalid>       ca                      no
controller-manager.conf    Feb 27, 2024 08:36 UTC   <invalid>       ca                      no
etcd-healthcheck-client    Feb 27, 2024 08:36 UTC   <invalid>       etcd-ca                 no
etcd-peer                  Feb 27, 2024 08:36 UTC   <invalid>       etcd-ca                 no
etcd-server                Feb 27, 2024 08:36 UTC   <invalid>       etcd-ca                 no
front-proxy-client         Feb 27, 2024 08:36 UTC   <invalid>       front-proxy-ca          no
scheduler.conf             Feb 27, 2024 08:36 UTC   <invalid>       ca                      no

CERTIFICATE AUTHORITY   EXPIRES                  RESIDUAL TIME   EXTERNALLY MANAGED
ca                      Feb 24, 2033 08:36 UTC   8y              no
etcd-ca                 Feb 24, 2033 08:36 UTC   8y              no
front-proxy-ca          Feb 24, 2033 08:36 UTC   8y              no
```

## 执行续期操作

```bash
[root@ALSHBSITL00061 kubernetes]# kubeadm certs renew all
[renew] Reading configuration from the cluster...
[renew] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -o yaml'
[renew] Error reading configuration from the Cluster. Falling back to default configuration

certificate embedded in the kubeconfig file for the admin to use and for kubeadm itself renewed
certificate for serving the Kubernetes API renewed
certificate the apiserver uses to access etcd renewed
certificate for the API server to connect to kubelet renewed
certificate embedded in the kubeconfig file for the controller manager to use renewed
certificate for liveness probes to healthcheck etcd renewed
certificate for etcd nodes to communicate with each other renewed
certificate for serving etcd renewed
certificate for the front proxy client renewed
certificate embedded in the kubeconfig file for the scheduler manager to use renewed

Done renewing certificates. You must restart the kube-apiserver, kube-controller-manager, kube-scheduler and etcd, so that they can use the new certificates.
```

## 更新 kubectl 配置

如果当时安装的时候是通过 `cp /etc/kubernetes/admin.conf ~/.kube/config` 复制的配置，需要再更新一遍，管理员也可以指定使用 `/etc/kubernetes/admin.conf` 作为 kubeconfig，就不用每次更新了。

## 重启服务

需要重启 kube-apiserver, kube-controller-manager, kube-scheduler 和 etcd， kubeadm 安装的 kubelet 会自动更新证书，所以不用重启。

{% tabs TabName %}

<!-- tab 容器运行时是containerd -->

```bash
crictl pods --namespace kube-system --name 'kube-scheduler-*|kube-controller-manager-*|kube-apiserver-*|etcd-*' -q | xargs crictl rmp -f
```

<!-- endtab -->

<!-- tab 容器运行时是docker -->

```bash
docker ps
docker restart xxx 
```

<!-- endtab -->

{% endtabs %}

