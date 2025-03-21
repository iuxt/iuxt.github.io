---
title: java容器entrypoint.sh参数传递的隐藏陷阱
categories:
  - 容器
tags: [Docker, java, Shell]
abbrlink: stgvyr
date: 2025-03-21 17:35:15
cover: https://static.zahui.fan/images/20250321173954454.png
updated: 2025-03-21 17:40:04
---

构建容器镜像对运维来说已经轻车熟路了，但是最近遇到个问题百思不得其解，准确的说就是手动执行 java -jar 带上所有参数，可以正常启动，但是打包成镜像就会报错：

先附上 `entrypoint.sh`

```bash
#!/bin/bash

if [ -n "$JVM_PARAM" ];
then
  echo "JVM_PARAM: $JVM_PARAM"
else
  JVM_PARAM="-Xms2g -Xmx2g -XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m"
fi

if [ -n "$JVM_OPTS" ];
then
  echo "JVM_OPTS: $JVM_OPTS"
else
  JVM_OPTS="-XX:+UseConcMarkSweepGC -XX:+UseCMSInitiatingOccupancyOnly -XX:CMSInitiatingOccupancyFraction=70 -XX:+ExplicitGCInvokesConcurrentAndUnloadsClasses -XX:+CMSClassUnloadingEnabled -XX:+ParallelRefProcEnabled -XX:+CMSScavengeBeforeRemark -XX:ErrorFile=/logs/hs_err_pid%p.log -Xloggc:/logs/gc.log -XX:HeapDumpPath=/logs -XX:+PrintGCDetails -XX:+PrintGCDateStamps -XX:+HeapDumpOnOutOfMemoryError -XX:+PrintCommandLineFlags"
fi

JAVA_CMD="$JVM_PARAM $JVM_OPTS"

AGENT_OPTS="-javaagent:/hawkeye-agent/hawkeye-agent.jar=APPNAME?AGENT_UID=x-ingeek-userid"

if [ "true" == "$AGENT_ENABLED" ];then
    echo "JAVA_CMD: $JAVA_CMD $AGENT_OPTS"
    java "$JAVA_CMD" "$AGENT_OPTS" -jar /app/app.jar
else
    echo "JAVA_CMD: $JAVA_CMD"
    java "$JAVA_CMD" -jar /app/app.jar
fi
```

Dockerfile:

```dockerfile
FROM java:xxx
ADD app.jar /app.jar
ADD entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```

看起来很正常对吧，但是启动报错：

```bash
Invalid initial heap size: -Xms2g -Xmx2g -XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m -XX:+UseConcMarkSweepGC -XX:+UseCMSInitiatingOccupancyOnly -XX:CMSInitiatingOccupancyFraction=70 -XX:+ExplicitGCInvokesConcurrentAndUnloadsClasses -XX:+CMSClassUnloadingEnabled -XX:+ParallelRefProcEnabled -XX:+CMSScavengeBeforeRemark -XX:ErrorFile=/logs/hs_err_pid%p.log -Xloggc:/logs/gc.log -XX:HeapDumpPath=/logs -XX:+PrintGCDetails -XX:+PrintGCDateStamps -XX:+HeapDumpOnOutOfMemoryError -XX:+PrintCommandLineFlags
Error: Could not create the Java Virtual Machine.
Error: A fatal exception has occurred. Program will exit.
```

查看控制台，echo 出来的 `JAVA_CMD` 变量也是正常的
![image.png](https://static.zahui.fan/images/20250321172510730.png)

中间排查过程忽略，最后增加了 `set -x` 参数后，重新打包镜像，再次查看控制台输出：

![image.png](https://static.zahui.fan/images/20250321171117808.png)

注意以 + 开头的输出 这里 java 启动命令是被解析成了单引号引用，所以造成无法启动。把 java 启动参数中的环境变量双引号去掉，可以正常启动了。

```bash
#!/bin/bash
set -x

if [ -n "$JVM_PARAM" ];
then
  echo "JVM_PARAM: $JVM_PARAM"
else
  JVM_PARAM="-Xms2g -Xmx2g -XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m"
fi

if [ -n "$JVM_OPTS" ];
then
  echo "JVM_OPTS: $JVM_OPTS"
else
  JVM_OPTS="-XX:+UseConcMarkSweepGC -XX:+UseCMSInitiatingOccupancyOnly -XX:CMSInitiatingOccupancyFraction=70 -XX:+ExplicitGCInvokesConcurrentAndUnloadsClasses -XX:+CMSClassUnloadingEnabled -XX:+ParallelRefProcEnabled -XX:+CMSScavengeBeforeRemark -XX:ErrorFile=/logs/hs_err_pid%p.log -Xloggc:/logs/gc.log -XX:HeapDumpPath=/logs -XX:+PrintGCDetails -XX:+PrintGCDateStamps -XX:+HeapDumpOnOutOfMemoryError -XX:+PrintCommandLineFlags"
fi

JAVA_CMD="$JVM_PARAM $JVM_OPTS"

AGENT_OPTS="-javaagent:/hawkeye-agent/hawkeye-agent.jar=APPNAME?AGENT_UID=x-ingeek-userid"

if [ "true" == "$AGENT_ENABLED" ];then
    echo "JAVA_CMD: $JAVA_CMD $AGENT_OPTS"
    java $JAVA_CMD $AGENT_OPTS -jar /app/app.jar  # 这里去掉双引号
else
    echo "JAVA_CMD: $JAVA_CMD"
    java $JAVA_CMD -jar /app/app.jar              # 这里去掉双引号
fi
```

罪魁祸首：Shell 变量展开的分词机制
问题的本质在于 Shell 脚本中变量展开时的参数分割规则。当我们使用 `"$VAR"` 这种带引号的写法时，变量值中的所有内容会被视为一个整体参数，即使其中包含空格也不会被分割。而 Java 虚拟机要求每个参数必须作为独立的命令行参数传递。
