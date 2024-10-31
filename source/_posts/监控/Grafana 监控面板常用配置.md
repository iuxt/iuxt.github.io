---
title: Grafana 监控面板配置
categories:
  - 监控
tags:
  - 监控
  - prometheus
  - 配置记录
  - grafana
abbrlink: lswszwbz
cover: 'https://static.zahui.fan/public/Grafana.svg'
date: 2024-02-22 13:49:33
---

## 安装 grafana

oss：开源版本

enterprise: 商业版本

<https://grafana.com/grafana/download?pg=get&plcmt=selfmanaged-box1-cta1&edition=oss>

## 添加数据源

以 grafana 10.3.3 为例， 在 connections --> Data sources 中新增：

![image.png](https://static.zahui.fan/images/202402221351583.png)

## 面板配置

可以手动配置，也可以在 grafana 官网下载别人配置好的模板：<https://grafana.com/grafana/dashboards/>, 复制 ID 或者下载 json 文件到本地
![image.png](https://static.zahui.fan/images/202402221354043.png)

然后在面板上面，点击 + ， 选择 import dashboard 使用 json 文件导入或者直接输入面板 id 进行导入。

![image.png](https://static.zahui.fan/images/202402221356021.png)

导入后便能看到基础的图形。

## 做变量筛选

比如我们的监控会区分环境， 比如开发环境 dev，生产环境 prod， 现在需要在 grafana 的面板上做一个筛选框，这里是原始的数据：比如我们需要取 env 的值
![image.png](https://static.zahui.fan/images/202402221739352.png)

在面板的设置 -- 变量中， 添加一个变量， 变量名可以自定义， 在此面板的查询语句中可以调用。 查询选项取 Label values， 要取的标签为 env， 要查询的语句为 node_uname_info（选一个覆盖面最广的语句）

![image.png](https://static.zahui.fan/images/202402221743652.png)

然后 Dashboard 的右上角就有了这个动态筛选框。
![image.png](https://static.zahui.fan/images/202402221744503.png)

### 制作第二个选框

比如第一个选框是环境，第二个选框是项目，第三个选框是机器 ip 地址。

如下是根据 env 选择 project：
![image.png](https://static.zahui.fan/images/202402221821000.png)

如下是根据 env 和 project 选择 ip：

![image.png](https://static.zahui.fan/images/202402221824179.png)

所有变量：
![image.png](https://static.zahui.fan/images/202402221842109.png)

效果如图，选择 dev 环境自动出现 ip 198， 选择 prod 自动出现 ip 199：
![image.png](https://static.zahui.fan/images/202402221825070.png)

![image.png](https://static.zahui.fan/images/202402221825184.png)

面板中的调用方式：

![image.png](https://static.zahui.fan/images/202402221840568.png)

注意：上面查询 CPU 使用率的 promsql 语句不太好，会出现负数，应该修改为：

```bash
1 - (sum(increase(node_cpu_seconds_total{ip="$ip", mode="idle"}[1m])) by (instance) / sum(increase(node_cpu_seconds_total{ip="$ip"}[1m])) by (instance))
```