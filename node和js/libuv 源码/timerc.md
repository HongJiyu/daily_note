# uv_timer_t （结构）

总的字段：

-  UV_HANDLE_FIELDS
- UV_TIMER_PRIVATE_FIELDS

具体：

- timeout  这个时间handle的下一次回调时间。
- flags  它的二进制位必须是第三位不为0（ xxx00100），才表示handle活跃
- \* heap_node [3]  存放这个时间handle指向其他三个节点的指针
- start_id  当timeout一致时，用start_id来判断优先执行
- timer_cb   超时回调
- repeat  是否重新执行，像interval循环执行的。

# uv_timer_init (函数)

初始化handle（看uv-common） 的uv__handle_init

初始化其他值

# uv_timer_stop （函数）

从堆节点从堆中去掉，将handle取消活跃，取消引用状态，loop中的引用计数减1

# uv_timer_start （函数）

1. 如果handle被关闭，则直接返回
2. 如果handle活跃则stop，再继续
3. 生成超时时间
4. 赋予回调函数、超时时间、是否重复执行、计数
5. 往堆中插入节点，重新启动handle

# uv_timer_again （函数）

