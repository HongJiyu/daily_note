虚拟地址空间：https://www.zhihu.com/question/290504400/answer/485124116

内核空间和用户空间：https://www.cnblogs.com/xingmuxin/p/10967548.html

io模型：https://blog.csdn.net/weixin_39934085/article/details/110715861

多路复用的解释：一条线路传输好几种信号就是多路复用，在io模型中的解释为一个线程处理多种事件（读、写、连接）

同步异步：以函数调用为例子，调用后能否不等待结果，而是继续执行下去。能不等待：异步。等待：同步。

阻塞io模型和非阻塞io模型：在同步的情况下，是选择阻塞等待，还是不阻塞而采用轮询。

io多路复用：没有阻塞和非阻塞一说。

linux操作系统的库：https://github.com/lozhibo/linux/blob/master/fs/eventpoll.c