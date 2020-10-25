未托管的pod，k8s会监控pod里面的容器，在他们失败的时候重启容器。但是整个节点失败，那么节点上的pod丢失，也不会在新的节点上创建pod。除非pod是被托管的。

# 保持pod健康

k8s会对创建的pod（不管是托管还是非托管）进行监控管理，如果容器的主进程崩溃，会重启容器。

## 存活探针

k8s通过存活探针检查容器是否还在运行，可以为每个pod的每个容器单独指定存活探针。

- http get 探针：指定容器ip和端口，请求容器接口，如果状态码不是2xx或3xx，则探测失败。
- tcp 套接字探针，建立tcp连接，如果连接成功，则探测成功。
- exec 探针，在容器执行任意命令，并检查命令的退出状态码，为0则成功，其他状态码为失败。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web
spec:
  containers:
  - image: hongjiyu/node-web  #docker hub上的一个镜像，监听8080端口
    name: node-web
    livenessProbe: #探针
      httpGet:
      	path: /
      	port: 8080
```

该http探针会去访问容器的8080端口的/地址，以确定容器是否健康。

### 创建一个不健康的容器

创建一个不健康的容器，它被访问5次就会报错。然后再用探针去测试。

```yaml
-image : luksa/kubia-unhealthy
```

## 查看探针

```shell
kubectl describe pod <podName>
```

![image-20201013232110647](img\image-20201013232110647.png)

137表示进程被外部信号终止。128+9 ，9表示终止进程的信号编号。

探针的其他属性：

![image-20201013232315779](img\image-20201013232315779.png)

访问地址，容器启动后延迟多久开始探针，访问地址超时时间，访问周期，失败多少次后重启容器。

**注意**：一定要设置`initialDelaySeconds`使得容器启动后隔一段时间再开始探针，否则会出现容器中的服务还没启动完全，就开始探针。

```yaml
    livenessProbe: #探针
      httpGet:
      	path: /
      	port: 8080
      initialDelaySeconds: 15 #15s后
```

## 创建有效探针

探针要轻量，一定要能访问到，不消耗太多系统资源。因为探针cpu时间计入容器的cpu时间配额，进而导致主应用程序进程可用cpu时间减少。

## 探针小结

容器奔溃会重启，这任务由承载pod节点上的kubelet（不是kubectl）执行，control plane组件不会参与。

但是如果节点奔溃，且节点所在的pod是由controller托管的，那么control plane才会去为这些pod在新节点上创建。



# Replicationcontroller

ReplicationController会去托管pod。自动帮我们创建pod。

ReplicationController 会去处理当节点宕机，会将节点所在的pod，全部在新的节点创建新的复制集。

ReplicationController 的副本个数，标签选择器、模板可以随时修改，但是只有副本数量会影响现有的pod。

更改标签选择器，会使现有的pod脱离ReplicationController的控制。

ReplicationController.yaml

```yaml
apiVersion: v1
kind: ReplicationController
metadata:
  name: web-node
spec:
  replicas: 3
  selector:
    app: web
  template:
    metadata:
      labels:
        app:web
      spec:
        containers:
        - name:web-node-container
          image: luksa/kubia
          ports:
          - containerPort: 8080
```

使用到了标签选择器，找到 app为web的模板，让其复制集为3。

**注意**：在定义ReplicationController时可以不指定pod标签选择器，那么k8s会从pod模板提取。

根据yaml文件创建controller

```shell
kubectl create -f ReplicationController.yaml
```

## 使用ReplicationController

```shell
kubectl get rc 
describe rc <rcName>
```

k8s并不是因为受到pod删除通知而去创建新的pod，而是因为检车到目前运行的pod与期望pod数量不符合，才去创建pod。

### 模拟节点故障

minikube 无法实操。因他是单节点，主节点和工作节点共用一个节点。

通过关闭网络节点模拟节点故障。

具体《k8s in action》 page：96

### 将pod移入移出ReplicationController作用域

可以通过查看metadata.ownerReferences字段，查看一个pod属于哪一个ReplicationController。（待实操，应该是describe pod < podName>）

ReplicationController是通过标签选择器来选择要控制Pod。因此想让pod脱离控制，直接修改pod的标签，而不是新增，因为controller不会去管pod是否有其他附加的标签，而是在乎pod的标签里是否存在它想要的标签。

```shell
kubectl label pod <podName> key=value #新增标签，不会对复制集产生影响
kubectl label pod <podName> key=value --overwrite
# --overwrite必要参数，否则只是告警，因为k8s防止你想添加而无意间修改了现有标签。
```

**注意：**如果是不是修改pod标签，而是修改controller的标签选择器，那么会导致所有的pod脱离控制，controller会建立新的pod复制集。

### 修改pod模板

只有修改复制集的数量，才会对现有的pod做出数量变化，而修改pod模板，只会对之后新创建的pod产生影响，而不会改变旧的pod，除非手动去删除。

```shell
kubectl edit rc <rcName> # 编辑修改yaml配置。
# 保存退出后，配置就会生效。
```

### 水平伸缩

两种方法

1.shell语句

```shell
kubectl scale rc <rcName> --replicas=n
```

2.修改配置文件

```shell
kubectl edit rc <rcName>
```

### 删除ReplicationController

删除controller，那么所管理的pod也会被删除。

```shell
kubectl delete rc <rcName>
```

pod只是被管理，而不是controller的组成，所以也可以只删除controller，而pod继续不中断运行。

```shell
kubectl delete rc <rcName> --cascade=false
```

使用 --cascade删除controller后，pod还存在，它能够被其他controller接管（ReplicaSet、ReplicationController）

# ReplicaSet

行为完全相同，不过ReplicaSet的标签选择器更为强大。

![image-20201014231145893](img\image-20201014231145893.png)

```yaml
apiVersion: v1 => apps/v1beta2
kind: ReplicationController => ReplicaSet
metadata:
  name: web-node
