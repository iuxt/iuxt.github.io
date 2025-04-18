---
title: 使用selenium来实现Grafana的自动截图
categories:
  - 监控
tags: [自动化, Python, grafana]
abbrlink: suwpme
date: 2025-04-18 17:13:26
cover: ""
updated: 2025-04-18 18:04:42
---

selenium 是一个 python 库, 用于操作 chromium 浏览器实现一些自动化的动作, 本文是为了把 grafana 的监控图截图做成各种运维报表使用.

## 调试阶段

调试阶段可以使用电脑上的 chrome,并关闭 headless 模式,方便看到界面执行的效果.
chrome 官网下载即可, `chromedriver` 下载地址: <https://googlechromelabs.github.io/chrome-for-testing/> , chromedriver 放在代码同目录即可.

## 问题

为什么不用 `grafana-image-renderer` , 这个容易出问题,老是容易截图错误,并且如果监控图加载时间一长,比如图还没加载出来, 就完成了截图, 图片都是空白的.

## 简单的开始

```bash
pip install selenium
```

```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

chrome_options = Options()
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
chrome_options.add_argument("--disable-extensions")
# chrome_options.binary_location = ""           # chrome 可执行程序的路径
# chrome_options.add_argument("--headless")     # 无头模式
# chrome_options.add_argument("--disable-gpu")  # 禁用GPU加速
ser = Service()
# ser.executable_path = r'./chromedriver'	    # 指定 ChromeDriver 的路径

# 初始化浏览器
driver = webdriver.Chrome(options=chrome_options, service=ser)

# 设置浏览器的界面大小
driver.set_window_size(1920, 1080)

# 打开grafana登录界面
driver.get("https://grafana.example.com/login")

# 关闭浏览器
driver.close()
```

正常的话, 可以打开页面了, 然后浏览器会自动关闭.

## 查找元素

### 从浏览器开发工具查找元素

比如说在 grafana 登陆界面,我想自动输入账号密码进行登录,那么可以使用

![image.png](https://static.zahui.fan/images/20250418173005375.png)

在这里可以找到名字, 可以根据 NAME 来定位,也可以根据 class 定位.

```python
        # 填写用户名和密码并登录
        username_input = driver.find_element(By.NAME, "user")
        password_input = driver.find_element(By.NAME, "password")
        login_button = driver.find_element(By.XPATH, '//button[@type="submit"]')
        username_input.send_keys(self.username)
        password_input.send_keys(self.password)
        login_button.click()
```

### 等待元素出现

比如我打开某个 panel 仪表板的全屏界面后, 我想等这个界面加载出来再继续,可以通过:

```python
        # 等待仪表板加载完成，直到某个元素（例如第一个面板）可见
        WebDriverWait(driver, 30).until(
            EC.presence_of_element_located(
                (By.XPATH, '//*[@class="css-itdw1b-panel-container"]')
            )
        )
```

这里的 XPATH 获取方式:
![image.png](https://static.zahui.fan/images/20250418173503988.png)

### 等待元素消失

比如说查看一个长时间的监控图像, 会加载很久, 这个时候需要等待图加载出来后再进行截图,我们可以监视页面上的加载 icon,等这个 icon 消失表示加载完成.
![image.png](https://static.zahui.fan/images/20250418173645372.png)

代码如下:

```python
        # 检测 Spinner 是否消失（等待最多60秒）
        WebDriverWait(driver, 60).until(
            EC.invisibility_of_element_located(
                (By.XPATH, '//*[@class="css-1p4srcl-Icon"]')
            )
        )
```

## 针对指定的 panel 进行截图

```python
        # 定位目标 panel 元素
        panel = driver.find_element(By.XPATH, '//*[@class="css-itdw1b-panel-container"]')

        # 对 panel 元素进行截图
        safe_filename = re.sub(r'[\\/*?:"<>|]', '_', self.panel_title) + '.png'
        panel.screenshot(safe_filename)
```

当然也可以直接全屏截图.

## 中文乱码问题

截图如下:
![image.png](https://static.zahui.fan/images/20250418172416136.png)

修复方式为: 安装中文字体:

```bash
# 安装微软雅黑字体
apt-get install -y ttf-wqy-microhei
```

![image.png](https://static.zahui.fan/images/20250418172544525.png)

## 完整代码

```python
//todo
```

## 容器化

我们最终是要以容器的形式在 Kubernetes 上的 cronjob 来定时执行. 考虑到安装 chromium 依赖非常多, 直接使用发行版源里的 chromium 更方便, 首先排除新版 ubuntu, ubutnu 的 chromium 被 snap 包替代了, 所以选择了 `debian:12` 镜像.

`dockerfile` 如下:

```dockerfile
FROM debian:12
RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list.d/debian.sources && \
    apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    chromium chromium-driver python3-pip python3-venv \
    ttf-wqy-microhei
ADD code /code
CMD ["python3", "main.py"]
```
