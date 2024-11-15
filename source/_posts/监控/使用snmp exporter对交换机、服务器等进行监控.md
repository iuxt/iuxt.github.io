---
title: 使用snmp exporter对交换机、服务器等进行监控
categories:
  - 监控
tags:
  - prometheus
  - snmp
abbrlink: smz2c9
date: 2024-11-15 11:14:33
cover: https://static.zahui.fan/images/202411151309207.png
---

## 安装

到 GitHub 下载一个可执行文件，直接运行即可，或者使用 systemd 来运行，也可以直接部署到 Kubernetes 中。
<https://github.com/prometheus/snmp_exporter>

systemd 配置：

```ini
[Unit]
Description=snmp_exporter
After=network.target

[Service]
ExecStart=/opt/snmp_exporter/snmp_exporter --config.file=/opt/snmp_exporter/snmp.yml
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## 交换机或服务器打开 snmp 协议

这一步需要在交换机或服务器的 ipmi 上配置，交换机这种网络设备一般都只支持 snmp 协议来获取数据，比如说每个接口的状态（有没有插网线等）
对于服务器，像 cpu 占用率、内存使用率这些数据使用 node_exporter 就可以做，为啥还要使用 snmp_exporter 呢，snmp_exporter 可以做到一些底层的监控，比如说：风扇转速、电源是否有损坏的（一般服务器都有多个电源模块）、温度情况、磁盘阵列状态（是否有硬盘坏掉了，比如做了 raid1，坏了一块硬盘在软件层面是无感知的，但是需要及时更换硬盘了。）

打开 snmp 协议后，需要设置并记录一下团体名。

测试 snmp 命令示例：

```bash
snmpwalk -v 2c -c 123456 100.200.1.254
snmpwalk -v 2c -c 123456 172.18.48.5 1.3.6.1.2.1.47.1.1.1.1.7
snmpwalk -v3 -u sysadmin -a MD5 -A rootuser -x DES -X rootuser -l authpriv 100.200.1.24
```

## 生成配置文件

snmp exporter 开源软件中有个 snmp generator ，可以用于生成 snmp exporter 的配置文件。
配置文件中根据硬件的 MIB 文件生成了 OID 的映射关系。以 Cisco 交换机为例，在官方 GitHub 上下载最新的 **snmp.yml** 文件，由于 Cisco 交换机使用的是 if_mib 模块，在 if_mib 下新增 auth 配置，团体名要和交换机上配置的一致。
根据 mib 文件生成 yaml 配置文件工具：<https://github.com/prometheus/snmp_exporter/tree/main/generator>
关于采集的监控项是在 walk 字段下，如果要新增监控项，写在 walk 项下。我新增了交换机的 CPU 和内存信息。官方示例中的 if_mib 这个是 module 名字， if_mib 是个网络设备的规范，RFC1573

### H3C 交换机配置示例

```yml
# WARNING: This file was auto-generated using snmp_exporter generator, manual changes will be lost.
H3C:
  walk:
  - 1.3.6.1.2.1.2.2.1.2                     #端口描述
  - 1.3.6.1.2.1.2.2.1.8                     #端口状态 1up，2down
  - 1.3.6.1.2.1.31.1.1.1.1                  #端口名称
  - 1.3.6.1.2.1.31.1.1.1.18                 #端口别名
  - 1.3.6.1.4.1.25506.2.40.2.1.2.3.1.5      #H3C端口进流量
  - 1.3.6.1.4.1.25506.2.40.2.1.2.3.1.6      #H3C端口出流量
  - 1.3.6.1.4.1.25506.8.35.18.4.3.1.13      #内存利用率
  - 1.3.6.1.4.1.25506.8.35.18.4.3.1.4       #CPU利用率
  - 1.3.6.1.4.1.25506.8.35.9.1.2.1.2        #电源状态
  get:
  - 1.3.6.1.2.1.1.1.0
  - 1.3.6.1.2.1.1.3.0
  - 1.3.6.1.2.1.1.5.0
  - 1.3.6.1.4.1.25506.8.35.18.1.1.0
  metrics:
  # 这里的name就是收集到的指标的名字
  - name: sysDescr
    oid: 1.3.6.1.2.1.1.1
    type: DisplayString
    help: A textual description of the entity - 1.3.6.1.2.1.1.1
  - name: sysUpTime
    oid: 1.3.6.1.2.1.1.3
    type: gauge
    help: The time (in hundredths of a second) since the network management portion
      of the system was last re-initialized. - 1.3.6.1.2.1.1.3
  - name: sysName
    oid: 1.3.6.1.2.1.1.5
    type: DisplayString
    help: An administratively-assigned name for this managed node - 1.3.6.1.2.1.1.5
  - name: ifOperStatus
    oid: 1.3.6.1.2.1.2.2.1.8
    type: gauge
    help: The current operational state of the interface - 1.3.6.1.2.1.2.2.1.8
    indexes:
    - labelname: ifIndex
      type: gauge
    lookups:
    - labels:
      - ifIndex
      labelname: ifAlias
      oid: 1.3.6.1.2.1.31.1.1.1.18
      type: DisplayString
    - labels:
      - ifIndex
      labelname: ifDescr
      oid: 1.3.6.1.2.1.2.2.1.2
      type: DisplayString
    - labels:
      - ifIndex
      labelname: ifName
      oid: 1.3.6.1.2.1.31.1.1.1.1
      type: DisplayString
    enum_values:
      1: up
      2: down
      3: testing
      4: unknown
      5: dormant
      6: notPresent
      7: lowerLayerDown
  - name: hh3cIfStatFlowHCInBytes
    oid: 1.3.6.1.4.1.25506.2.40.2.1.2.3.1.5
    type: counter
    help: In bytes in the specified interval - 1.3.6.1.4.1.25506.2.40.2.1.2.3.1.5
    indexes:
    - labelname: ifIndex
      type: gauge
    lookups:
    - labels:
      - ifIndex
      labelname: ifAlias
      oid: 1.3.6.1.2.1.31.1.1.1.18
      type: DisplayString
    - labels:
      - ifIndex
      labelname: ifDescr
      oid: 1.3.6.1.2.1.2.2.1.2
      type: DisplayString
    - labels:
      - ifIndex
      labelname: ifName
      oid: 1.3.6.1.2.1.31.1.1.1.1
      type: DisplayString
  - name: hh3cIfStatFlowHCOutBytes
    oid: 1.3.6.1.4.1.25506.2.40.2.1.2.3.1.6
    type: counter
    help: Out bytes in the specified interval - 1.3.6.1.4.1.25506.2.40.2.1.2.3.1.6
    indexes:
    - labelname: ifIndex
      type: gauge
    lookups:
    - labels:
      - ifIndex
      labelname: ifAlias
      oid: 1.3.6.1.2.1.31.1.1.1.18
      type: DisplayString
    - labels:
      - ifIndex
      labelname: ifDescr
      oid: 1.3.6.1.2.1.2.2.1.2
      type: DisplayString
    - labels:
      - ifIndex
      labelname: ifName
      oid: 1.3.6.1.2.1.31.1.1.1.1
      type: DisplayString  
  - name: hh3cLswSysIpAddr
    oid: 1.3.6.1.4.1.25506.8.35.18.1.1
    type: InetAddressIPv4
    help: System IP address, which is the primary IP address of the VLAN interface
      that has smallest VLAN ID and is configured IP address. - 1.3.6.1.4.1.25506.8.35.18.1.1
  - name: hh3cLswSlotMemoryRatio
    oid: 1.3.6.1.4.1.25506.8.35.18.4.3.1.13
    type: gauge
    help: The percentage of system memory in use on the board - 1.3.6.1.4.1.25506.8.35.18.4.3.1.13
    indexes:
    - labelname: hh3cLswFrameIndex
      type: gauge
    - labelname: hh3cLswSlotIndex
      type: gauge
  - name: hh3cLswSlotCpuRatio
    oid: 1.3.6.1.4.1.25506.8.35.18.4.3.1.4
    type: gauge
    help: CPU usage of the slot in accuracy of 1%, and the range of value is 1 to
      100. - 1.3.6.1.4.1.25506.8.35.18.4.3.1.4
    indexes:
    - labelname: hh3cLswFrameIndex
      type: gauge
    - labelname: hh3cLswSlotIndex
      type: gauge
  - name: hh3cDevMPowerStatus
    oid: 1.3.6.1.4.1.25506.8.35.9.1.2.1.2
    type: gauge
    help: 'Power status: active (1), deactive (2) not installed (3) and unsupported
      - 1.3.6.1.4.1.25506.8.35.9.1.2.1.2'
    indexes:
    - labelname: hh3cDevMPowerNum
      type: gauge
    enum_values:
      1: active
      2: deactive
      3: not-install
      4: unsupport
  version: 2
  max_repetitions: 25
  retries: 3
  timeout: 60s
  auth:
    community: 123456
