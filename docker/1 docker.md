# docker

（从使用的角度去区分，安装、便捷、快速）

它是轻量级，更加细粒度，可以直接运行在宿主硬件上，进程级别。

https://www.zhihu.com/question/48174633

![image-20201005115844004](img\image-20201005115844004.png)

隔离级别：虚拟机需要在宿主操作系统虚拟一个操作系统，而容器直接运行在宿主操作系统，进程级别。

系统资源：一个需要操作系统，一个是进程，所需资源必然更少。

启动时间：同样，进程的启动时间更快。

镜像：虚拟机的镜像很大，而容器的镜像是分层的，基础容器是公用的。

# 容器的隔离

1. linux的命名空间

   使得每个进程只能看到它自己的系统视图（文件、进程、网络接口、主机名）

   namespces：做隔离，存在以下类型的命名空间：pid,net,ipc,mnt,uts

![image-20220411115823527](E:\dailynote\docker\img\image-20220411115823527.png)

1. linux控制组

   限制进程能使用的系统资源（内存、CPU、网络带宽）

   Control groups（cgroups）：做资源限制

# docker安装

https://docs.docker.com/engine/install/centos/

https://docs.docker.com/installation/windows （麻烦不推荐，docker桌面来着）

# 底层技术支持

linux 命名空间

linux控制组

Union file systems：Container和image的分层

# 可移植限制

cpu是x86创建的镜像，不能运行在arm架构的机器上。

# 镜像

镜像的构建过程不是docker客户端进行的，而是docker的守护进程。docker客户端和docker守护进程可以分开，如果包含大量大文件同时守护进程不在本地运行，上传会花费更多的时间。

# Docker Image 

1. 文件和meta data的集合
2. 分层的，每一层都可以添加改变删除文件，成为一个新的image
3. 不同的image可以共享相同的layer
4. image本身也是read-only的创建一个base image

## 创建镜像

### 1 commit

```shell
docker run -it <imagename>  # 用镜像运行容器，-i 确保输入流保持开放，-t分配一个伪终端（tty）

echo test # 在容器里面生成test文件

exist  # 退出容器

docker commit  -a "作责信息" -m "提交信息" -p(提交时暂停容器运行) <containerId> <image>:<tag>

docker image ls -a # 查看是否生成镜像 
```

### 2 基于本地模板导入

![image-20211113145942043](img\image-20211113145942043.png) 

### 3 基于dockerfile

创建一个image（2中方式，通过bulid dockerfile ，通过pull）

1. 有可执行文件
2. 编写Dockerfile
3. docker build -t xx .  //xx表示给这个image命名
4. docker image ls -a

## 指令

```js
docker image ls  //image列表

docker pull ubuntu:14.04  //从docker hub拉取

docker history id  //查看这个image的各层

docker image bulid -t xx .  //会在当前目录查找一个Dockerfile文件，然后构建镜像，名字是xx

docker rmi xx //删除某个image，如果有多个标签指向同一个镜像源，则只是删除标签，只剩一个标签时，则会删除镜像源

docker run -t -i <imagename>   [指令]   //运行某个镜像
 
docker tag hello-world:latest test:latest   // 新建一个镜像test，与hello-world执向同一个镜像源

docker inspect  <imagename>  //查看某个镜像的具体信息
    
docker serach <imagename>  //搜索可用的镜像
```

## 存入存出

略

## 其他	

​	构建是由docker守护进程执行的。docker客户端和守护进程不要求在同一台机器上。比如在window上建立的虚拟机，在虚拟机上构建。那么客户端是在宿主机器上，守护进程在虚拟机上。客户端先将文件上传到虚拟机的守护进程，然后再构建。因此如果文件过大，会花费更多时间。

​		镜像不是一个很大的二进制块，而是分层的。因此基础镜像只会被存储一次。可以被公用。docker只会去下载未被存储的分层。

​		构建时，Dockerfile的每一行，都会是一层。构建过程：

![

](img\image-20201011105959085.png)

# Docker Container

## docker run

docker run 等于docker create  + docker start

![image-20211113153046836](img\image-20211113153046836.png)

docker run -it  \<imageName>  进入容器后，exit退出，容器就终止了。因为没有继续运行的必要。

## 守护态运行

`docker run -d ubuntu /bin/sh -c "while true;do  echo hello world;sleep 1;done"`

-d 以守护态运行镜像ubuntu  ，在启动的容器内 以sh 执行命令 "xxx"

`docker logs` 查看运行的容器输出内容

## 容器启动终止

`docker stop xxx -t <秒>`   默认10s

会先向容器发送sigterm信号，过10s 再发送sigkill信号终止容器。

`docker start <contain>` 将终止的容器再次启动

`docker restart <contain>`

