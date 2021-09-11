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

# uv_loop_alive（函数）

有活跃的handle、有活跃的request、有需要关闭的handles， 则表示事件循环活跃

# uv__update_time（函数）

修改time，待细究，不知道具体实现

# uv__run_timers （函数）

看一个时间handle如何放到loop的handle_queue，如何被放到heap中

# 其他

- container_of （函数）

https://blog.csdn.net/zhuxiaowei716/article/details/7562986