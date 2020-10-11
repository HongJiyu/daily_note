# Docker 持久化数据的方案

基于本地文件系统的Volume。可以在执行Docker create或Docker run时，通过-v参数将主机的目录作为容器的数据卷。这部分功能便是基于本地文件系统的volume管理。

基于plugin的Volume，支持第三方的存储方案，比如NAS，aws。

# Volume的类型

1. 受管理的data Volume，由docker自动创建并管理。

2. 直接设置container中要持久化的目录和host主机绑定，由用户指定。



# data Volume

在dockerfile使用了volume

![image-20201003220030343](img\image-20201003220030343.png)

如上图，mysql的dockerfile，就指定了这个container的/var/lib/mysql目录下，会被持久化。

接下来，run这个image，docker会自动创建一个volume，然后通过：

```js
docker volume ls //查看所有的volume，会多出一个volume，即使container被删除了，volume也不会被删除。
docker volume inspect  <volume name> //查看这个volume的信息，挂载在主机的具体位置
docker volume rm <volume name> //删除掉
```

这个docker volume自动生成，命名不友好。

自定义命名：

```js
docker run -d -v mysql:/var/lib/mysql -name mysql1 -e MYSQL_ALLOW_EMPTY_PASSWORD=true mysql
docker volume inspect mysql //查看生成的volume信息
```

-d 后台运行

-name 这个container的别名

-e 允许mysql空密码，环境变量

mysql image名

-v mysql:/var/lib/mysql 指这个mysql image里面的dockerfile中值是/var/lib/mysql 的volume的别名为mysql。可以被复用（验证data volume生效）。

# Bind mouting

docker run -v $(pwd):/xx/xx/xx < image >

把本地当前路径映射到容器的/xx/xx/xx目录，也就是这两个文件夹是**互通的，同步的**。

# 区别

可以看到一个由docker管理，是建立一个volume；一个是指定一个host路径：

docker run -d -v mysql:/var/lib/mysql -name mysql1 -e 

docker run -v $(pwd):/xx/xx/xx < image >

mysql是一个volume名，而${pwd}是host主机的路径 ，区分：是否带有 / 开头

https://www.jianshu.com/p/ef0f24fd0674

# 搭建一个wordpress

在docker 找一个wordpress和mysql的image，然后运行即可。

# docker compose

一个工具

docker-compose --version  看版本，如果没有就需要安装。

docker-compose 查看命令

https://docs.docker.com/compose/compose-file/

支持对多个容器统一管理，使用version3，能够支持多机。

- **services**
  - 一个service代表一个container。
  - 启动类似docker run，可以指定network和volume。

```js
version: '3'

services:

  wordpress:
    image: wordpress
    ports:
      - 8080:80
    depends_on:
      - mysql
    environment:
      WORDPRESS_DB_HOST: mysql
      WORDPRESS_DB_PASSWORD: root
    networks:
      - my-bridge

  mysql:
    image: mysql:5.7
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: wordpress
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - my-bridge

volumes:
  mysql-data:

networks:
  my-bridge:
    driver: bridge
```

启动：docker-compose -f  docker-compse.yml up   /   docker-compose up

查看容器：docker-compose ps

查看image：docker-compose images

docker network ls

# docker compose 负载均衡

```js
  lb:
    image: dockercloud/haproxy  //使用这个代理来做负载均衡
    links:
      - web  //链接这个服务
    ports:
      - 80:80
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock 
```

# docker swarm

三台虚拟机：

Vagrant+Virtualbox

Docker Machine + Virtualbox

paly with docker

```js
docker swarm init --advertise-addr=xxx //在某一台虚拟机上初始化

其他虚拟机按照提示加入到该集群

docker node ls  //查看节点
```

在swarm模式下，就不用docker run，而使用docker service，因为创建的服务不一定

会在本地。

```js
docker service run 
docker service ls //查看整体情况
docker service ps <servicename> //可以看出它是属于哪个节点的服务
//将某个服务部署到多个节点，指定后，即使某个被docker rm -f了，swarm模式也会重起一个，不过不确定会在哪个节点上。 
docker service scale <servicename>=5
docker service rm <servicename> //删除掉这些服务
```

# network overlay

在swarm模式下，wordpress和mysql可能会创建在不同节点上。为了彼此之间能通讯，先创建这么一个网络，然后启动服务时指定这一个网络。swarm会延迟同步network到所有节点。

```js
docker network create -d overlay demo  //创建一个命名为demo的overlay网络
docker network ls //查看
docker service create --network demo ....
```

# dns服务发现

使用docker-compose 启动多个服务时，可以通过设置同一个network来进行通讯。

使用swarm时，也需要创建一个overlay网络。

其实都是通过dns实现的。

**Routing Mesh的两种体现**

1. Internal - **swarm**：Container和Container之间的访问通过overlay网络（通过虚拟ip即vip）
   1. nslookup  域名 	可以得到一个ip。而这个ip只是一个虚拟的。
   2. nslookup tasks.域名  	得出的才是真的。
   3. 用docker service scale 建立多个，那么会自动做负载的。

2. Ingress - 如果服务有绑定接口，则此服务可以通过任意的swarm节点的相应接口访问。

# docker stack

通过swarm模式，通过docker-compose文件去部署应用。

文件中，不能通过build image，只能引用docker hub

docker-compose  version 3  added ：deploy

https://docs.docker.com/compose/compose-file/#deploy

在swarm使用docker-compose，也就是将服务部署在多个节点，而不是单个节点。

```js
 docker stack deploy <stackname> --composefile=docker-compose.yml
```



# docker secret manager

生成密码，然后指定某些container可以看到，也就是这些container可以获取到这密码

1. secret management 存在swarm manager节点的raft database里。

2. secret可以assign给一个service，这个service就能看到这个secret。

3. 在container内部的secret看起来像文件，但实际是在内存中。

```js
docker secret create <name> <fileName> //通过文件生成
echo "123" | docker secret create <name> -  //设置密码为123
docker secret ls   //查看密码列表
docker secret rm <name> //删除
docker service create --secret <secretname> <image> //如上第二点，在容器的 /run/secrets/secretname 可以找到这个密码
```

为mysql创建密码

```js
docker service create --name db --secret my-pw -e MYSQL_ROOT_PASSWORD_FILE=/run/secrets/my-pw mysql
```

--secret指定了这个mysql容器可以看到在/run/secrets/下看到my-pw的密码。

-e 指定了密码是在/run/secrets/my-pw的内容

# docker secret 在docker stack的用法

```js
mysql:
	image:mysql
    secrets:
	 - my-secret  //提前创建过。指定后这个mysql容器在/run/secrets/my-secret文件内容有密码
	environment:
		MYSQL_ROOT_PASSWORD_FILE:/run/secrets/my-secret //密码使用这个里的文件的内容
```

# docker service 的更新

docker service  update

```js
docker service update --image <image> <containername>
docker service update --publish-rm 8080:5000 --publish-add 8088:500 web
```

docker stack deploy，更新修改compose文件



# 总结

1.image，通过dockerfilebuild、直接从docker hub pull。

2.container

```js
docker run //run一个image
docker-compose -f  docker-compse.yml up //对服务进行批量，只在一台机器上。
docker swarm 集群后使用docker service创建服务。
docker stack deploy，同样在swarm下又使用compose文件。
```