spec:
  replicas: 3
  selector:
    matchLabels: =>新增
      app: web
  template:
    metadata:
      labels:
        app:web
      spec:
        containers:
        - name:web-node-container
          image: luksa/kubia
          ports:
          - containerPort: 8080
```

修改地方：apiVersion、kind、selector.matchLabels

以上创建一个ReplicaSet，那么之前删除controller，但未删除的pod，也会被它接管，因为选择的标签没改动，因此不会去创建新的pod。

```shell
kubectl create -f xx.yaml
kubectl get rs
kubectl describe rs <rsName?>
```

## 更富表达力的标签选择器

```yaml
selector:
  matchExpressions:
    - key: app
      operator: In
      values:
        - kubia
```

意思是：匹配标签名未app，且值必须与values（数组）中的某个元素匹配，在这里是值必须与kubia匹配。

operator：

![image-20201014232425259](img\image-20201014232425259.png)

如果指定多个matchExpression，则必须所有表达式为true，才能使选择器与pod匹配。

```yaml
  matchExpressions:
    - key: app
      ...
    - key: app2
      ...
```

如果同时指定matchLabels和matchExpressions，则matchLabel必须匹配，且所有matchExpression必须为true才能匹配。

## 删除ReplicaSet

```shell
kubectl delete rs <rsName>
```

# DaemonSet

ReplicaSet和ReplicationController只是在集群上部署特定数量的pod，如果希望pod在集群的每个节点上运行（每个节点都有一个pod实例）。

场景：pod执行系统级别的与基础结构相关的操作：日志收集和资源监控。

在以上场景就会有将pod部署在每一个节点上的需求。

使用DaemonSet：会在符合的节点（没指定默认所有节点，或者是在模板上通过nodeSelector属性指定节点）上部署pod，如果节点下线，DaemonSet不会在其他地方重新创建pod。当新增节点时，DaemonSet会立即部署一个新的pod实例。同时pod被删除，和replicaSet和replicationController一样，会建立新的pod。

```yaml
apiVersion: apps/v1beta2
kind: DaemonSet
metadata:
  name: node-web
spec:
  selector:
    matchLabels:
      app: nodeweb
  template:
    metadata:
      labels:
        app: nodeweb
    spec:
      nodeSelector: #指定在有这个标签的节点上部署pod
        disk: ssd
      containers:
      - name: node
        image: luksa/ssd-monitor
```

先在节点上设置标签，才会部署pod

```shell
1.kubectl label node <nodeName> disk=ssd
```

```shell
2.kubectl create -f xxx.yaml
```

1和2的先后顺序都可以，DaemonSet启动后会去监控的。

## 删除/更改节点标签后

```shell
kubectl label node <nodeName> disk=none --overwrite
```

pod会被DaemonSet终止掉。

## 删除DaemonSet

删除DaemonSet，也会一起删除pod

# 运行执行单个任务的pod

场景：如果你需要运行一个任务，而且这个任务在完成后正常退出。比如：需要开一个任务，它负责将图片从一台服务器迁移到另一台服务器，迁移完后，任务自动结束。

分析：如果直接通过创建pod，那么当迁移到一半，进程异常退出、节点宕机或者pod被移除了，那么任务也就被取消了。如果托管给ReplicationController、ReplicaSet或者是DaemonSet，那么就算迁移完成，任务也不会结束，容器会持续存在。

k8s的job对该场景提供了支持。

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name:batch-job
spec:
  template:
    metadata:
      labels:
        app:batch-job
    spec:
      restartPlicy: OnFailure #进程异常退出，则容器重启
      containers:
      - name: main
        image: luksa/batch-job
```

这个镜像时调用一个运行120秒的进程，然后退出。

job不能指定重启策略为：always，因为它执行完就必须退出。重启策略默认为always

## 运行job

```shell
kubectl create -f xx.yaml
kubectl get jobs
```

过了120s后，pod状态显示已完成，但是不会被删除，这是允许你查阅其日志:

```shell
kubectl logs <podName>
```

pod显示完成，同时job也显示成功完成。

## job运行多个pod

通过设置completions和parallelism

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name:batch-job
spec:
  completions: 5 #总共运行5个pod
  parallelism: 2 #两个两个运行，一个结束创建另一个，默认1
  template:
    metadata:
      labels:
        app:batch-job
    spec:
      restartPlicy: OnFailure #进程异常退出，则容器重启
      containers:
      - name: main
        image: luksa/batch-job
```

job运行时修改parallelism

```shell
kubectl scale job <jobName> --replicas 3
```

## job限制pod运行时间

设置属性 activeDeadlineSeconds ，如果pod运行超过此时间，系统尝试终止pod，并标记job为失败。

spec.backoffLimit 可以配置job被标记为失败之前可以重试的次数，默认为6

# CronJob

类似定时任务的job。

```yaml
apiVersion: batch/v1beta1
kind: CronJob
metadata:
  name:batch-job-every-fifteen-minutes
spec:
  schedule: "0,15,30,45 * * * *"
  jobTemplate:
    spec:
      template:
        metadata:
          labels:
          app: perioddic-batch-job
        spec:
          restartPlicy: OnFailure #进程异常退出，则容器重启
          containers:
          - name: main
            image: luksa/batch-job
```

分钟 小时 每月的第几天 月 星期几

在到达指定时间后，CronJob会创建job资源。job资源创建pod资源。这种创建job再创建job，可能会导致任务真正开始执行的时间比指定的时间要慢。

spec.startingDeadlineSeconds：15，pod最迟必须在预定时间后15s内运行。如果超时了，则任务不会运行，并显示为failed。

