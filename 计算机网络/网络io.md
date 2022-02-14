# io多路复用

https://www.jianshu.com/p/397449cadc9a

## select

由`fd_set`，一个long类型的数组存放的元素，与文件句柄一一对应。

- 每次调用select，都需要吧`fd_set`从用户态拷贝到内核态，集合很大时，开销也很大。
- 每次都需要遍历`fd_set`，开销也大，不管时活跃还是非活跃。
- `fd_set`做了大小限制，和进程能打开的文件描述符一致，只有1024。

## epoll

使用一个文件描述符来管理多个文件描述符号。

- `epoll_create(int size);`创建epoll的句柄，及这个句柄能够注册的句柄数量。

- `epoll_ctl(int epfd, int op, int fd, struct epoll_event *event);` 注册、修改、删除事件及关联的句柄。
- `epoll_wait(int epfd, struct epoll_event * events, int maxevents, int timeout);` 等待事件就绪。并将就绪的放到events中

两种模式

- 水平触发：有事件就绪可以不在本次循环处理，可以等到下一次epoll_wait时再处理，因为会再次通知。
- 边缘触发：有事件就绪必须在本次循环处理，如果不处理，则不会再通知。

## 总结

![image-20220214223303164](images\image-20220214223303164.png)