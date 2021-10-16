# uv__io_s

```c
1.	struct uv__io_s {  
2.	  // 事件触发后的回调  
3.	  uv__io_cb cb;  
4.	  // 用于插入队列  
5.	  void* pending_queue[2];  
6.	  void* watcher_queue[2];  
7.	  // 保存本次感兴趣的事件，在插入IO观察者队列时设置  
8.	  unsigned int pevents; 
9.	  // 保存当前感兴趣的事件  
10.	  unsigned int events;   
11.	  int fd;  
12.	};  

```

IO 观察者封装了文件描述符、事件和回调，然后插入到 loop 维护的 IO 观察者队列，在Poll IO 阶段，Libuv 会根据 IO 观察者描述的信息，往底层的事件驱动模块注册文件描述 符感兴趣的事件。当注册的事件触发的时候，IO 观察者的回调就会被执行。

# uv__io_init

```c
1.	void uv__io_init(uv__io_t* w, uv__io_cb cb, int fd) {  
2.	  // 初始化队列，回调，需要监听的fd  
3.	  QUEUE_INIT(&w->pending_queue);  
4.	  QUEUE_INIT(&w->watcher_queue);  
5.	  w->cb = cb;  
6.	  w->fd = fd;  
7.	  // 上次加入epoll时感兴趣的事件，在执行完epoll操作函数后设置  
8.	  w->events = 0;  
9.	  // 当前感兴趣的事件，在再次执行epoll函数之前设置  
10.	  w->pevents = 0;  
11.	}  

```

# uv__io_start

```c
1.	void uv__io_start(uv_loop_t* loop, uv__io_t* w, unsigned int events) {  
2.	  // 设置当前感兴趣的事件  
3.	  w->pevents |= events;  
4.	  // 可能需要扩容  
5.	  maybe_resize(loop, w->fd + 1); 
6.	    // 事件没有变化则直接返回 
7.	  if (w->events == w->pevents)  
8.	    return;  
9.	  // IO观察者没有挂载在其它地方则插入Libuv的IO观察者队列  
10.	  if (QUEUE_EMPTY(&w->watcher_queue))  
11.	    QUEUE_INSERT_TAIL(&loop->watcher_queue, &w->watcher_queue);  
12.	  // 保存映射关系  
13.	  if (loop->watchers[w->fd] == NULL) {  
14.	    loop->watchers[w->fd] = w;  
15.	    loop->nfds++;  
16.	  }  
17.	}  

```

# uv__io_stop

```c
1.	void uv__io_stop(uv_loop_t* loop, 
2.	                  uv__io_t* w, 
3.	                  unsigned int events) {  
4.	  if (w->fd == -1)  
5.	    return;  
6.	  assert(w->fd >= 0);  
7.	  if ((unsigned) w->fd >= loop->nwatchers)  
8.	    return;  
9.	  // 清除之前注册的事件，保存在pevents里，表示当前感兴趣的事件  
10.	  w->pevents &= ~events;  
11.	  // 对所有事件都不感兴趣了  
12.	  if (w->pevents == 0) {  
13.	    // 移出IO观察者队列  
14.	    QUEUE_REMOVE(&w->watcher_queue);  
15.	    // 重置  
16.	    QUEUE_INIT(&w->watcher_queue);  
17.	    // 重置  
18.	    if (loop->watchers[w->fd] != NULL) {  
19.	      assert(loop->watchers[w->fd] == w);  
20.	      assert(loop->nfds > 0);  
21.	      loop->watchers[w->fd] = NULL;  
22.	      loop->nfds--;  
23.	      w->events = 0;  
24.	    }  
25.	  }  
26.	  /* 
27.	    之前还没有插入IO观察者队列，则插入， 
28.	    等到Poll IO时处理，否则不需要处理 
29.	    */  
30.	  else if (QUEUE_EMPTY(&w->watcher_queue))  
31.	    QUEUE_INSERT_TAIL(&loop->watcher_queue, &w->watcher_queue);  
32.	}  

```

# maybe_resize

```c
static void maybe_resize(uv_loop_t* loop, unsigned int len) {
  uv__io_t** watchers;
  void* fake_watcher_list;
  void* fake_watcher_count;
  unsigned int nwatchers;
  unsigned int i;

  if (len <= loop->nwatchers)
    return;

  /* Preserve fake watcher list and count at the end of the watchers */
  if (loop->watchers != NULL) {
    fake_watcher_list = loop->watchers[loop->nwatchers];
    fake_watcher_count = loop->watchers[loop->nwatchers + 1];
  } else {
    fake_watcher_list = NULL;
    fake_watcher_count = NULL;
  }

  nwatchers = next_power_of_two(len + 2) - 2;
  watchers = uv__reallocf(loop->watchers,
                          (nwatchers + 2) * sizeof(loop->watchers[0]));

  if (watchers == NULL)
    abort();
  for (i = loop->nwatchers; i < nwatchers; i++)
    watchers[i] = NULL;
  watchers[nwatchers] = fake_watcher_list;
  watchers[nwatchers + 1] = fake_watcher_count;

  loop->watchers = watchers;
  loop->nwatchers = nwatchers;
}
```

