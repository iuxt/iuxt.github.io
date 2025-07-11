---
title: 使用Keepalived来实现Nginx高可用
abbrlink: 0cebb8ae
categories:
  - 基础运维
tags:
  - keepalived
  - nginx
  - HA
  - 配置记录
cover: 'https://s3.babudiu.com/iuxt/public/Nginx.svg'
date: 2022-06-15 17:33:51
---

公有云不会考虑这些，不过自建机房，使用 nginx 做入口，keepalived 是唯一的选择。

| 节点         | IP            |
| ------------ | ------------- |
| keepalived 主 | 10.0.0.45 |
| keepalived 备 | 10.0.0.44 |
| vip          | 10.0.0.46 |

## 组播模式

{% tabs TabName %}

<!-- tab keepalived1 -->

```conf
global_defs {
    script_user root            # 脚本执行者
    enable_script_security      # 标记脚本安全
}

vrrp_script check_script {
    script "killall -0 nginx"          # 脚本路径, 返回值为0则正常，不为0认为不正常
    # 可替代的命令:
    # /usr/sbin/pidof nginx             这个命令不推荐, 多个进程pid会出问题
    # pgrep nginx                       类似于pidof nginx 返回的是pid
    interval 2                              # 脚本执行间隔，单位s
    weight -20                              # -254-254之间，检测失败权重减少
}

vrrp_instance VI_1 {                        # 实例名
    state MASTER                            # 当前keepalived状态
    interface eth0
    virtual_router_id 251                   # 组播ID主备需一致，单播无所谓
    priority 100                            # 默认权重
    advert_int 1                            # 发送VRRP通告间隔，单位s
    # nopreempt                             # 设置非抢占模式，原本高优先级的MASER恢复之后，不会去抢现在是低优先级BACKUP, 这项配置只有在两台都配置为state backup才有用。

    authentication {
        auth_type PASS                      # 主备验证信息，需一致
        auth_pass 123456 
    }
    track_script {
        check_script                        # 调用脚本,若脚本最后的执行结果是非0的，则判断端口down掉，此时vip会漂移到keepalived-BACKUP上
    }
    virtual_ipaddress {
        10.0.0.46                       # vip
    }
}
```

<!-- endtab -->

<!-- tab keepalived2 -->

```conf
global_defs {
    script_user root
    enable_script_security
}

vrrp_script check_script {
    script "killall -0 nginx"
    interval 2
    weight -20
}

vrrp_instance VI_1 {
    state BACKUP
    interface eth0
    virtual_router_id 251
    priority 99
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 123456
    }
    track_script {
        check_script
    }
    virtual_ipaddress {
        10.0.0.46
    }
}
```

<!-- endtab -->
{% endtabs %}

## 单播模式

{% tabs TabName %}

<!-- tab keepalived1 -->

```conf
global_defs {
    script_user root            # 脚本执行者
    enable_script_security      # 标记脚本安全
}

vrrp_script check_script {
    script "killall -0 nginx"          # 脚本路径, 返回值为0则正常，不为0认为不正常
    interval 2                              # 脚本执行间隔，单位s
    weight -20                              # -254-254之间，检测失败权重减少, 要大于集群  最大 priority - 最小 priority
}

vrrp_instance VI_1 {                        # 实例名
    state MASTER                            # 当前keepalived状态
    interface eth0
    virtual_router_id 251                   # 组播ID主备需一致，单播无所谓
    priority 100                            # 默认权重
    advert_int 1                            # 发送VRRP通告间隔，单位s
    # nopreempt                             # 设置非抢占模式，原本高优先级的MASER恢复之后，不会去抢现在是低优先级BACKUP, 这项配置只有在两台都配置为state backup才有用。

    authentication {
        auth_type PASS                      # 主备验证信息，需一致
        auth_pass 123456 
    }
    track_script {
        check_script                        # 调用脚本,若脚本最后的执行结果是非0的，则判断端口down掉，此时vip会漂移到keepalived-BACKUP上
    }
    unicast_src_ip 10.0.0.45            # 配置源地址的IP地址
    unicast_peer {
       10.0.0.44                         # 配置从节点的目标IP地址
    }
    virtual_ipaddress {
        10.0.0.46                       # vip
    }
}
```

<!-- endtab -->

