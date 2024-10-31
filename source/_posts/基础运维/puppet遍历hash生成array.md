---
title: Puppet遍历hash生成array
abbrlink: bee2f20f
categories:
  - 基础运维
tags:
  - Puppet
date: 2021-07-05 14:26:54
---

> 公司的 nagios 监控是使用 puppet 来进行自动部署的，但是需要手动修改 puppet 配置才能生效，现在的问题是添加一个新机器得先在 puppet 上添加机器，然后添加到相对应的组，我们想能否让它自动添加到对应的组里面。

vim nagios_server.pp

```ruby
nagios::nagios::add_linux_remote {
        'guangzhou.localhost.com' :
        addr     => '10.0.0.9',
        services => [{'name' => 'check_load', 'desc' => 'Current Load', 'notify' => 1},
                     ...
                     {'name' => 'check_zombie_procs', 'desc' => 'Zombie Processes', 'notify' => 1}];
        'tianjin.localhost.com' :
        addr     => '10.0.0.90',
        services => [{'name' => 'check_load', 'desc' => 'Current Load', 'notify' => 1},
                     ...
                     {'name' => 'check_zombie_procs', 'desc' => 'Zombie Processes', 'notify' => 1}];
}
...

class { 'nagios::nagios':
        hostgroups => [{'name' => 'supermicro',
                        'alias' => 'Supermicro Machines',
                        'members' => ['guangzhou.localhost.com' ... 'yingtan.localhost.com']},
                       {'name' => 'windows',
                        'alias' => 'Windows Machines',
                        'members' => ['win2016-dc.localhost.com' ... 'win2016-oos8.localhost.com']},
                       {'name' => 'vms',
                        'alias' => 'Virtual Machines',
                        'members' => ['tianjin.localhost.com' ... 'erdao.localhost.com']},
                       {'name' => 'edc',
                        'alias'  => 'edc servers',
                        'members' => ['bjedc1.localhost.com' ... 'cdcbjedc3.localhost.com']},
                      ]
    }
```

> 通过循环来调用 add_linux_remote 来创建很多个配置文件。安装 nagios（省略）和生成 hostgroup.cfg 配置文件,这里的列表是手动填上去的。

nagios 模块 add_linux_remote 内容：

```ruby
define nagios::nagios::add_linux_remote (
    $addr='127.0.0.1',
    $port=5666,
    $check_command="check-host-alive",
    $services) {
    file { "/etc/nagios/objects/${name}.cfg":
        ensure     => 'present',
        content    => template('nagios/linux-host.cfg.erb'),
        owner      => 'root',
        group      => 'root',
        mode       => '0664',
        require    => File['/etc/nagios/objects'],
        notify     => Class['nagios::nagios::service'],
    }
}
```

## 修改变量为 hash

现在传给 add_linux_remote 的变量是很多个 hash，采用循环的方式，得先让它先成一个 hash，才能方便我们进行遍历
添加了一个新的参数 hostgroup 来判断应该放在哪个分组下。

vim nagios_server.pp

```ruby
monitor_list = {
        'guangzhou.localhost.com' => {
        addr     => '10.0.0.9',
        hostgroup => 'supermicro',
        services => [{'name' => 'check_load', 'desc' => 'Current Load', 'notify' => 1},
                     ...
                     {'name' => 'check_zombie_procs', 'desc' => 'Zombie Processes', 'notify' => 1}],
        },
        'tianjin.localhost.com' => {
        addr     => '10.0.0.90',
        hostgroup => 'vms',
        services => [{'name' => 'check_load', 'desc' => 'Current Load', 'notify' => 1},
                     ...
                     {'name' => 'check_zombie_procs', 'desc' => 'Zombie Processes', 'notify' => 1}],
        },
}
```

现在这种格式是 monitor_list 是一个大 hash，大 hash 里面有很多小 hash

## 不改变原先模块的工作方式

这里执行 add_linux_remote 或者 add_windows_remote

```ruby
$monitor_list.each |$key, $value| {
        if $value["hostgroup"] =~ /(supermicro|edc|vms)/ {
            nagios::nagios::add_linux_remote { $key:
            addr     => $value["addr"],
            services => $value["services"],
            }
        }
        elsif $value["hostgroup"] =~ /windows/ {
            nagios::nagios::add_windows_remote { $key:
            addr     => $value["addr"],
            services => $value["services"],
            }
        }
    }
```

接下来修改添加 hostgroup 的部分

```ruby
class { 'nagios::nagios':
        hostgroups => [{'name' => 'supermicro',
                        'alias' => 'Supermicro Machines',
                        'members' => $monitor_list.map |$key, $value| {if $value["hostgroup"] == "supermicro" { $key }}.filter |$items| { $items }},
                       {'name' => 'windows',
                        'alias' => 'Windows Machines',
                        'members' => $monitor_list.map |$key, $value| {if $value["hostgroup"] == "windows" { $key }}.filter |$items| { $items }},
                       {'name' => 'vms',
                        'alias' => 'Virtual Machines',
                        'members' => $monitor_list.map |$key, $value| {if $value["hostgroup"] == "vms" { $key }}.filter |$items| { $items }},
                       {'name' => 'edc',
                        'alias'  => 'edc servers',
                        'members' => $monitor_list.map |$key, $value| {if $value["hostgroup"] == "edc" { $key }}.filter |$items| { $items }},
                      ]
    }
```

> 这里的操作是 先 map，通过判断生成 array，然后调用 filter 去掉 array 里面的空值。
