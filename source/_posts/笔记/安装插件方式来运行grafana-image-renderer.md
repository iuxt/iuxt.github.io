---
date: 2025-04-02 18:10:45
updated: 2025-04-02 19:13:00
---

```bash
grafana-cli plugins install grafana-image-renderer
```

或者可以到这里<https://grafana.com/grafana/plugins/grafana-image-renderer/?tab=installation>下载离线包，然后放到 plugins 文件夹下。需要注意下 plugins 文件夹的位置，可能使用命令安装的路径和真实的 plugins 目录不一致。
![image.png|654](https://static.zahui.fan/images/20250402181200283.png)

如果插件启动失败，报错：可以检查下 `plugins/grafana-image-renderer/chrome-headless-shell/linux-136.0.7101.0/chrome-headless-shell-linux64` 这个程序能否正常运行，如果报错
![image.png](https://static.zahui.fan/images/20250402181642753.png)

需要安装 `apt install -y libasound2t64`
