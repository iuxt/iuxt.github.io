```bash
[ `cat /etc/sysctl.conf |grep fs.may_detach_mounts|wc -l` == 1 ]||echo "fs.may_detach_mounts = 1" >> /etc/sysctl.conf
echo 1 > /proc/sys/fs/may_detach_mounts
```