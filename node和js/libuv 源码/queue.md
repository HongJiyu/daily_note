https://www.jianshu.com/p/6373de1e117d

https://my.oschina.net/u/2343729/blog/1830147

```c
// 将一个2个元素的指针数组 定义为 QUEUE，这个QUEUE不是队列，而是队列内的某个节点
typedef void *QUEUE[2];
// 为了使QUEUE_NEXT返回左值（变量）
// q是指向某个队列的节点的指针。
// 传进宏的指针默认类型都是 void * ，因为没有转化类型
// 要看这个宏的返回是左值还是右值，决定最外层的*是表示指针还是指针指向的变量
#define QUEUE_NEXT(q)       (*(QUEUE **) &((*(q))[0]))
#define QUEUE_PREV(q)       (*(QUEUE **) &((*(q))[1]))
#define QUEUE_PREV_NEXT(q)  (QUEUE_NEXT(QUEUE_PREV(q)))
#define QUEUE_NEXT_PREV(q)  (QUEUE_PREV(QUEUE_NEXT(q)))

#define QUEUE_DATA(ptr, type, field)                            ((type *) ((char *) (ptr) - offsetof(type, field)))

// q是首个，h是头，把h去掉都指向自己，将n带起h的位置
QUEUE_SPLIT(h, q, n) 
// 是将头替换成一个&2 ，使用这个函数的目的应该是防止指向被其他函数改变
QUEUE_MOVE(&1,&2)
// 删掉&1
QUEUE_MOVE(&1)

    
```

