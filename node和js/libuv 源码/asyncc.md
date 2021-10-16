Libuv子线程和主线程的通信是使用uv_async_t结构体实现的。Libuv使用loop->async_handles队列记录所有的uv_async_t结构体，使用loop->async_io_watcher作为所有uv_async_t结构体的IO观察者，即loop-> async_handles队列上所有的handle都是共享async_io_watcher这个IO观察者的。第一次插入一个uv_async_t结构体到async_handle队列时，会初始化IO观察者，如果再次注册一个async_handle，只会在loop->async_handle队列和handle队列插入一个节点，而不会新增一个IO观察者。当uv_async_t结构体对应的任务完成时，子线程会设置IO观察者为可读。Libuv在事件循环的Poll IO阶段就会处理IO观察者。

# uv_async_init  （函数）

初始化一个线程池的handle

```c
int uv_async_init(uv_loop_t* loop, uv_async_t* handle, uv_async_cb async_cb) {
  int err;

  err = uv__async_start(loop);
  if (err)
    return err;

  uv__handle_init(loop, (uv_handle_t*)handle, UV_ASYNC);
  handle->async_cb = async_cb;
  handle->pending = 0;

  QUEUE_INSERT_TAIL(&loop->async_handles, &handle->queue);
  uv__handle_start(handle);

  return 0;
}
```

# uv__async_start （函数）

启动 线程池的观察者，唯一的一个

uv\__async_start只会执行一次，时机在第一次执行uv_async_init的时候。uv__async_start主要的逻辑如下 1 获取通信描述符（通过eventfd生成一个通信的fd（充当读写两端）或者管道生成线程间通信的两个fd表示读端和写端）。 2 封装感兴趣的事件和回调到IO观察者然后追加到watcher_queue队列，在Poll IO阶段，Libuv会注册到epoll里面，如果有任务完成，也会在Poll IO阶段执行回调。 3 保存写端描述符。任务完成时通过写端fd通知主线程。

注意：

linux中使用eventfd函数，通信的fd（充当读写两端），存放在观察者的fd中。loop->async_wfd 的值为-1

window使用匿名管道，生成读写两端的fd，观察者的fd中为读端fd，loop->async_wfd 的值写端fd

```c
static int uv__async_start(uv_loop_t* loop) {
  int pipefd[2];
  int err;

  if (loop->async_io_watcher.fd != -1)
    return 0;

#ifdef __linux__
  err = eventfd(0, EFD_CLOEXEC | EFD_NONBLOCK);
  if (err < 0)
    return UV__ERR(errno);

  pipefd[0] = err;
  pipefd[1] = -1;
#else
  err = uv__make_pipe(pipefd, UV_NONBLOCK_PIPE);
  if (err < 0)
    return err;
#endif

  uv__io_init(&loop->async_io_watcher, uv__async_io, pipefd[0]);
  uv__io_start(loop, &loop->async_io_watcher, POLLIN);
  loop->async_wfd = pipefd[1];

  return 0;
}
```

# uv_async_send

初始化async结构体后，如果async结构体对应的任务完成后，就会通知主线程，子线程通过设置这个handle的pending为1标记任务完成，然后再往管道写端写入标记，通知主线程有任务完成了。

```c
int uv_async_send(uv_async_t* handle) {
  /* Do a cheap read first. */
  if (ACCESS_ONCE(int, handle->pending) != 0)
    return 0;

  /* Tell the other thread we're busy with the handle. */
  if (cmpxchgi(&handle->pending, 0, 1) != 0)
    return 0;

  /* Wake up the other thread's event loop. */
  uv__async_send(handle->loop);

  /* Tell the other thread we're done. */
  if (cmpxchgi(&handle->pending, 1, 2) != 1)
    abort();

  return 0;
}
// 这里只是为了找写端fd（具体看uv_async_start怎么存储）然后发送消息给主线程。
static void uv__async_send(uv_loop_t* loop) {
  const void* buf;
  ssize_t len;
  int fd;
  int r;

  buf = "";
  len = 1;
  fd = loop->async_wfd;

#if defined(__linux__)
  if (fd == -1) {
    static const uint64_t val = 1;
    buf = &val;
    len = sizeof(val);
    fd = loop->async_io_watcher.fd;  /* eventfd */
  }
#endif

  do
    r = write(fd, buf, len);
  while (r == -1 && errno == EINTR);

  if (r == len)
    return;

  if (r == -1)
    if (errno == EAGAIN || errno == EWOULDBLOCK)
      return;

  abort();
}
```

uv_async_send首先拿到写端对应的fd，然后调用write函数，此时，往管道的写端写入数据，标记有任务完成。有写则必然有读。读的逻辑是在uv\__io_poll中实现的。uv\__io_poll函数即Libuv中Poll IO阶段执行的函数。在uv\_\_io_poll中会发现管道可读，然后执行对应的回调uv\__async_io。

# uv__async_io

执行回调

读取数据、遍历async_handles，取出，对pending状态为1，且存在回调的，执行回调。同时会把pending改回0，再放回async_handles

```c
static void uv__async_io(uv_loop_t* loop, uv__io_t* w, unsigned int events) {
  char buf[1024];
  ssize_t r;
  QUEUE queue;
  QUEUE* q;
  uv_async_t* h;

  assert(w == &loop->async_io_watcher);

  for (;;) {
    r = read(w->fd, buf, sizeof(buf));

    if (r == sizeof(buf))
      continue;

    if (r != -1)
      break;

    if (errno == EAGAIN || errno == EWOULDBLOCK)
      break;

    if (errno == EINTR)
      continue;

    abort();
  }

  QUEUE_MOVE(&loop->async_handles, &queue);
  while (!QUEUE_EMPTY(&queue)) {
    q = QUEUE_HEAD(&queue);
    h = QUEUE_DATA(q, uv_async_t, queue);

    QUEUE_REMOVE(q);
    QUEUE_INSERT_TAIL(&loop->async_handles, q);

    if (0 == uv__async_spin(h))
      continue;  /* Not pending. */

    if (h->async_cb == NULL)
      continue;

    h->async_cb(h);
  }
}
```

待继续：https://github.com/theanarkh/understand-nodejs/blob/master/docs/chapter04-%E7%BA%BF%E7%A8%8B%E6%B1%A0.md  线程池的实现