# 配置桥接

一开始是装了ubuntu 20的，看了公司的源，没有20的。就重装了16的。16的选择中文语言导致后面错误。

内网机可以访问到内部的镜像，而内网机安装的虚拟机访问不到。无法apt-get update。

查询到需要使用桥接，看了教程：

以下是在**unbutu 16.04**下的配置

问题：编辑-虚拟网络编辑器-找不到桥接的网卡。无视。

```shell
配置：
vim /etc/network/interfaces

iface enp3s inet static  //修改
address 你要配置成的IP //添加
netmask 看情况 //添加
gateway 看情况  //添加

vim /etc/resolvconf/resolv.conf.d/base
添加
nameserver 看情况  //dns

```

重启即可

# 配置root无法通过ssh连接

```shell
vi /etc/ssh/sshd_config
PermitRootLogin yes  //改为yes
```

