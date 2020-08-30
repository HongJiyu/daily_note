# mongo的优势

1. mongo使用json进行存储，结构和对象十分类似。便于理解。
2. mongo存储的Json Document，很灵活 ，可以动态增加字段。扩展性很好。
3. mongo很少进行关联查询。数据可以存储在单表中，而不像mysql需要符合范式后进行关联查询。多表存储会导致关联时数据寻址过长。而mongo基本不需要进行关联查询，所以文档存储在同一个位置下。
4. 高可用：replica-set - 2-50个成员、自恢复、多中心容灾、滚动服务。
5. 横向扩展：多种数据分布策略、支持TB-PB级别。

# mongo的事务

4.0开始支持

# mongo的复制

## 优点：

数据分发：数据被分发到不同区域，用户不需要跨区访问数据。

读写分离：

异地容灾：某地故障，可以迅速切换到另一地方。

## 数据复制过程

主节点记录到oplog，从节点在主节点打开一个tailable游标，不断获取新进入主节点的oplog，然后在自己数据上回放，以此保持数据一致。

## 故障恢复

具有投票权的节点两两互发心跳。

5次心跳未收到则判断为节点失联。

主节点失联则从节点发起选举，选出主节点。从节点失联，不会重新选举。

基于RAFT一致性算法，选举成功必须条件是大多数投票节点存活。

复制集中最多可以有50个节点。具有投票权的节点最多只有7个。

## 影响选举因素

过半的节点存活。

能被选举为主节点的节点，必须：

- 能与多数节点建立连接。
- 具有教新的oplog
- 具有较高的优先级

复制节点常见选配项（config.members[x].fieldName = ）

- 是否具有投票权
- 优先级
- 隐藏：节点具有投票权，但优先级为0
- 延迟：复制n秒前的数据，主从保持时间差。

## 搭建mongo主从

在同一台服务器上搭建：

1. 配置不同数据目录、日志文件目录、监听端口，启动三个节点。
2. 配置使得三个实例成为复制集。

# mongo的全家桶

![image-20200823163223306](E:\0git_note\MongoDB\img\image-20200823163223306.png)

# 传统模型设计

| 概念模型                                                     | 逻辑模型                                     | 物理模型                         |
| ------------------------------------------------------------ | -------------------------------------------- | :------------------------------- |
| 用概念名词来描述现实中的实体及业务规则。由需求分析师（策划）沟通 | 基于概念模型，设计所有实体、实体属性、关系。 | 基于逻辑模型，设计数据库表结构。 |

# mongo的模型设计

从概念模型到逻辑模型即可，因为逻辑模型，知道实体和实体属性就基本可以建立文档了。

## 1.基础设计 

根据逻辑模型建立初步文档。

1对1：直接作为某个文档的字段

1对多：直接作为某个文档的内嵌数组

多对多：直接作为某个文档的内嵌数组，不过存在大量冗余。

老师和学生之间，多对多的关系。学生文档，存放多名老师的信息。（而存在一个班的学生，存放着同样的老师的信息。冗余）

## 2.工况细化

如果有了具体的业务，可以根据业务场景来优化文档设计。

```markdown
最频繁的数据查询
最频繁的写入模式
读写操作比例
数据量的大小
```

比如：在逻辑模型中存在关联关系的实体，不放在同一个文档里，而是通过引用的方式。

mongo的3.4版本提供了lookup，类似mysql的join操作。要在聚合下使用。

```js
//contact集合和groups集合，根据contact集合的group_ids字段join groups集合的group_id ，并起别名为groups
db.contacts.aggregate([
    {
        $lookup:{
            from:"groups",
            localField:"group_ids",
            foreignField:"group_id",
            as:"groups"
        }
    }
])
```

场景：某一个字段过大，5-10M，而mongo一个文档最大不能超过16M。

所以放到其他集合里面，需要的时候关联查询，不需要就不关联。

总结：使用引用去优化。：字段过大、字段数据持续增长没有封顶、频繁修改（而且需要修改文档数多）。

引用的缺陷：无主外键检查，$lookup只支持left outer join ，关联目标不能是分片表。

## 3.套用模式设计

场景：记录所有飞机每分钟的状态（位置、状态）信息。

设计：每分钟一条文档。10万架飞机。记录1年。

那么数据量是500多亿条。 10W\*365\*24\*60 。那么索引也是非常巨大的。总的来说数据量百亿，数据大小10TB级别。

![image-20200825214422856](E:\0git_note\MongoDB\img\image-20200825214422856.png)

解决：采用分桶，每小时一个文档，文档数组字段保存60分钟的数据。

数据对比：文档数量少了60倍。数据大小，小在公共字段和索引大小。

![image-20200825214428034](E:\0git_note\MongoDB\img\image-20200825214428034.png)



分桶模式：

![image-20200825214516713](E:\0git_note\MongoDB\img\image-20200825214516713.png)



其他模式：

![image-20200825214557555](E:\0git_note\MongoDB\img\image-20200825214557555.png)

