# docker

它是轻量级，更加细粒话，可以直接运行在宿主硬件上，进程级别。

https://www.zhihu.com/question/48174633

![image-20201005115844004](img\image-20201005115844004.png)

隔离级别：虚拟机需要在宿主操作系统虚拟一个操作系统，而容器直接运行在宿主操作系统，进程级别。

系统资源：一个需要操作系统，一个是进程，所需资源必然更少。

启动时间：同样，进程的启动时间更快。

镜像：虚拟机的镜像很大，而容器的镜像是分层的，基础容器是公用的。

# docker安装

https://docs.docker.com/engine/install/centos/

# 底层技术支持

namespces：做隔离，存在以下类型的命名空间：pid,net,ipc,mnt,uts

Control groups（cgroups）：做资源限制

Union file systems：Container和image的分层

# Docker Image 

1. 文件和meta data的集合

2. 分层的，每一层都可以添加改变删除文件，成为一个新的image

3. 不同的image可以共享相同的layer

4. image本身也是read-only的创建一个base image

创建一个image（2中方式，通过bulid dockerfile ，通过pull）

1. 有可执行文件
2. 编写Dockerfile
3. docker build -t xx .  //xx表示给这个image命名
4. docker image ls

```js
docker image ls  //image列表

docker pull ubuntu:14.04  //从docker hub拉取

docker history id  //查看这个image的各层

docker image bulid -t xx .  //会在当前目录查找一个Dockerfile文件，然后构建镜像，名字是xx

docker rmi xx //删除某个image
```

​		构建是由docker守护进程执行的。docker客户端和守护进程不要求在同一台机器上。比如在window上建立的虚拟机，在虚拟机上构建。那么客户端是在宿主机器上，守护进程在虚拟机上。客户端先将文件上传到虚拟机的守护进程，然后再构建。因此如果文件过大，会花费更多时间。

​		镜像不是一个很大的二进制块，而是分层的。因此基础镜像只会被存储一次。可以被公用。docker只会去下载未被存储的分层。

​		构建时，Dockerfile的每一行，都会是一层。构建过程：

![image-20201011105959085](img\image-20201011105959085.png)

# Docker Container

通过image创建

在image layer之上建立一个container layer

类比面向对象：类和实例

```js
docker container ls -a //列举所有容器，包括当前和已经结束的

docker run -d --name=xx <image> //通过image后台运行一个container，并指定名字

docker run -it <image>  //交互式运行，好像要加/bin/bash

docker container commit //create a new image

docker rm $(docker ps -qa) //删除所有不在运行地容器

docker run -d  --name web-container -p 8082:8080 web //<image> 必须放在最后
```

# Docker 的Command

查看命令

docker --helper

docker container

docker image

# 创建一个Docker image（两种方法）

在centos的image下，生成一个带有vim功能的centos

1. 通过image ，run一个conotainer，然后yum install vim后（增加了vim功能后），结束后，退出，再通过commit ，生成一个具有vim功能的image
2. 通过DockerFile去build一个，中间会生成一个临时container。
3. 直接从docker hub pull。

建议通过dockerfile去生成image

# Dockerfile的语法

https://docs.docker.com/engine/reference/builder/#from 

## FROM

尽量使用官方的image

```js
FROM scrath //制作base image
FROM centos //使用base image
FROM unbuntu:14.04 //
```

## LABEL

声明一些用户信息。类似于注释

```js
LABEL maintainer="hjy@xx.com"
LABEL version="1.0"
```

## RUN

执行shell命令

每run一次，都会在image加一层(image layer)。避免多层，将多条命令组合起来，使用&&和\美观

```js
RUN yum update && yum install -y vim \ python-dev #反斜线换行。
RUN apt-get update && apt-get install -y perl\
pwgen --no-install-recommends && rm -rf \
/var/lib/apt/lists/*                       #注意清理cache
RUN /BIN/BASH -c 'source #HOME/.bashrc;echo $HOME'
```

## WORKDIR

设定工作目录

尽量使用WORKDIR 而不使用RUN cd ，尽量使用绝对路径，更清晰

