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

## 额外内存池

缓冲池中的帧缓冲（frame buffer），对应的缓冲控制对象（buffer control block），这些对象记录了一些lur、锁、等待等信息，而这个对象的内存需要从额外的内存池中申请。因此缓冲池增加，额外内存池也应增加这个值。

# checkPoint

避免刷盘时发生宕机，避免数据丢失问题，数据库系统普遍采用了write ahead log策略。事务提交时，先写重做日志（redo log），再修改页。这也是事务acid的d的要求。

checkpoint解决以下几个问题：

- 缩短数据库的恢复时间。
- 缓冲池不够用，将脏页刷新到磁盘。
- 重做日志不可用，刷新脏页。

解释：

- 不是将所有的脏页都刷，而是checkpoint点之后的数据才是需要被恢复的。

- lru 需要淘汰页，页中也存在的脏页，需要强制执行checkpoint （不懂怎么执行）

- 重做日志：循环使用的，也就是重做日志不是无限增大。那么需要保证数据被覆盖前，那些数据都需要刷盘，不然数据库宕机了，那新数据就丢失了。强制checkpoint

两种checkpoint。

- sharp checkpoint：默认开启，数据库关闭时，所有脏页都刷新回磁盘`innodb_fast_shutdown=1`
- fuzzy checkpoint：只刷新一部分脏页，而不是刷新所有脏页。

发生fuzzy checkpoint的情况有：

- master thread checkpoint：以每秒或每十秒从缓冲池的脏页列表刷新一定比例的页回磁盘。

- flush_lru_list checkpoint：5.6版本后，由page cleaner线程，由参数`innodb_lru_scan_depth`控制可用页的数量。即需要保证在用户查询，保证lru列表中是否有可用的空间。

- async/sync flush checkpoint： 
  - 脏页总数量的大小与`async_water_mark`（重做日志的75%）和`sync_water_mark`（重做日志的90%）比较。
  - 小于async，则不用刷新。
  - 处于中间，则发生async flush
  - 大于sync（重做日志太小的情况），发生sync flush
  - 5.6之后，也是放在page cleaner thread。

- dirty page too much checkpoint：脏页数量太多，`innodb_max_dirty_pages_pct`默认是75，当缓冲池中脏页的数量占据75%，则强制刷新。

# master thread

它负责的事情分为：每秒执行的、每10秒执行的。可能会有延时。

每秒：

- 日志缓冲刷新到磁盘的重做日志，即使事务还没提交。（这也是为什么再大的事务提交时间也是很短）
- 合并插入缓冲（不是每秒都发生）：判断前1秒io次数，小于5则可以执行合并插入缓冲。
- 刷新100个脏页（不是每秒都发生）：`buf_get_modified_ratio_pct`超过`innodb_max_dirty_pages_pct`（90%），才会刷新

每10s：

。。。。。。

P36页

# innodb的关键特性

## 插入缓冲（待深入）

https://www.cnblogs.com/zuoxingyu/p/3761461.html

**对象：非聚集索引，非唯一。**

​      对于非聚集索引的插入或更新操作,不是每一次直接插入索引页.而是先判断插入的非聚集索引页是否在缓冲池中.如果在,则直接插入,如果不再,则先放入一个插入缓冲区中.然后再以一定的频率执行插入缓冲和非聚集索引页子节点的合并操作.

**好处：**

​		不用每次都进行插入或更新操作都进行io，更新索引到磁盘中。而且如果某些索引是发生在同一页上的，那效果更好。先在内存更新，最后再直接更新那个页。

**为什么对于非聚集索引（非唯一）的插入和更新有效?**

​        还是用还书的例子来说，还一本书A到图书馆，管理员要判断一下这本书是不是唯一的，他在柜台上是看不到的，必须爬到指定位置去确认，这个过程其实已经产生了一次IO操作，相当于没有节省任何操作。所以这个buffer只能处理非唯一的插入，不要求判断是否唯一。聚集索引就不用说了，它肯定是唯一的，mysql现在还只能通过主键聚集。

**效率：**

​		如果merges（合并次数）/merged（合并页）的值等于3/1,则代表插入缓冲对于非聚集索引页的IO请求大约降低了3倍

**insert buffer 大小：**

（默认最大可占用1/2缓冲池内存）

percona官网，修改`IBUF_POOL_SIZE_PER_MAX_SIZE`对插入缓冲的大小进行控制，设置为3，则最大只能使用1/3的缓冲池内存。

## 两次写（没看懂）

## 自适应哈希索引

innodb存储引擎会监控对表上各索引页的查询。如果观察到建立哈希索引可以带来速度提升，则建立哈希索引，称为自适应哈希索引（AHI）

**建立：**

​         通过缓冲池的B+树页构造而来，建立速度很快，不需要对整张表的结构建立哈希索引。自动根据访问的频率和模式来自动为热点页建立哈希索引。

**要求：**

1. 对这个页的**连续访问模式（查询条件一样）必须一样**，即：（a,b）联合索引，其访问模式：（以下两种模式，如果交替则无法创建，因为要求连续。）

- where a=xx

- where a=xx and b=xx

2. 以该模式访问了100次
3. 页通过该模式访问了n次，n=页中记录*（1/16）
4. 只适用等值查询

## 异步io

1. 一条sql查询可能需要扫描多个索引页，也就是需要进行多次io操作。直接发起所有io，而非等待上一个io完成再进行下一个io。

2. io merge操作。将多个io合并为1个，比如查询顺序的页。原先需要3次io。而aio会判断到这三个页是连续的，则发送一个io，并读取48KB的页。（一个页是16KB）

通过`innodb_use_native_aio`启动。read ahead就是通过aio完成的，脏页的刷新也是。

## 刷新邻接页

当刷新脏页，innodb会检测该页所在的区的所有页，如果是脏页，则一起刷新。通过io写入操作合并为一个io操作。 `innodb_flush_neighbors`来控制是否启用。对于固态硬盘有超高的iops性能的磁盘，建议设置为0，即关闭。

## 启动、关闭与恢复