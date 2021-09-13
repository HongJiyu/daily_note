handle 的flags的值：

00000 0000

0000 0001  handle将被关闭

0000 0010  handle被关闭

0000 0100  handle活跃着

0000 1000  handle被引用，即loop的active_handle的值包含它

略~

![image-20210911145033632](image\image-20210911145033632.png)



# uv__handle_stop （宏）

先判断handle是否活跃，不活跃则默认被关闭。

如果活跃则设置其flags为不活跃，并将其loop对应的active_handle-1。



# uv__handle_init （宏）

设置这个handle的loop、type、flags（ref级别），放入到loop的handle_queue的尾部，handle->u.fd =-1（不知道）



# uv__handle_start （宏）

判断是否活跃，不活跃则使其活跃，活跃则弹出。

变成活跃后，再判断是否被引用，没被引用则loop的active_handles+1