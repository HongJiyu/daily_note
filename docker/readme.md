k8s in action

11.2及之后没看、12、13没看、15.3没看、16、17、18 没看



docker 技术入门与实战

看完 10 章



实操：

https://kubernetes.io/docs/tutorials/ 

点击左侧菜单的“Learn Kubernetes Basics” -> “Create a Cluster” -> “Interactive Tutorial - Creating a Cluster”

执行：minikube start



replicationcontroller



问题：

- docker


为什么每个容器只启动一个进程

每个容器之间怎么通讯，爆露端口？

- k8s

为什么要pod

pod还要对应的内部ip呢？内部访问也统一用服务不行吗

怎么查看pod的内部ip( kubectl get pods -o wide )

service内部通讯，环境变量、dns、全限定名

 service 连接外部 走服务  和走dns的区别

nodeport的负载时怎样的。

nodeport 会出现nat转化导致拿不到正确的 ip

就绪和存货探针，失败返回什么，具体案例

git repo的场景

