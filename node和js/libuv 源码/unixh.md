# uv__io_s （结构）

初次在pendding阶段看到，以及io poll阶段

- pending_queue pending队列节点
- watcher_queue 观察者队列节点
- pevents 本次感兴趣的事件，插入io观察者队列时设置（uv__io_start）
- events 当前感兴趣的事件
- fd 文件描述符
- cb 应该是回调函数

​        IO 观察者封装了文件描述符、事件和回调，然后插入到 loop 维护的 IO 观察者队列，在Poll IO 阶段，Libuv 会根据 IO 观察者描述的信息，往底层的事件驱动模块注册文件描述 符感兴趣的事件。当注册的事件触发的时候，IO 观察者的回调就会被执行。