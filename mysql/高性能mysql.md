高性能MySQL 5.1和5.5的版本。

# 连接管理

客户端和服务端。

客户端，也就是我们使用驱动连接，一般都会使用连接池。池中存放着几个不断开的连接。

服务端，使用线程池。而且线程处理的最小单元是语句。所以存在一个线程处理多个连接的语句。而不再是一个连接一条线程。



# 第三章 性能剖析

基于执行时间的分析和基于等待的分析



# 第四章 schema与数据类型优化

1. 整形比字符操作代价更低，因为字符集和校对规则（排序规则）更复杂。

2. 用MySQL内建的类型而不是用字符串存储日期时间

3. 整形存储ip

4. 避免null，null使得索引计算更复杂、同时会多占用存储空间。

5. datetime和timestamp都能存储时间，精确到秒，不过timestamp比datetime少用一半的存储空间。

## 整数类型

tinyint,smallint,mediumint,int,bigint 分别是1、2、3、4、8个字节

整数类型指定宽度 ，大多数是没有意义的。只是指定显示长度，而不是存储长度。而且要和zerofill配和使用。

## 实数类型

float、double、decimal。

CPU支持原生的浮点数计算，也就是（float和double）。

decimal只是一种存储形式，在计算中会转化为double类型。decimal占用更多的空间，因为保存为未压缩的字符串（一个数字一个字节）。

遇到要提高计算并节省空间，可以将decimal替换为bigint。而需要精确到小数点两位的，可以将数字先乘100。

## 字符串类型

https://www.cnblogs.com/Lance--blog/p/5193027.html  char和varchar

char(10) 和varchar(10) 在5.0之后都是指字符，也就是：1111：四个字符；aaaa：四个字符；种种种种：四个字符。

char是固定字符，定义过长的位置用空格补。varchar是动态字符，定义过长也没事（头部会记录长度），定义过短会被截取。

varchar 头部有1-2个字节记录长度，最大是65535 ，单位是字节。如果最大长度小于或等于255字节，则只需要1个字节表示。

## 日期类型 

mysql能存储的最小粒度为秒。

datetime使用8个字节存储，可以进行排序和格式化。

timestamp使用4个字节存储，它的显示依赖时区。

使用bigint可以存储微妙级别的时间戳。

## 位数据类型

innodb为每个bit列使用了一个足够存储的最小整数类型来存放，所以不能节省存储空间。

比如有9位，那么会用smallint。17位，用mediumint。25位用int。33位用bigint（8字节）

而myisam可以用字节存储。33位就用5个字节。

## 特殊类型

低于秒级别的时间戳。

IPv4地址：inet_aton() 和inet_ntoa()

```mysql
alter table 表名 modify column 字段名 int unsigned;
insert into tbl_ip values( INET_ATON('127.0.0.1'))
select INET_NTOA(ip) from tbl_ip;
```

# 第五章 创建高性能索引

对于一些字段比较长的，使其成为索引，那么必然每个节点多能存放的键就比较少。树就会变得高瘦。那么查询效率极低。

场景：存放url，要查询url。

解决方案：使用空间换时间，维护一个字段url_tmp，将其设置为int。这个url_tmp是url的crc32。CRC32函数返回值的范围是0-4294967296（2的32次方减1)。并将其设置为normal索引，查询的时候查它和url，那么会走url_tmp的索引，就能很快定位到所要的行了。

缺点：额外的字段空间，在大数据量下，CRC32重复率有点高。

## 索引优点

顺序io、减少扫描数据量、避免排序和临时表。

## 索引策略

### 1.索引列不能是表达式、不能是函数的参数

### 2.前缀索引

像上面的url的场景，可以用CRC32，也可以使用前缀索引。

方案：截取url前面具有区分度的串，作为索引。

问题：截取的长度该怎样才算适中。

解决： 

