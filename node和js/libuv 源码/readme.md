1. 根据understand nodejs 看前四章到线程池。结合笔记的corec.md 是事件循环。asyncc.md是线程池。

2. 看线程池主要是这里有一个观察者，而且书上也是按照这个顺序。



简单看完之后的感觉：

1. 时间更新问题，win采用系统函数，每秒计算次数，至今计算次数计算出当前时间。
2. timer阶段，是用最小堆，而不是红黑树。
3. pendding队列没有套娃。
4. idle、prepare、check 只是接口，没看到具体实现。
5. 判断io poll阶段的阻塞：有没有需要马上执行的回调或者时间循环需要结束，都会阻塞为0，否则按照timer堆最近时间及修正时间进行处理。
6. iopoll 先epoll_ctl 将观察者注册，再epoll_wait 阻塞。
7. close 阶段，是按照不同的handle type ，实现不同的处理方法。



