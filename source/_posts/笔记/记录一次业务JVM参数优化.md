

1. 收到告警，服务发生重启
2. 登录服务器查看，是k8s健康检查不通过导致的重启，进入pod测试验证，发现请求健康检查平均耗时都在1.5s左右，很容易导致健康检查响应超时，进而被k8s重启。
3. Arthas 分析 jvm，发现Survivor
4. 
5. Eden与单个Survivor的比例
![image.png|692](https://s3.babudiu.com/iuxt/2025/10/c44adb05b68d6b221b82ef0e07608171.png)
![image.png|844](https://s3.babudiu.com/iuxt/2025/10/9129a190c3c76ee9288cab0e173c2da0.png)

调整后