```mysql
#在原表中获取不同url的总数。
select count(*) as count,url from tb_table group by url order by count desc;
#适当增加截取长度left(url,n)，来看总数变化，总数接近原表，那就可取。
select count(*) as count,left(url,n) as url_tmp from tb_table group by url_tmp order by count desc;
```

缺点：前缀索引无法使用orderby和group by （group by 会对字段进行排序，所以会用到所以），也无法使用覆盖索引。

### 3.多列索引（不懂意思）

### 4.选择合适的索引列顺序

考虑区分度高的，同时要考虑排序、分组和范围等条件。

#### 区分度

```mysql
//field=value的记录和总行数。
select count(*) as count ,sum(`field`=value) as field_tmp from tb_table;
```

### 5.索引最好有序，便于插入

有序可以使得插入记录时在原有b+树的上次插入的位置后面进行插入，页满了，就新建一页。而无序会导致频繁页分裂操作，同时分裂频繁，页变得稀疏不规则（碎片化）。

顺序插入的缺点：并发下，最后一页的操作频繁，会有锁竞争（间隙锁、临键锁）。

### 6.覆盖索引

不需要回表操作。大多场景是查询索引字段，常用的优化手段是查询id并使用关联查询。

### 7.索引扫描做排序

1. 索引设计最好满足查找条件又满足排序。

2. 可以不满足最左匹配原则：

```mysql
#联合索引（a、b、c）
#可以使用索引，前提是查询为索引的第一列提供常量条件。
select * from tb_table where a=1 order by b、c;
```

3.如果关联多张表、则order by引用的字段必须全为第一张表时，才能使用索引排序。（待考察）

### 8.压缩（前缀）索引

### 9.冗余和重复索引

重复索引：多个同样的索引（字段，顺序一致），优化器也会逐个考虑，这会影响性能。

冗余索引：像联合索引（A、B），索引A，那么索引A就是冗余的。

重复索引是必须要删除的。而冗余索引要看情况。

原本索引是：（A），语句1查询效率很快。后来新增语句2是要查询A、B、C、D，那么扩展索引（A、B、C、D），建立成覆盖索引，语句2查询速度也提高了。但是语句1的效率却降低了。因为键变多了，每页的节点就少了。io次数增多。那么建立冗余索引也是允许的。

不过冗余索引意味着索引的需要维护更多的索引，那么增删改的效率会变低。具体看业务的需求。

### 10.未使用索引

```mysql
# read和fetch都为0，则没有被使用过。
SELECT 
 object_type, 
 object_schema, 
 object_name, 
 index_name, 
 count_star, 
 count_read, 
 COUNT_FETCH 
FROM 
 PERFORMANCE_SCHEMA.table_io_waits_summary_by_index_usage;
```

开启系统，跑一段时间，然后执行该语句。

具体查看：**table_io_waits_summary_by_index_usage **表的使用。

### 11.索引和锁

extra的using where 和filtered的关联。

using where表示存储引擎返回的记录，再server层还会进行过滤。

filtered的值是存储引擎返回的记录，在server层进行过滤后剩余的记录，这两者之间的占比。

所以没有using where，那么filtered都是100%。

## 案例学习

如果mysql使用某个索引进行范围查询，就无法使用另一个索引，或者是该索引的后续字段进行排序。

灵活使用in。

场景：联合索引（country、city、gender、age）

当查询时，选择了country、city、age，那么只会用到country和city索引，gender断了。

那么可以使用 。。。and gender in('男',‘女’) and age 。。。 拼接起来，就可以用到完整的索引了。不过in会使得组合变多，查询优化需要更多的时间和内存。



## 总结

查询时，不应该只优化语句，还应该结合具体的查询值来优化。因为总记录一样，查询值不一样，都会影响到查询的结果。（mysql性能优化中的覆盖索引）

执行计划应该会和匹配的记录做运算。因为查询为null的记录，有可能用到索引。而查询到有记录的语句，就不用到索引。

# 第六章 查询性能优化