## 进入守护态的容器信息

1. `docker attach <containerName>`

attach ，多个窗口同时attach一个容器时，所有窗口同步显示，且某个窗口因为命令阻塞，其他窗口也无法显示。

2. `docker exec -ti <container> /bin/bash`
3. nsenter 工具 （略）

## 删除容器

![image-20211113164356981](img\image-20211113164356981.png)

## 导入导出

略

## 指令

```js
docker ps -a 等同 docker container ls -a //列举所有容器，包括当前和已经结束的，已结束也会对镜像存在引用

docker run -d --name=xx <image> //通过image后台运行一个container，并指定名字

docker run -it <image>  //t表示docker分配伪终端绑定到容器的标准输入上，i表示保持标准输入开启，其结果为在当前系统上就能操作容器的系统

docker container commit //create a new image

docker rm $(docker ps -qa) //删除所有不在运行地容器

docker run -d  --name web-container -p 8082:8080 web //<image> 必须放在最后
```

# Docker Hub

仓库（略）

# 数据卷

在容器与主机，容器与容器之间共享数据。

![image-20211113165625611](img\image-20211113165625611.png)

## 三种数据卷

- volume，普通卷，映射在主机的/var/lib/docker/volumes
- bind，绑定卷，映射主机指定目录下
- tmpfs，临时卷，只存在内存中

## 示例

![image-20211120155245041](img\image-20211120155245041.png)

在主机/home/test 新建一个test.js 文件。 /home/test 会被挂载到容器的/opt/webapp ，然后启动有node的容器，执行 node /opt/webapp/test.js  ，通过 docker logs xx ，如果有执行test.js打印出来的内容，则挂载没问题

`docker run -d -P --name web -v /home/test:/opt/webapp node node /opt/webapp/test.js`

挂载卷的容器目录会自动创建，默认权限是rw.

## 普通卷

```js
//创建数据卷，在/var/lib/docker/volumes
docker volume create -d local test
```

## 数据卷容器

用作数据备份，数据恢复

创建容器dbdata  ，有一个数据卷/dbdata

```js
docker run -it -v /dbdata --name dbdata ubuntu
```

其他容器挂载这个dbdata的数据卷/dbdata

```js
docker run -it --volumes-from dbdata --name db1 ubuntu
```

# 端口映射与容器互联

## 端口映射

使用 -P 或 -p

-P ，docker会随机映射一个49000~49900的宿主端口到内部容器开放的网络端口。docker ps查看

-p，可以指定端口. `-p 5000:80` 将宿主机器的5000端口映射到容器的80端口，多次使用可以绑定多个端口

- 映射指定地址指定端口 `-p 127.0.0.1:5000:5000`
- 映射指定地址任意端口`-p 127.0.0.1::5000`
- 指定udp端口`-p 5000:5000/udp`
- 查看端口配置：`docker port nostalgic_morse  <port>`



容器有自己的内部网络和ip地址，可通过docker container inspect  \<containerId>

容器名是唯一的，如果重复，则需要docker rm删除之前的.

## 容器互联

互联是通过更新容器环境变量，host文件 来实现两个容器之间建立虚拟通道，而不用映射端口到宿主机器上。

`docker run -d -P --name web --link db:db training/webapp python app;py`

`--link name:alias`   name是要链接的容器名称，alias是别名

将web容器与db容器互联，web容器可以内部直接访问db容器。具体：P66

# 创建一个Docker image（3种方法）

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

COPY优于ADD，因为ADD还有额外的解压功能。

都是基于dockerfile所在目录（源路径为宿主机器）

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

![image-20211128111635412](img\image-20211128111635412.png)

entrypoint:

和cmd一样，是执行shell和exec命令的。

两者结合，entrypoint执行命令，而cmd 提供默认值，或者在命令行提供（docker run -it < image > --vm 1 --xx x --xx x）如下：

```js
ENTRYPOINT ["/usr/sbin/nginx"]
CMD ["-h"]
```

容器启动执行 nginx -h 如果docker run 指定参数，那么nginx -xx

### 合并

```js
ENTRYPOINT ["/usr/sbin/nginx"]
CMD ["-h"]
```

cmd 用来给entrypoint执行的语句提供参数的。它可以被docker run   -d -it  image   xx 时指定的参数（xx）所覆盖。



### shell格式和exec格式

shell 和exce的区别

https://www.jianshu.com/p/dd7956aec097

- shell 命令会创建子进程操作，操作完返回当前进程，上下文不会被子进程的操作内容所影响
- source或. /xx.sh ，在当前上下文执行，不会产生新的进程，当前上下文会受执行内容影响。
- exec，一个新的command进程，替换当前shell进程，但是pid不变，执行完直接退出，不会回到之前的shell

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