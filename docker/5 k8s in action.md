小规模监控：weavescope。

集群监控：heapster

# 搭建一个应用，并对外服务
## 1.创建一个ReplicationController

创建它，它用于去创建pod实例

```js
kubectl run kubia --image=luksa/kubia --port=8080 --generator=run/v1 
//--generator废弃了， kubectl run好像也不能用了，一直报错
//--image=luksa/kubia 指定要运行的容器镜像
//--port=8080 告诉k8s正在监听8080端口
//--generator 让k8s创建一个ReplicationController
```

由kubectl 向主节点的rest api发起请求，然后主节点创建pod，由调度器调度到从节点，然后再告诉docker去运行镜像。

![image-20201011152309129](img\image-20201011152309129.png)

### Pod

每个pod就像一个个独立的逻辑机器，拥有自己的ip、主机名、进程等。pod运行着一个独立的应用程序。应用程序可以是单个进程，运行再当个容器中，也可以是一个著应用进程或其他支持进程，每个进程都在自己的容器中运行。

![image-20201011154749665](img\image-20201011154749665.png)

```js
kubectl get pods
```

## 2.访问web应用

pod有自己的ip地址，但是这个地址是集群内部的，需要通过服务对象公开他。要创建一个特殊的loadbalancer类型的服务。因为一个常规服务（ClusterIP服务），比如pod，它只能从集群内布访问，通过创建loadBalancer类型的服务，将创建一个外部负载均衡，可以通过负载均衡的公共ip访问pod。

```js
kubectl expose rc kubia --type=LoadBalancer --name kubia-http
kubectl get services
```

注意：minikube不支持loadBalancer类型服务，因此服务不会有外部ip。但是可以通过外部端口访问服务。

使用minikube，可以

```js
minikube service bubia-http //获取访问服务的ip和端口
```

## 3.总结

![image-20201011161902896](img\image-20201011161902896.png)

只运行了两条语句：创建ReplicationController、service。

ReplicationController会去管理pod，而service会创建一个恒久不变的ip对外。

## 4.水平扩展

```js
kubectl get replicationcontrollers //查看
kubectl get rc
kubectl scale rc <rcname> --replicas=3 
```

![image-20201011165256750](img\image-20201011165256750.png)

## 5.查看pod在哪些节点上

```js
kubectl get pods -o wide
```

# pod

## 为什么会有pod

​		为什么不把所有进程放在一个单独的容器里？

​		容器被设计为每个容器只允许一个进程（除非进程本身产生子进程）。如果容器运行多个不相关的进程，要保持所有进程运行、管理他们的日志等将是我们的责任。例如：我们需要包含一种在进程奔溃时能够自动重启的机制。同时这些进程都将记录到相同的标准输出中，而我们很难确定每个进程分别记录了什么。

​		由于不能将多个进程聚集在一个单独的容器，因此需要一个更高级的结构将容器绑定在一起，将他们作为一个单元进行管理，这就是pod背后的根本原理。

##  了解pod

​		同一个pod中的容器部分隔离，共享相同的主机名和网络接口，能够ipc进行通讯。但是容器的文件系统时完全隔离的，可以使用volume的kubenetes资源来共享文件目录。

### pod内共享ip和端口

因为一个pod中的容器运行在相同的network命名空间，所以他们共享ip地址和端口。因此要注意一个pod内部的容器，不能够占用同一个端口。

### pod之间的网络

k8s集群中所有的pod都在同一个共享网络地址空间中，因此每个pod都可以通过其他pod的IP地址实现互相访问。

![image-20201011172724215](img\image-20201011172724215.png)

### 通过pod管理容器

容器是否需要放在一个pod，却决于业务。

他们需要一起运行还是可以在不同的主机上运行？

他们代表的是一个整体还是相互独立的组件？

他们必须一起进行扩容还是可以分别进行？

![image-20201011173957087](img\image-20201011173957087.png)

在一个pod上运行多个容器的场景：

pod中的主容器可以是一个仅仅服务于某个目录中的文件的web服务器，而另一个容器则定期从外部源下载内容并将其存储在web服务器目录中。（k8s in action 上说的，没见过）

# 创建pod

pod文件的基本构成

api版本、资源类型、metadata、spec、status。

![image-20201011174825094](img\image-20201011174825094.png)

创建pod时，永远不需要提供status部分。

status：包含运行中的pod的当前信息，例如pod所处的条件、每个容器的描述状态以及内部ip和其他基本信息。

node-web.yaml:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web
spec:
  containers:
  - image: hongjiyu/node-web  #docker hub上的一个镜像，监听8080端口
    name: node-web
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web
spec:
  containers:
  - image: hongjiyu/node-web  //docker hub上的一个镜像，监听8080端口
    name: node-web
	ports:
	- containerPort: 8080
	  protocol: TCP
```

以上两个配置文件，下面的多了端口的配置，其实是不需要的。

![image-20201011205006832](img\image-20201011205006832.png)

```js
kubectl create -f node-web.yaml
```

## 查看容器

好像没法查看pod的容器，只能通过yaml看这个pod有什么容器。

```js
docker container ls -a //看不到k8s构建的容器
```



## 查看日志

日志的生命周期和pod一起的，除非存储到中心存储中。每天或每次日志达到10MB，容器日志会自动轮替，kubectl logs只显示最后一次轮替的日志条目。

```js
kubectl logs <podname> //如果pod只有一个容器，那么查看日志非常简单，如果pod有多个容器，那么必须指定容器名。
kubectl logs <podname> -c <containername> //podname和containername都再yaml上有
```



## 向pod发起请求

前面说了pod只是与pod之间互通，但是pod与主机不是互通的，而且前面通过service可以让主机与pod互通。但是这里仅仅作为简单调试，采用另一种方法。

宿主机器开启两个终端

终端1：

```js
kubectl port-forward <podname> 8888:8080
```

终端2：

```js
curl localhost:8888
```

开启端口转发，简单说就是将宿主主机的8888端口转发到podname的8080端口。

![image-20201011210230356](img\image-20201011210230356.png)

# 标签组织pod

标签用于明确选择，可以去选择具有确切标签的资源。（这是通过标签选择器完成的）

![image-20201011211306780](img\image-20201011211306780.png)

![image-20201011211249857](img\image-20201011211249857.png)

## 创建pod时指定

标签是键值对的形式，在原有的yaml文件中metadata下添加labels即可。

```yaml
metadata:
  labels:
    env: prod
    creation_methos: manual  
```

显示：

```js
kubectl get pods --show-labels //显示pod和旗下的标签
kubectl get pods -L env,creation_methos //只显示这两个标签
```

## 修改标签

```js
kubectl label pods <podname> key=value //添加标签
kubectl label pods <podname> key=value --overwrite //修改标签
```

# 通过标签选择器列出pod子集

