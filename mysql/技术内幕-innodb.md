innodb是OLTP应用首选存储引擎。

innodb存储引擎的体系架构：

![image-20210108142459881](D:\note\mysql\image\image-20210108142459881.png)

后台线程的主要作用是负责刷新内存池中的数据，保证缓冲池中的内存缓存时最近的数据。将已修改的数据文件刷新到磁盘文件中。保证数据库在发生异常能恢复到正常运行状态。

# 后台线程

1. master thread 核心后台线程，主要负责将缓冲池的数据异步刷新到磁盘，包括：脏页的刷新、合并插入缓冲、undo页回收。
2. io thread 使用了aio来处理写io请求，负责这些io请求的回调。分别有：write、read、insert buffer和log。read和write默认分别为4个，使用`innodb_read_io_threads`和`innodb_write_io_threads`参数进行设置。可以通过 `show engine innodb status`观察io thread。
3. purge thread：事务提交后，所使用的undo 页需要被回收，innodb1.1之前由master负责，1.1开始由purge thread负责，减轻master thread的工作。`innodb_purge_threads`，1.2开始支持配置多个purge thread`show variables like 'innodb_purge_threads'`
4. page cleaner thread：负责脏页的刷新。也是从master thread分离开的。

# 内存区域

## 缓冲池

innodb存储引擎是基于磁盘存储的，并按照页的方式进行管理。为了解决cpu与磁盘之间速度的鸿沟，采用缓冲池技术来提高数据库的整体性能。

读，先放到缓冲池。下次读，判断是否命中。写，则以一定的频率刷新到磁盘中，并不是以一定频率刷新到磁盘，而是通过Checkpoint的机制刷新回磁盘。也是为了提高数据库的整体性能。

缓冲池的大小：`innodb_buffer_pool_size`单位是字节（Byte）。`show variables like 'innodb_buffer_pool_size'\G`

![image-20210108152910926](D:\note\mysql\image\image-20210108152910926.png)

从innodb 1.x开始，允许有多个缓冲池实例，每个页根据哈希值平均分配到不同的缓冲池实例中。减少内部资源竞争，提高并发处理能力。

通过`innodb_buffer_pool_instances`设置缓冲池的数量。通过`show engine innodb status` 里面有缓冲池的信息。从5.6开始，可以通过information_schema库下的表`innodb_buffer_pool_stats`观察缓冲状态。

```mysql
use information_schema;
select pool_id,pool_size,free_buffers,database_pages from innodb_buffer_pool_stats;
```

### lru list、free list、flush list

- lru list （管理页的可用性）

缓冲池存放的是页，每一页16KB，通过lru算法进行管理。

mysql对lru进行了优化，加入了midpoint位置。midpoint前的数据是new，之后的数据是old。新读取到的页是放到midPoint位置，而不是放到lru列表的首部。midPoint位置：`innodb_old_blocks_pct`默认是37，也就是37%。63%是new数据，37%是old数据。

加入midPoint的作用：防止全表扫描等将大量页放入到缓冲区，而导致lru列表中的热点数据被淘汰掉。

同时只有在mid位置后等待`innodb_old_blocks_time`的时间，该页才会被放入到lru列表的热端。

如果用户预估自己的活跃热点数据不知63%，那么可以设置`innodb_old_block_pct`来增大热点区域。

从old放入到new，操作为page mad young。

因为`innodb_old_blocks_time`设置导致页没有从old移动到new的操作称为page not made young。

- free list 不懂
- flush list （管理将页刷新会磁盘）

lru列表中的页被修改，该页为脏页，缓冲区的页和磁盘上的页的数据产生不一致。数据库通过checkpoint机制将脏页刷新会磁盘，而flush列表中的页即为脏页。脏页同时存在lru列表中。二者互不影响。

![image-20210108174150998](D:\note\mysql\image\image-20210108174150998.png)

### 压缩页

innodb存储引擎从1.x版本开始支持压缩页功能，原本16KB压缩为1、2、4、8KB，这些非16KB的页由unzip_lru列表进行管理。

![image-20210108172524859](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20210108172524859.png)

![image-20210108172731934](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20210108172731934.png)



### 查看缓冲池

1. 

![image-20210108163855468](D:\note\mysql\image\image-20210108163855468.png)

2. 通过`information_schema.innodb_buffer_pool_stats` 观察缓冲区的运行状态。

```mysql
select pool_id,hit_rate,pages_made_young,pages_not_made_young from information_schema.innodb_buffer_pool_stats;
```

3. 通过以下，查看lru列表每个页的具体信息。以下是space为1的页的信息。

```mysql
select table_name,space,page_number,page_type from innodb_buffer_page_lru where space=1;
```

## 重做日志缓冲

redo log buffer

innodb会先将日志信息放入到这个重做日志缓冲区，然后按一定频率刷新到磁盘的重做日志。重做日志缓冲区大小`innodb_log_buffer_size`

默认是8MB，通常情况满足条件。

- master thread 每一秒刷新一次。
- 每个事务提交也会刷新
- 剩余空间小于1/2，也会刷新。