uv_handle_t   handle

- uv_async_t



uv__io_t   观察者



handle 的flags的值：

00000 0000

UV_HANDLE_CLOSING  0000 0001  handle将被关闭

UV_HANDLE_CLOSED   0000 0010  handle被关闭

UV_HANDLE_ACTIVE      0000 0100  handle活跃着

UV_HANDLE_REF            0000 1000  handle被引用，即loop的active_handle的值包含它

略~

![image-20210911145033632](image\image-20210911145033632.png)



pending  - async中发现，为1标记子线程任务完成。

# uv__handle_stop （宏）

先判断handle是否活跃，不活跃则默认被关闭。

如果活跃则设置其flags为不活跃，并将其loop对应的active_handle-1。

```c
#define uv__handle_stop(h)                                                    \
  do {                                                                        \
    if (((h)->flags & UV_HANDLE_ACTIVE) == 0) break;                          \
    (h)->flags &= ~UV_HANDLE_ACTIVE;                                          \
    if (((h)->flags & UV_HANDLE_REF) != 0) uv__active_handle_rm(h);           \
  }                                                                           \
  while (0)

#define uv__active_handle_rm(h)                                               \
  do {                                                                        \
    (h)->loop->active_handles--;                                              \
  }                                                                           \
  while (0)
```



# uv__handle_init （宏）

设置这个handle的loop、type、flags（ref级别），放入到loop的handle_queue的尾部，handle->u.fd =-1（不知道）



# uv__handle_start （宏）

判断是否活跃，不活跃则使其活跃，活跃则弹出。

变成活跃后，再判断是否被引用，没被引用则loop的active_handles+1