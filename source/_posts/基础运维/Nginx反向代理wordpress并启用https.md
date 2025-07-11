---
title: Nginx反向代理wordpress并启用https
abbrlink: 990b6b62
categories:
  - 基础运维
tags:
  - Proxy
  - Nginx
  - Docker
cover: 'https://s3.babudiu.com/iuxt/public/Nginx.svg'
date: 2021-09-03 21:51:03
---

> 反向代理 wordpress 遇到了问题，nginx 不启用 https，反向代理没问题（wordpress 和 nginx 之间走 http），但是 nginx 启用了 https，页面上的样式就没有了，f12 查看，发现 js 和 css 走的还是 http，所以 404

根本原因：wordpress 代码里没有开启 https，（wordpress 认为自己是被 http 访问的，毕竟 nginx 是通过 http 来访问它的）

## 修改 wordpress 配置

> 感觉这种方案最靠谱，谁的债谁来还。。

在 `wp-config.php` 的 ` if ( ! defined( ‘ABSPATH’ ) ) ` 前面添加：

```php
$_SERVER['HTTPS'] = 'on';
define('FORCE_SSL_LOGIN', true);
define('FORCE_SSL_ADMIN', true);
```

### 如果是官方 Docker 容器的话

强烈建议 Nginx 的 location /里面添加一个头：

```conf
proxy_set_header X-Forwarded-Proto $scheme;
```

wordpress 官方 Docker 镜像会检测这个头来判断是否代码里开启 https

原因是在：
wp-config.php 里面， 为了开启下面的参数

```php
if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
    $_SERVER['HTTPS'] = 'on';
}
```

参考：
<https://github.com/docker-library/wordpress/pull/142>

<https://hub.docker.com/_/wordpress>