# 设计模式集锦

前面的分桶。

## 版本号

![image-20200825215838790](E:\0git_note\MongoDB\img\image-20200825215838790.png)

通过记录文档的版本号，以区分一些操作是需要在哪个版本进行操作。

## 取近似值

![image-20200825215931392](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20200825215931392.png)

场景：记录点击量。

如果点击一次就记录，那么会很频繁，如果流量大，mongo的写操作就非常巨大。

采用近似值， 如果生成的近似值为0，则一次添加10。这种用于不需要很精确，但又满足需求，写操作减少了10倍。

```js
if random(0,9) === 0
	increment by 10
```

![image-20200825220157588](E:\0git_note\MongoDB\img\image-20200825220157588.png)



## 预先统计

场景：需要聚合所有文档，进行统计分析。

解决：多增加几个字段，存储聚合数据。

![image-20200825220304376](E:\0git_note\MongoDB\img\image-20200825220304376.png)

![image-20200825220314587](E:\0git_note\MongoDB\img\image-20200825220314587.png)



# mongo的事务（持久、隔离、一致）

## writeConcern：

```json
writeConcern:{
    {
        //数据同步到多少个节点，才响应成功。
        w: (0-max node)/majory/all,
        // 写操作修改了内存就会返回了，强制记录到日志落盘。持久性
        j: true,
        //写操作没响应，超时时间
    	wtimeout:1000
    
	}
}

```

### 使用

`db.collectionName.insert({},{writeConcern:{w:majory}})`

### 演示效果

可以通过前面的设置从节点同步延时。再在主节点插入数据，会看到出现等待。只有到延时到了，从节点同步数据，才会显示成功。

## readPreference

决定使用哪一个节点来满足正在发起的读请求

```js
{
    primary //从主节点
    primaryPreferred //优先主节点，不然从节点
    secondary // 从节点
    secondaryPreferred //优先从节点，不然主节点
    nearest //最近的地区
}
```

指定到某个节点。使用tag

```js
//为节点打上
{ 
  purpose:"xxx"  
}
//读取时指定某个purpose。
```

### 使用：

通过mongo的连接串参数：

`mongodb://host1:xx,host2:xx,host3:xx/?replicaSet=rs&readPreference=secondary`

通过mongodb驱动程序api：

`mongoCollection.withReadPreference(ReadPreference readPref)`

mongo shell:

`db.collection.find({}).readPref("secondary")`

### 演示效果

设置从节点同步延时，readPref("secondary")，同样可以看出，数据要等延时后才能查看到。

## readConcern

决定哪些数据可读，类似关系数据库的隔离级别。

available：都所有可用的数据。

local：读所有可用的数据，而且属于当前节点。

majority：读取大多数节点上提交完成的数据。 对应read commited

linearizable：可线性读取文档。

snapshot：读取最近快照中的数据。

1. available和local 的区别：在复制集没有任何区别。在分片集有区别：chunkx从shard1向shard2迁移时。在迁移过程中，chunkx仍旧属于shard1，但是在shard2读时，如果采用available，会将chunkx的数据也读出来。如果采用local，则不会读取到chunkx。只有到迁移完成了，chunkx真正属于shard2，那么local和available读取出的数据才是一致的。

   注意：主节点读默认是local，从节点默认是available。

2. 使用majority需要设置enableMajorityReadConcern。使用majority可以读到的数据是不会被回滚了。

   例子：writeConcern 是1时，只有主节点自己有数据，那么从节点还没同步，主节点宕机的，那么重新选举某个从节点，那么原主节点的这条数据就丢失了。而如果`{writeConcern:majority}`，那么能够保证数据不会丢失。所以读使用`readConcern("majory")`也能保证读到的数据是同步到多个节点的，那么这个数据也就不会被丢失。



3. linearizable 使用场景：

   复制集，主节点出现脑裂。随后出现更新操作，再出现读取操作，而且读的是主节点。采用majority，主节点返回x=1。

   解决：使用linearizable，这种读取会去所有节点读，然后获取到最新的数据。

   缺点：只对读取单个文档有效、效率低。

![image-20200830164850743](E:\0git_note\MongoDB\img\image-20200830164850743.png)



# mongo的事务

![image-20200830171712013](E:\0git_note\MongoDB\img\image-20200830171712013.png)

注意：

![image-20200830172319221](E:\0git_note\MongoDB\img\image-20200830172319221.png)

案例：

![image-20200830173024358](E:\0git_note\MongoDB\img\image-20200830173024358.png)

![image-20200830173100490](E:\0git_note\MongoDB\img\image-20200830173100490.png)

![image-20200830173117412](E:\0git_note\MongoDB\img\image-20200830173117412.png)

![image-20200830173205898](E:\0git_note\MongoDB\img\image-20200830173205898.png)

![image-20200830173253563](E:\0git_note\MongoDB\img\image-20200830173253563.png)

![image-20200830173301060](E:\0git_note\MongoDB\img\image-20200830173301060.png)