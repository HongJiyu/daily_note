# uv_loop_t（结构）

include/uv.h 的 uv_loop_s  =>  include/unix.h 的  UV_LOOP_PRIVATE_FIELDS

- active_handles 活跃的handle数量
- active_reqs {count} 活跃的请求数

```c
union { void* unused[2]; unsigned int count; } active_reqs;
```

- uv_handle_t* closing_handles 要关闭的handle指针
- time  当前时间
- timer_heap  timer阶段所需要的数据结构

```c
struct {
void* min;    //堆顶
unsigned int nelts;   //节点数
} timer_heap;
```

- void* handle_queue[2]  一个指针数组，0执行下一个，1指向上一个，在所有handle的最后一个
- watcher_queue 观察者队列节点
- nfds    一般为watcher_queue队列节点数
- backend_fd    epoll的fd
- flags   标记，目前只有UV_LOOP_BLOCK_SIGPROF ,用于epoll_wait时屏蔽SIGPROF信号。（0001）
- watchers  数组，根据观察者的fd值，存储对应的观察者（会比nfds大）
- nwatchers   watchers数组的长度，在maybe_resize函数扩容（会比nfds大）
- internal_fields 内部字段

```c
struct uv__loop_internal_fields_s {
  unsigned int flags;   //用来标记metrics
  uv__loop_metrics_t loop_metrics;
};
struct uv__loop_metrics_s {
  uint64_t provider_entry_time;
  uint64_t provider_idle_time;
  uv_mutex_t lock;
};
```

- async_handles  线程池相关的handle节点
- async_io_watcher  线程池中唯一一个观察者
- async_wfd   这个观察者对应的通讯管道中的写端 文件描述符

# uv_run (函数)

事件循环共三种模式

- UV_RUN_DEFAULT    默认模式
- UV_RUN_ONCE  事件循环只执行一次，应该是至少两轮
- UV_RUN_NOWAIT  在poll阶段阻塞，timeout为0

## uv_loop_alive（函数）

有活跃的handle、有活跃的request、有需要关闭的handles， 则表示事件循环活跃

## uv__update_time（函数）

修改time，待细究，不知道具体实现

https://zhuanlan.zhihu.com/p/52161066  windows版本

## uv__run_timers （函数）

1. 在loop中找到对应的堆指针。
2. 通过堆指针找到堆顶（堆节点）。
3. 通过container_of 函数，堆节点基于0的地址偏移量来找到对应的时间handle（uv_timer_t）

4. 从堆节点从堆中去掉，将handle取消活跃，取消引用状态，loop中的引用计数减1
5. 

## uv_run_pending （函数）

具体还是对queue的操作。

## uv__run_idle（函数）

略

## uv__run_prepare（函数）

略

## uv_backend_timeout （函数）

进io poll阶段，但是不阻塞（阻塞时间为0）有如下情况：

要么是这个事件循环要终止了，要么是其他阶段有待执行，因此不能阻塞在这里。

- 只执行一次事件循环（UV_RUN_ONCE），并且pending阶段不为空（只执行一次事件循环应该是两轮，pending阶段不为空表示第二轮）
- 事件类型为UV_RUN_NOWAIT。

- stop_flag 不为0，即停止标志（要关闭事件循环）
- 没有活跃的handle和活跃的request（要关闭事件循环）
- idle_handles 为空（要关闭事件循环）
- pending_queue 为空（要关闭事件循环）
- closing_handles 有需要关闭的handle（有待执行）

## uv__next_timeout (函数)

计算出io poll阶段阻塞多久。（待继续）

- 在timer堆中无数据，返回 -1
- timer堆顶执行时间到了，返回 0
- 计算出timer堆顶与当前时间的差，与INT_MAX比较取最小的。

## uv__io_poll （函数）

需要结合epoll https://blog.csdn.net/yusiguyuan/article/details/15027821 一起看

一些结构体在<sys/epoll.h>中定义

待细看

- 通过 epoll_ctl 将所有观察者都注册到epoll中。
- 通过 epoll_pwait 等待完成的事件（细看）
  - watchers扩容+2的原因
- 遍历结果，将完成的event的fd取出并在loop的watchers找到对应的观察者对象，进而执行这个观察者的回调函数

![image-20210914164042031](image\image-20210914164042031.png)

## uv__metrics_update_idle_time（函数）

略

## uv__run_closing_handles（函数）

将所有的closing_handles全部执行完，根据不同类型进行不同处理。

# uv__io

结构，看unix.h

## uv__io_init （函数）

总结：初始化这个uv__io_t结构体

初始化pending_queue节点、watcher_queue节点

赋值cb（回调函数）和fd（文件描述符） 

## uv_io_start （函数）

https://blog.csdn.net/zouwm12/article/details/101386446

总结：将这个uv__io_t结构体和loop关联上



# poll

event flag

```c
#define POLLRDNORM  0x0100    //普通数据可读
#define POLLRDBAND  0x0200    //优先级带数据可读
#define POLLIN      (POLLRDNORM | POLLRDBAND)  //	普通或优先级带数据可读
#define POLLPRI     0x0400   //高优先级数据可读

#define POLLWRNORM  0x0010  // 普通数据可写
#define POLLOUT     (POLLWRNORM) // 普通数据可写
#define POLLWRBAND  0x0020 //优先级带数据可写

#define POLLERR     0x0001  //发生错误
#define POLLHUP     0x0002  //发生挂起
#define POLLNVAL    0x0004  //描述字不是一个打开的文件
```

