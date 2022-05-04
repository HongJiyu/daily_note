# 网络

校园网 可能只有几个公有ip，而校园内部的机器访问公有ip时，涉及到nat网络地址转换。
私有ip通过路由访问外网：由nat记录了某台私有机器的ip和端口，并转化为公有ip去访问外网。
私有ip通过路由接收数据：由nat查看要将数据返回给哪一太私有ip的端口。

# linux network namespace  

docker生成的容器，他们之间的地址能够互相ping通，和操作系统上的network namespace是类似的。以下讲linux的network namespace能够ping通的原理。

https://www.cnblogs.com/bakari/p/10613710.html

通过veth-pair 连通

网络命名空间：netns

网络命名空间test1的链路， ip netns exec test1 ip link

```js
ip netns list //网络命名空间列表

ip netns delete  xxx //删除某个网络命名空间

ip netns add xxx //添加网络命名空间

ip netns exec <network namespace name> ip a //查看本机的某个网络命名空间的ip

ip link //看链路层的状态

ip link set device down   //禁用指定接口

ip link set device up    //启用指定接口

ip link add veth-test1 type veth peer name veth-test2 //添加一对link，ip link查看

ip link set veth-test1 netns test1 //把上面添加的link中的一条添加到namespace为test1的。

ip link set veth-test2 netns test2 //把上面添加的link中的一条添加到namespace为test2的。

ip netns exec test1 ip addr add 192.168.1.1/24 dev veth-test1 //给网络命名空间为test1的链路为veth-test1的添加ip

ip netns exec test2 ip addr add 192.168.1.2/24 dev veth-test2 //给网络命名空间为test2的链路为veth-test2的添加ip

ip netns exec test1 ip link set dev veth-test1 up //让网络命名空间为test1的链路为veth-test1启动起来

ip netns exec test2 ip link set dev veth-test2 up //让网络命名空间为test2的链路为veth-test2启动起来
```

以上，linux两个network namespace 就能互相ping通了

# docker 的network

两个container如何ping通？

container又如何访问到外网的？

```js
docker network ls //docker的网络
docker network inspect bridge//查看在bridge网络的container
```

主机上会多出两个网卡 （docker0和xx，两者连在一起），同时xx负责和container的某个网卡互连形成veth-pair。

两个网卡连在一起验证：

```js
yum install bridge-utils

brctl show //查看网桥
```

再来一个容器：主机上会多出一个网卡xx，同时这个xx也和docker0连在一起，同时也和新的container互连形成veth-pair。因此两个container通过docker0链接起来了，所以能够ping通。

![image-20201005195647750](img\image-20201005195647750.png)

而能够访问外网，是因为多了一层nat，网络地址转化，所以也能够访问外网了。

## 其他网络

前面说的是bridge网络，还有host和none。`docker network ls`

none：孤立的，无法被访问。容器使用这个类型将没有ip`docker network inspect none`

host：没有自己的网卡，共享主机的网卡。

# 容器之间的link

场景：一个web container，一个sql container。web需要sql才能使用，所以需要先启动sql container，然后知道它的ip，然后才能启动web。

解决：给sql container一个命名，然后web 使用这个命名去link这个sql container，这样就没有先后顺序，也不需要使用ip去访问。

```js
docker run --link <other container name> <img>
```

--link 相当于给新建的容器增加了dns记录，也就是可以通过 ping xx 而不指定ip也能ping通。



在docker创建一个bridge。其实是在主机建立一个网桥

```js
docker network create -d bridge my-bridge
docker network ls
//同时查看主机的网桥，也会多了一个bridge。
brctl show
docker run --network my-bridge <img> //这时候这个container链接的就是my-bridge网桥

```

容器链接到其他的网络，一个容器可以链接多个网络

```js
docker network connect <networkname> <containername>
```

# 注意

由用户自己创建的bridge，然后关联多个container（docker network connect），那么这些container互通，同时可以使用container name也可以ping 通(不需要link)。

# 端口暴露

查看一个容器的ip：如果一个容器很多shell 命令都没有装，那么很难看懂。

```js
docker network  inspect <networkname>
```

docker run -p 80:8080 < img> //把主机的80端口映射到容器的8080

# 部署复杂的application

一个web，一个redis

web一个container，redis一个container

web 连redis，不写ip:3306的死方法，而是通过 containerName:3306 ，然后启动web时，通过link的方式即可。

# 多机器通讯

隧道 tunnel 

技术：vxlan

docker中的网络是 overlay

# 个人理解

docker 里面的network，应该是主机的网桥

# 疑问

container中，不属于同一个网络 --network xx ，则无法互连把，因为都是通过网络，在主机也就是网桥链接在一起的。（待实验）