<!-- tab keepalived2 -->

```conf
global_defs {
    script_user root
    enable_script_security
}

vrrp_script check_script {
    script "killall -0 nginx"
    interval 2
    weight -20
}

vrrp_instance VI_1 {
    state BACKUP
    interface eth0
    virtual_router_id 251
    priority 99
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 123456
    }
    track_script {
        check_script
    }
    unicast_src_ip 10.0.0.44
    unicast_peer {
       10.0.0.45
    }
    virtual_ipaddress {
        10.0.0.46
    }
}
```

<!-- endtab -->

{% endtabs %}

## 非抢占式说明

> 抢占式 和 非抢占式的区别： 比如 master1 默认的权重（priority）高，vip 当前在 master1 上， master1 挂掉后 vip 会飘到 master2 上，那么如果 master1 恢复正常了，抢占式会重新将 vip 抢过来，再次绑定到 master1 上，非抢占式则保持在 master2 上，除非 master2 也出问题。

- 必须都为 BACKUP 模式，如果有 MASTER，那么 MASTER 会抢占
- 必须都配置 nopreempt
- 去掉 weight -20 配置， 因为非抢占式这种配置， 高优先级的不会去抢占低优先级的 VIP， 所以检测失败降低权重是没有效果的。
- 配置 `rise 1` 和 `fall 1` 含义是检测失败状态变成 fault

{% tabs TabName %}

<!-- tab keepalived1 -->

```conf
global_defs {
    script_user root
    enable_script_security
}

vrrp_script check {
    script "pgrep nginx"
    interval 2
    rise 1
    fall 1
}

vrrp_instance VI_1 {
    state  BACKUP
    interface eth0
    virtual_router_id 251
    priority 100
    nopreempt

    authentication {
        auth_type PASS
        auth_pass 123456
    }
    track_script {
        check
    }
    unicast_src_ip 10.0.0.11
    unicast_peer {
       10.0.0.12
       10.0.0.13
    }
    virtual_ipaddress {
        10.0.0.10 dev eth0
    }
}
```

<!-- endtab -->

<!-- tab keepalived2 -->

```conf
global_defs {
    script_user root
    enable_script_security
}

vrrp_script check {
    script "pgrep nginx"
    interval 2
    rise 1
    fall 1
}

vrrp_instance VI_1 {
    state  BACKUP
    interface eth0
    virtual_router_id 251
    priority 99
    nopreempt

    authentication {
        auth_type PASS
        auth_pass 123456
    }
    track_script {
        check
    }
    unicast_src_ip 10.0.0.12
    unicast_peer {
       10.0.0.11
       10.0.0.13
    }
    virtual_ipaddress {
        10.0.0.10 dev eth0
    }
}
```

<!-- endtab -->

<!-- tab keepalived3 -->

```conf
global_defs {
    script_user root
    enable_script_security
}

vrrp_script check {
    script "pgrep nginx"
    interval 2
    rise 1
    fall 1
}

vrrp_instance VI_1 {
    state  BACKUP
    interface eth0
    virtual_router_id 251
    priority 98
    nopreempt

    authentication {
        auth_type PASS
        auth_pass 123456
    }
    track_script {
        check
    }
    unicast_src_ip 10.0.0.13
    unicast_peer {
       10.0.0.11
       10.0.0.12
    }
    virtual_ipaddress {
        10.0.0.10 dev eth0
    }
}
```

<!-- endtab -->

{% endtabs %}

## 两台 Nginx 同步配置文件

使用 crontab 定时每 5 分钟执行脚本：

```bash
#!/bin/bash
set -ueo pipefail

NGINX_CONF_LOCATION="/usr/local/nginx/conf/"
BACKUP_SERVER="root@10.0.0.44"

# 这里是执行rsync同步配置文件，然后打印结果中的第二行（如果有更新的文件，第二行不为空）
rsync_result=$(rsync -av --delete ${NGINX_CONF_LOCATION} ${BACKUP_SERVER}:${NGINX_CONF_LOCATION} | sed -n "2p")
if [ -z ${rsync_result} ];then
  echo "the configuration file has not changed"
else
  echo "changed nginx config, reload Backup Nginx"
  ssh ${BACKUP_SERVER} "sudo /usr/local/nginx/sbin/nginx -s reload"
fi
```