```js
WORKDIR /root //到根目录的root文件夹下，如果没有则创建
WORKDIR /test 	// 到/root/test文件夹下
RUN pwd 		//输出当前路径/root/test
```

## ADD and COPY

```js
ADD hello /root //拷贝hello到root目录下
ADD hello.tar.gz /root //拷贝hello到root目录下，并且会解压
COPY hello /root //拷贝hello到root目录下
```

COPY由于ADD，因为ADD还有额外的解压功能。

获取远程文件则只能使用RUN curl xx或者RUN wget xxx。

## ENV

设置常量，再后面可以通过$引用，好像是会在容器主机的环境变量里面。

```js
ENV MYSQL_VERSION 5.6
RUN apt-get install -y mysql-server = "${MYSQL_VERSION}" \ &&
    rm -rf /var/lib/apt/lists/* 
```

## VOLUME and EXPOSE

存储和网络

volume 某个目录下的文件都持久化到宿主机器 (第三讲)

expose 

The `EXPOSE` instruction does not actually publish the port.  To actually publish the port when running the container, use the `-p` flag on `docker run` to publish and map one or more ports, or the `-P` flag to publish all exposed ports and map them to high-order ports.

expose的作用，docker run -P ，会将expose的端口映射到主机的随机端口上。

## CMD and ENTRYPOINT

cmd

The *exec* form is parsed as a JSON array, which means that you must use double-quotes (“) around words not single-quotes (‘).

**The main purpose of a `CMD` is to provide defaults for an executing container**

**If `CMD` is used to provide default arguments for the `ENTRYPOINT` instruction, both the `CMD` and `ENTRYPOINT` instructions should be specified with the JSON array format.**

如果定义多个CMD,只有最后一个会执行。

如果docker run制定了其他命令，CMD命令被忽略。docker run -it image /bin/bash ,这样，那这个image如果有CMD，也不会被执行。



entrypoint:

和cmd一样，是执行shell和exec命令的。



两者结合，entrypoint执行命令，而cmd 提供默认值，或者在命令行提供（docker run -it < image > --vm 1 --xx x --xx x）如下：

```js
ENTRYPOINT ["/usr/sbin/nginx"]
CMD ["-h"]
```

容器启动执行 nginx -h 如果docker run 指定参数，那么nginx -xx

### shell格式和exec格式

shell格式

```js
RUN apt-get install -y vim
CMD echo "hello docker"
ENTRYPOINT echo "hello docker"
```

exec格式

```js
RUN ["apt-get","install",'-y','vim']
CMD ["/bin/echo","hello docker"]
ENTRYPOINT ["/bin/echo","hello docker"]
```

这种格式不是shell格式，所以无法获取env设置的值，必须再shell下才可以

可以改成：["/bin/bash","-c","echo $name"] ，name是env设置的，这种就是以exec格式，执行shell语句。

# 贡献image

pull image不需要在docker hub上有账号，不过push image 则需要

注意：image命名： docker hub的账号名/xx

docker login

docker image push image命名:tag

上面这种直接上传image不建议。最好是docker hub和git hub关联，然后在git hub维护dockerfile，docker hub会帮我们build

搭建一个私有的registry 

# Dockerfile实战

1.编写dockerfile，把要运行的文件通过copy，拷贝到container里去。通过expose暴露端口

2.docker build ，会列出每步的img，如果出错，可以通过docker run imgId 到系统去查看。

3.docker run

# 操作container

进入到后台运行的container中：

docker exec -it  < containerId >  /bin/bash

```js
-i 确保标准输入流保持开放，
-t 分配一个伪终端
```

在宿主机器使用top，和容器内部使用top。

在宿主机器会发现容器的进程，这也证明了运行在容器的进程是运行在主机操作系统上的，不过id不同，因为容器使用独立的pid linux命名空间并且有独立的序列号，完全独立于进程树。

停掉container：docker stop < containerId >  

启动：docker start < containerId >

# 容器资源限制

docker run --help

--memory bytes 200M

--memory-swap bytes 200M

内存大小是以上两个之和

--cpu-shares 10 权重，占比，而不是占用多少个cpu，

docker run -p 80:80 把本地的80端口映射到容器的80端口