```

### 浪潮服务器配置示例

```yml
# WARNING: This file was auto-generated using snmp_exporter generator, manual changes will be lost.
Inspur:
  walk:
  - 1.3.6.1.4.1.37945.2.1.5.1.1.3.19.9.65.115.115.101.116.32.84.97.103 #机器fru信息
  - 1.3.6.1.4.1.37945.2.3.1.1.1.3 #电源模块PSU当前在位状态
  - 1.3.6.1.4.1.37945.2.1.1.1.1.1.3 #CPU状态
  - 1.3.6.1.4.1.37945.2.1.2.2.1.1.3 #电压sensor健康状态,0-N/A;1-Normal;2-Warning;3-Critical
  - 1.3.6.1.4.1.37945.2.1.2.1.1.1.3 #温度sensor的健康状态,0-N/A;1-Normal;2-Warning;3-Critical
  - 1.3.6.1.4.1.37945.2.1.2.3.1.1.3 #风扇转速,0-N/A;1-Normal;2-Warning;3-Critical
  - 1.3.6.1.4.1.37945.2.1.3.1.1.1.4 #前置硬盘状态 0-N/A;1-Normal;2-Warning;3-Critical
  - 1.3.6.1.4.1.37945.2.1.6.2.1.1.9 #硬盘状态监控信息(驱动器插槽)
  - 1.3.6.1.4.1.37945.2.1.1.6.1.1.9 #电源power 0-N/A;1-Normal;2-Warning;3-Critical
  - 1.3.6.1.4.1.37945.2.1.2.5.1.1.3 #内存监控 0-N/A;1-Normal;2-Warning;3-Critical
  - 1.3.6.1.4.1.37945.2.1.6.3.1.1.4 #raid类型,比如raid1 raid5 raid10
  - 1.3.6.1.4.1.37945.2.1.6.3.1.1.2 #Raid卡健康状态信息, "Absent","Normal","Critical","N/A"
  - 1.3.6.1.4.1.37945.2.1.2.14.1.1.5 #网卡健康状态，显示为"Normal","Warning","Critical","N/A"

  metrics:
  - name: serverFRUInfoSetupAttributeValue  #机器fru信息:序列号
    oid: 1.3.6.1.4.1.37945.2.1.5.1.1.3.19.9.65.115.115.101.116.32.84.97.103
    type: DisplayString
    help: The serverFRUInfoSetupAttributeValue of this conceptual row. - 机器fru 序列号信息
    indexes:
    - labelname: inspur
      type: gauge

  - name: serverPowerSupplyMonitorPresent  #电源模块PSU当前在位状态
    oid: 1.3.6.1.4.1.37945.2.3.1.1.1.3
    type: DisplayString
    help: The serverPowerSupplyMonitorPresent of this conceptual row. - 电源模块PSU当前在位状态
    indexes:
    - labelname: inspur
      type: gauge

  - name: serverCPUInfoPresent  #CPU当前在位状态
    oid: 1.3.6.1.4.1.37945.2.1.1.1.1.1.3
    type: DisplayString
    help: The serverCPUInfoPresent of this conceptual row. - CPU当前在位状态
    indexes:
    - labelname: inspur
      type: gauge

  - name: serverRaidDiskInfoVolumeraidLevel  # raid卡类型
    oid: 1.3.6.1.4.1.37945.2.1.6.3.1.1.4
    type: DisplayString
    help: serverRaidDiskInfoVolumeraidLevel of this conceptual row. - raid卡类型
    indexes:
    - labelname: inspur
      type: gauge

  - name: serverVoltageStatus #电压sensor健康状态
    oid: 1.3.6.1.4.1.37945.2.1.2.2.1.1.3
    type: gauge
    help: The serverVoltagestatus of this conceptual row. - 电压sensor健康状态 1表示正常
    indexes:
    - labelname: inspur
      type: gauge
    enum_values:
      0: N/A
      1: Normal
      2: Warning
      3: Critical
          
          
  - name: serverTemperatureSensorStatus #温度sensor的健康状态
    oid: 1.3.6.1.4.1.37945.2.1.2.1.1.1.3
    type: gauge
    help: The serverTemperatureSensorStatus of this conceptual row. - 温度sensor的健康状态 1表示正常
    indexes:
    - labelname: inspur
      type: gauge
    enum_values:
      0: N/A
      1: Normal
      2: Warning
      3: Critical
          
          
  - name: serverFanSensorStatus #风扇转速状态
    oid: 1.3.6.1.4.1.37945.2.1.2.3.1.1.3
    type: gauge
    help: The serverFanSensorStatus of this conceptual row. - 风扇转速状态 1表示正常
    indexes:
    - labelname: inspur
      type: gauge
    enum_values:
      0: N/A
      1: Normal
      2: Warning
      3: Critical
         

  - name: serverMemoryStatus #内存监控
    oid: 1.3.6.1.4.1.37945.2.1.2.5.1.1.3
    type: gauge
    help: The serverMemoryStatus of this conceptual row. - 内存监控 1代表正常
    indexes:
    - labelname: inspur
      type: gauge
    enum_values:
      0: N/A
      1: Normal
      2: Warning
      3: Critical        
          
          
  - name: serverPowerSupplyStatus #电源power
    oid: 1.3.6.1.4.1.37945.2.1.1.6.1.1.9
    type: gauge
    help: The serverPowerSupplyStatus of this conceptual row. - 电源power 1代表正常
    indexes:
    - labelname: inspur
      type: gauge
    enum_values:
      0: N/A
      1: Normal
      2: Warning
      3: Critical       
          
  - name: serverFrontHDStatus #前置物理磁盘健康状态
    oid: 1.3.6.1.4.1.37945.2.1.3.1.1.1.4
    type: DisplayString
    help: The serverFrontHDStatus of this conceptual row. - 前置物理磁盘健康状态 Normal代表正常
    indexes:
    - labelname: inspur
      type: gauge


  - name: serverDriveSlotStatus #硬盘健康状态信息(驱动器插槽)
    oid: 1.3.6.1.4.1.37945.2.1.6.2.1.1.9
    type: DisplayString
    help: The serverDriveSlotStatus of this conceptual row. - 硬盘健康状态信息 Normal代表正常
    indexes:
    - labelname: inspur
      type: gauge
    enum_values:
      0: 0-N/A
      1: Normal
      2: Warning
      3: Critical


  - name: serverRaidLogicDiskInfoStatus #Raid卡健康状态信息
    oid: 1.3.6.1.4.1.37945.2.1.6.3.1.1.2
    type: DisplayString
    help: The serverRaidControllorStandardStatus of this conceptual row. - Raid卡健康状态信息 Optimal代表正常
    indexes:
    - labelname: inspur
      type: gauge

  - name: serverSystemNICStandardStatus #网卡监控
    oid: 1.3.6.1.4.1.37945.2.1.2.14.1.1.5
    type: DisplayString
    help: The serverSystemNICStandardStatus of this conceptual row. - 网卡健康状态信息 Normal代表正常
    indexes:
    - labelname: inspur
      type: gauge

  version: 3
  max_repetitions: 25
  retries: 3
  timeout: 60s
  auth:
    community: 123456
    security_level: authPriv
    username: sysadmin
    password: rootuser
    auth_protocol: MD5
    priv_protocol: DES
    priv_password: rootuser
