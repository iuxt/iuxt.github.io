---
title: 使用keepalived完成LVS高可用
abbrlink: 675d47a9
categories:
  - 基础运维
tags:
  - LoadBalance
  - 配置记录
  - Network
  - HA
  - keepalived
  - lvs
date: 2022-07-29 13:09:47
---

> 有了 keepalived 可以不用执行 ipvsadm 了， 并且可以实现自动剔除节点，还可以两台 Director 做高可用。

手动配置 LVS 请看 [内核级负载均衡 LVS DR模式 部署记录](/posts/5fdc91d7)

另见：[使用Keepalived来实现Nginx高可用](/posts/0cebb8ae)

规划：

| 机器          | IP        |
| ------------- | --------- |
| VIP           | 10.0.0.8  |
| director      | 10.0.0.40 |
| realserver1   | 10.0.0.42 |
| realserver2   | 10.0.0.43 |
| 网卡 interface | eth0      |

## 单台 Director Server

keepalived 配置：

```txt
vrrp_sync_group GOP {
    group {
        VI_PRI_CONNECT
        VI_PRI_AUTH
    }
}

vrrp_instance VI_PRI_CONNECT {
    state BACKUP
    interface eth0
    virtual_router_id 128
    priority 100
    advert_int 1
    nopreempt
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
        10.0.0.8/24 dev eth0
    }
}


virtual_server 10.0.0.8 80 {
    delay_loop 6
    lb_algo rr
    lb_kind DR
    protocol TCP


    real_server 10.0.0.42 80 {
        weight 100
        TCP_CHECK {
                connect_timeout 3
                nb_get_retry 3
                delay_before_retry 3
                connect_port 80
        }
    }
    real_server 10.0.0.43 80 {
        weight 100
        TCP_CHECK {
                connect_timeout 3
                nb_get_retry 3
                delay_before_retry 3
                connect_port 80
        }
    }
}
```

## 两台 Director Server 做主备

| 机器          | IP        |
| ------------- | --------- |
| VIP           | 10.0.0.8  |
| director 1   | 10.0.0.40 |
| director 2   | 10.0.0.41 |
| realserver1   | 10.0.0.42 |
| realserver2   | 10.0.0.43 |
| 网卡 interface | eth0      |

> 抢占式 和 非抢占式的区别： 比如 master1 默认的权重（priority）高，vip 当前在 master1 上， master1 挂掉后 vip 会飘到 master2 上，那么如果 master1 恢复正常了，抢占式会重新将 vip 抢过来，再次绑定到 master1 上，非抢占式则保持在 master2 上，除非 master2 也出问题。

### Director Server 1

```txt
vrrp_sync_group GOP {
    group {
        VI_PRI_CONNECT
        VI_PRI_AUTH
    }
}

vrrp_instance VI_PRI_CONNECT {
    state BACKUP                    # 非抢占式所有节点都需要是BACKUP
    interface eth0
    virtual_router_id 128
    priority 110                    # 权重
    advert_int 1
    nopreempt                       # 配置为非抢占式
    unicast_src_ip 10.0.0.40        # 本机的IP
    unicast_peer {
        10.0.0.41                   # 其他Keepalived机器的IP，可以写多个
    }
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
        10.0.0.8/24 dev eth0
    }
}


virtual_server 10.0.0.8 80 {
    delay_loop 6
    lb_algo rr
    lb_kind DR
    protocol TCP


    real_server 10.0.0.42 80 {
        weight 100
        TCP_CHECK {
                connect_timeout 3
                nb_get_retry 3
                delay_before_retry 3
                connect_port 80
        }
    }
    real_server 10.0.0.43 80 {
        weight 100
        TCP_CHECK {
                connect_timeout 3
                nb_get_retry 3
                delay_before_retry 3
                connect_port 80
        }
    }
}
```

### Director Server 2

```txt
vrrp_sync_group GOP {
    group {
        VI_PRI_CONNECT
        VI_PRI_AUTH
    }
}

vrrp_instance VI_PRI_CONNECT {
    state BACKUP
    interface eth0
    virtual_router_id 128
    priority 100
    advert_int 1
    nopreempt
    unicast_src_ip 10.0.0.41            # 本机的IP
    unicast_peer {
        10.0.0.40                       # 其他Keepalived机器的IP，可以写多个
    }
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
        10.0.0.8/24 dev eth0
    }
}


virtual_server 10.0.0.8 80 {
    delay_loop 6
    lb_algo rr
    lb_kind DR
    protocol TCP


    real_server 10.0.0.42 80 {
        weight 100
        TCP_CHECK {
                connect_timeout 3
                nb_get_retry 3
                delay_before_retry 3
                connect_port 80
        }
    }
    real_server 10.0.0.43 80 {
        weight 100
        TCP_CHECK {
                connect_timeout 3
                nb_get_retry 3
                delay_before_retry 3
                connect_port 80
        }
    }
}
```

## Real Server 需要做的配置

LVS 的 DR 模式 需要对后端服务器做改造, 添加虚拟 ip， 并配置此 ip 不响应 ARP 请求。

```bash
ip link add ipvs0 type dummy
ip addr add 10.0.0.8/32 dev ipvs0

# 不响应ARP请求, 修改内核参数
echo "1" > /proc/sys/net/ipv4/conf/ipvs0/arp_ignore
echo "1" > /proc/sys/net/ipv4/conf/all/arp_ignore
echo "2" > /proc/sys/net/ipv4/conf/ipvs0/arp_announce
echo "2" > /proc/sys/net/ipv4/conf/all/arp_announce
```