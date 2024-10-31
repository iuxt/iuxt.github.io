---
title: Java程序被停止前自动dump内存快照
categories:
  - 容器
tags:
  - Kubernetes
  - k8s
  - java
abbrlink: sh7n7f
cover: 'https://static.zahui.fan/images/202407261107971.png'
date: 2024-07-26 11:04:26
---

线上业务偶尔会出现重启现象，为了排查这个问题，决定在 OOM 的时候自动进行 dump 内存快照用于分析

![image.png](https://static.zahui.fan/images/202407261022514.png)

## 针对 JVM OOM 的情况

OOM 全称 “Out Of Memory”，表示内存耗尽。当 JVM 因为没有足够的内存来为对象分配空间，并且垃圾回收器也已经没有空间可回收时，就会抛出这个错误，解决 OOM 问题的一个思路:

假设发生 OOM 了，必然说明系统中某个区域的对象太多了，塞满了那个区域，而且一定是无法回收掉那些对象，最终才会导致内存溢出的，首先就得知道到底是什么对象太多了导致 OOM ，就必须得有一份 JVM 发生 OOM 时的 dump 内存快照
有了 dump 内存快照，就可以用 MAT 之类的工具，或者在线工具来分析：<https://memory.console.heapdump.cn/>
JVM 在发生 OOM 的时候并不是直接挂掉的， 而是在 OOM 之前会尽量去 GC 腾出来一些内存空间，如果 GC 后还是没有空间，放不下对象， 才会触发内存溢出的。JVM 给我们提供了一些参数可以在发生 OOM 的时候进行自动 dump 内存快照。： `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/logs/heapdump.hprof` /logs 目录也通过 hostpath 持久化到对应的主机节点上了，不过这样有两个问题：
1. 多次重启会发生覆盖，比如程序 OOM 了 2 次，那么第一次的 heapdump 会被第二次覆盖。
2. 此参数只能针对 jvm 发生的 OOM，k8s 主动重启服务的情况没法导出 heapdump。

对于此次线上重启问题，通过 `kubectl describe pod` 看到的原因就是由于健康检查不响应了，k8s 自动将服务重启，这种情况不属于 jvm 的 OOM，那么通过上面的 jvm 参数来导出不靠谱。

## 针对其他情况的重启

本次线上重启问题是 k8s 干的，那么我们从 k8s 的角度来处理这个问题，参考官方文档 [为容器的生命周期事件设置处理函数](https://kubernetes.io/zh-cn/docs/tasks/configure-pod-container/attach-handler-lifecycle-event/) 可以通过配置 preStop 钩子来实现停止前将内存快照 dump 下来。用到的命令如下：

```bash
# 获取 pid为10的程序 进程堆栈信息
jstack -F 10 >> /logs/thread.dump

# 生成堆内存转储快照
jmap -dump:format=b,file=/logs/dump.hprof 10
```

配置在 kubernetes 中的 preStop 钩子中：

```yaml
        name: test-java
        image: harbor.example.com/base/example:v1
        imagePullPolicy: IfNotPresent
        lifecycle:
          preStop:
            exec:
              command: ["sh", "-c", "jstack -F $(jps |grep -v Jps | awk '{print $1}') | tee -a /logs/thread.dump && jmap -dump:format=b,file=/logs/$(date +'%Y-%m-%d_%H%M%S').hprof $(jps |grep -v Jps | awk '{print $1}')"]
        readinessProbe:
          failureThreshold: 2
          httpGet:
            path: /actuator/info
            port: 5003
            scheme: HTTP
          initialDelaySeconds: 30
          periodSeconds: 15
          successThreshold: 1
          timeoutSeconds: 2
        volumeMounts:
        - mountPath: /logs
          name: app-logs
      volumes:
      - hostPath:
          path: /logs
          type: DirectoryOrCreate
        name: app-logs
```

由于在 command 中配置 `>>` 不生效， 所以换成了 `tee` 命令， 并把导出的 hprof 文件按照时间命名防止被覆盖。其中 `/logs` 目录通过 `hostpath` 持久化了。
手动执行 `kubectl delete pod xxxx`，可以查看到生成的文件了

![image.png](https://static.zahui.fan/images/202407261103592.png)