```

### 验证 snmp exporter

```bash
curl http://localhost:9116/snmp?module=if_mib,arista_sw&target=192.0.0.8
```

## prometheus 采集

```yml
  - job_name: 'Inspurserver'
    scrape_interval: 60s
    scrape_timeout: 60s
    scheme: http
    file_sd_configs:
      - files:
        - /data/prometheus/conf.d/inspur_server.yml
        refresh_interval: 30s
    metrics_path: /snmp
    params:
      module: [Inspur]
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: 10.200.4.64:9130 

  - job_name: 'h3cswitch'
    scrape_interval: 60s
    scrape_timeout: 60s
    scheme: http
    file_sd_configs:
      - files:
        - /data/prometheus/conf.d/h3c_switch.yml
        refresh_interval: 30s
    metrics_path: /snmp
    params:
      module: [H3C]
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: 10.200.4.64:9131
```

具体的机器配置文件在： `/data/prometheus/conf.d/inspur_server.yml`

```yml
- targets: ['100.200.1.23']
  labels:
    app: "lvs01"
    addr: "100.200.1.23"
    env: prod
    dept: hardware
    project: "hardware"
    ip: "172.16.1.11"
    type: "hardware"
    hardware: "server"
    
- targets: ['100.200.1.24']
  labels:
    app: "lvs02"
    addr: "100.200.1.24"
    env: prod
    dept: bi
    project: "bi"
    ip: "172.16.1.12"
    type: "hardware"
    hardware: "server"
```