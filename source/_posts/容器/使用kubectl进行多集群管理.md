---
title: 使用kubectl进行多集群管理
categories:
  - 容器
tags:
  - kubectl
  - Kubernetes
  - 权限管理
  - 配置记录
abbrlink: lqacdmqv
cover: 'https://s3.babudiu.com/iuxt/public/kubernetes.svg'
date: 2023-12-18 11:13:59
---

平常使用跳板机来管理, 经常多个环境多套集群, 那么如何用一个 kubectl 如何管理这些集群.

## 推荐方式

这种方式对系统的侵入性比较小，也不用修改 kubeconfig 文件，也不用在 linux 中增加用户等。。

准备不同的 kubeconfig 文件，比如 `prod` `uat`

### 脚本一

```bash
export KUBECONFIG=./prod 
bash
```

这里 export 是必须的，export 的作用是将环境变量传递到子进程中，而 bash 是这个脚本的子进程。

### 脚本二

```bash
KUBECONFIG=./prod
```

执行的时候通过 `. a.sh` 或 `source a.sh` 的时候，source 或 . 的作用是将环境变量传递到当前 shell 中。

## 使用不同的 kubeconfig 管理

### 使用不同的 Linux 用户

每个 Linux 用户的 `~/.kube/config` 配置不同即可, 比如创建一个 uat 用户,一个 prod 用户, 分别配置不同的 config 文件

### 使用环境变量

设置一个 `KUBECONFIG` 指定到 kubeconfig 文件

```bash
KUBECONFIG=config-uat kubectl get pod
```

### 使用参数

同使用环境变量

```bash
kubectl get pod --kubeconfig=config-uat
```

## 使用一个 kubeconfig

我觉得这种方法很繁琐且复杂，并且还会修改 kubeconfig。

### 准备

确保每个 kubeconfig 里面部分参数唯一性,可以手动修改一下

![image.png](https://s3.babudiu.com/iuxt/images/202312181126408.png)

### 合并配置文件

假设一个配置文件名为: uat, 另一个为: prod

```bash
KUBECONFIG=uat:prod kubectl config view --flatten > merged-kubeconfig
```

### 验证合并结果

完成合并后，可以使用以下命令验证新的 kubeconfig 文件是否包含了所有的集群、用户和上下文定义, 如果上面没有保证唯一性, 那么合并后的配置就是不完整的.

```bash
kubectl config view --kubeconfig=merged-kubeconfig
```

### 使用配置文件

除了指定配置文件外 (如果配置文件放到~/.kube/config 内,不需要加 --kubeconfig 参数)

```bash
# 切换到uat集群, 配置会保存到配置文件(下次默认就是uat集群了)
kubectl config use-context uat --kubeconfig=merged-kubeconfig

# 切换到prod集群
kubectl config use-context prod --kubeconfig=merged-kubeconfig
```
