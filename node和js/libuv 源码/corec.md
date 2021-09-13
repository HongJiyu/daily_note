# uv_loop_t（结构）

uv.h 的 uv_loop_s  =>  unix.h 的  UV_LOOP_PRIVATE_FIELDS

- active_handles 活跃的handle数量
- active_reqs {count} 活跃的请求数

```c
union { void* unused[2]; unsigned int count; } active_reqs;
```

- closing_handles 要关闭的handle指针
- time  当前时间
- timer_heap  timer阶段所需要的数据结构

```c
struct {
void* min;    //堆顶
unsigned int nelts;   //节点数
} timer_heap;
```

- void* handle_queue[2]  一个指针数组，0执行下一个，1指向上一个，在所有handle的最后一个

# uv_run (函数)



# uv_loop_alive（函数）

有活跃的handle、有活跃的request、有需要关闭的handles， 则表示事件循环活跃

# uv__update_time（函数）

修改time，待细究，不知道具体实现

# uv__run_timers （函数）

看一个时间handle如何放到loop的handle_queue，如何被放到heap中。

如何处理 （已看）

# uv_run_pending （函数）

具体还是对queue的操作。

# uv__run_idle（函数）

略

# uv__run_prepare（函数）

略

# uv_backend_timeout （函数）

进io poll阶段，但是不阻塞（阻塞时间为0）有如下情况：

要么是这个事件循环要终止了，要么是其他阶段有待执行，因此不能阻塞在这里。

- stop_flag 不为0，即停止标志
- 没有活跃的handle和活跃的request
- idle_handles 为空
- pending_queue 为空
- closing_handles 有需要关闭的handle

# uv__next_timeout (函数)

计算出io poll阶段阻塞多久。



# 其他

- container_of （函数）

https://blog.csdn.net/zhuxiaowei716/article/details/7562986