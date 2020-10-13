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

![image-20201013232110647](E:\0git_note\docker\img\image-20201013232110647.png)

137表示进程被外部信号终止。128+9 ，9表示终止进程的信号编号。

探针的其他属性：

![image-20201013232315779](E:\0git_note\docker\img\image-20201013232315779.png)

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

