# uv_handle_t   handle

```c
//1 自定义数据，用于关联一些上下文,Node.js中用于关联handle所属的C++对象  
void* data;  
     
//2 所属的事件循环     
uv_loop_t* loop;
   
//3 handle类型   
uv_handle_type type;
  
//4 handle调用uv_close后，在closing阶段被执行的回调
uv_close_cb close_cb; 

//5 用于组织handle队列的前置后置指针
void* handle_queue[2];

//6 文件描述符 
union {               
int fd;             
 void* reserved[4];  
} u;  

//7 当handle在close队列时，该字段指向下一个close节点     
uv_handle_t* next_closing; 
 
//8 handle的状态和标记
unsigned int flags;
```

handle 的flags的值：

00000 0000

UV_HANDLE_CLOSING  0000 0001  handle将被关闭

UV_HANDLE_CLOSED   0000 0010  handle被关闭

UV_HANDLE_ACTIVE      0000 0100  handle活跃着

UV_HANDLE_REF            0000 1000  handle被引用，即loop的active_handle的值包含它

略~

![image-20210911145033632](image\image-20210911145033632.png)

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

设置这个handle的loop、type、flags（ref级别），放入到loop的handle_queue的尾部，设置next_closing

```c
#if defined(_WIN32)
# define uv__handle_platform_init(h) ((h)->u.fd = -1)
#else
# define uv__handle_platform_init(h) ((h)->next_closing = NULL)
#endif

#define uv__handle_init(loop_, h, type_)                                      \
  do {                                                                        \
    (h)->loop = (loop_);                                                      \
    (h)->type = (type_);                                                      \
    (h)->flags = UV_HANDLE_REF;  /* Ref the loop when active. */              \
    QUEUE_INSERT_TAIL(&(loop_)->handle_queue, &(h)->handle_queue);            \
    uv__handle_platform_init(h);                                              \
  }                                                                           \
  while (0)
```



# uv__handle_start （宏）

判断是否活跃，不活跃则使其活跃，活跃则弹出。

变成活跃后，再判断是否被引用，没被引用则loop的active_handles+1

```c
1.	#define uv__handle_start(h)           
2.	  do {                           
3.	    if (((h)->flags & UV_HANDLE_ACTIVE) != 0) break;                            
4.	    (h)->flags |= UV_HANDLE_ACTIVE;              
5.	    if (((h)->flags & UV_HANDLE_REF) != 0)   
6.	      (h)->loop->active_handles++;       
7.	  }                             
8.	  while (0)  

```

# uv__handle_ref

```c
1.	#define uv__handle_ref(h)             
2.	  do {                           
3.	    if (((h)->flags & UV_HANDLE_REF) != 0) break;         
4.	    (h)->flags |= UV_HANDLE_REF;     
5.	    if (((h)->flags & UV_HANDLE_CLOSING) != 0) break;   
6.	    if (((h)->flags & UV_HANDLE_ACTIVE) != 0) uv__active_handle_add(h);
7.	  }                              
8.	  while (0)  
```

# uv__handle_unref

```c
1.	#define uv__handle_unref(h)               
2.	  do {                           
3.	    if (((h)->flags & UV_HANDLE_REF) == 0) break;  
4.	    (h)->flags &= ~UV_HANDLE_REF;  
5.	    if (((h)->flags & UV_HANDLE_CLOSING) != 0) break;
6.	    if (((h)->flags & UV_HANDLE_ACTIVE) != 0) uv__active_handle_rm(h); 
7.	  }                            
8.	  while (0)  
```

