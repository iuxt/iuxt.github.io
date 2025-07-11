---
title: Jenkins升级插件引发的血案
categories:
  - 基础运维
tags:
  - jenkins
  - 升级版本
abbrlink: lm784jlv
cover: 'https://s3.babudiu.com/iuxt/images/202304111550061.svg'
date: 2023-09-06 12:12:49
---

我们公司用的 jenkins 是老版本, 不知道什么时候谁点了升级插件, 但是没有重启 jenkins, 一直用者好好的, 突然有一天有个倒霉蛋重启了 jenkins,然后就报错了.
![](https://s3.babudiu.com/iuxt/images/202309061002748.png)

搜索了一圈的解决方案:
关闭认证, 配置文件在 `.jenkins/config.xml` 目录中, 需要先切换到 jenkins 用户, 先备份 `cp .jenkins/config.xml{,.bak}` 然后再修改

将 authorizationStrategy 这一块改为

```xml
<authorizationStrategy class="hudson.security.FullControlOnceLoggedInAuthorizationStrategy">
    <denyAnonymousReadAccess>false</denyAnonymousReadAccess>
</authorizationStrategy>
```

将 securityRealm 块 删除, 保存后重启 jenkins, 日志里会打印账号密码, 用这个登陆.

![](https://s3.babudiu.com/iuxt/images/202309061119937.png)

登陆后, 可以看到各种不兼容的插件了.
![](https://s3.babudiu.com/iuxt/images/202309061126649.png)

现在升级 jenkins 版本, 升级后可以看到插件都兼容了, 然后将有更新的插件都更新一下.

如果无法启动, 注意查看 jenkins 启动日志, 我公司升级后提示 java 版本不兼容, 需要将 java 8 升级到 java 11 才可启动新版 jenkins, 为了不影响现有流水线构建, 所以不修改环境变量了, 指定 java 版本来运行新版 jenkins

```bash
./jdk-11.0.19/bin/java -jar jenkins.war
```

最后将 config.xml.bak 复制为 config.xml, 替换旧的 config.xml
