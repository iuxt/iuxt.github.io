---
date: 2026-02-26 12:06:28
updated: 2026-02-26 12:18:24
---

```bash
topk(10, count by (__name__)({__name__=~".+"}))
```

![PixPin_2026-02-26_11-52-41.png](https://s3.babudiu.com/iuxt/2026/02/6b78397489a6b014d556906d4961c2c9.png)

```bash

count by (__name__, job, instance) (system_error_counter_total)

```

![](https://s3.babudiu.com/iuxt/2026/02/63be82c9c180661be5138c83f047dfae.png)

到对应的 Pod 里看看：
![PixPin_2026-02-26_12-17-42.png](https://s3.babudiu.com/iuxt/2026/02/6cd5947a340b5dfc173bd5c180950ac7.png)

可以看到这个指标数据高达 60M（这只是单个 Pod 的数据）就是这些数据把 Prometheus 搞挂了。
