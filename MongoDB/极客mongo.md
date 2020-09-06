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

![image-20200823163223306](img\image-20200823163223306.png)

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

![image-20200825214422856](img\image-20200825214422856.png)

解决：采用分桶，每小时一个文档，文档数组字段保存60分钟的数据。

数据对比：文档数量少了60倍。数据大小，小在公共字段和索引大小。

![image-20200825214428034](img\image-20200825214428034.png)



分桶模式：

![image-20200825214516713](img\image-20200825214516713.png)



其他模式：

![image-20200825214557555](img\image-20200825214557555.png)

# 设计模式集锦

前面的分桶。

## 版本号

![image-20200825215838790](img\image-20200825215838790.png)

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

![image-20200825220157588](img\image-20200825220157588.png)



## 预先统计

场景：需要聚合所有文档，进行统计分析。

解决：多增加几个字段，存储聚合数据。

![image-20200825220304376](img\image-20200825220304376.png)

![image-20200825220314587](img\image-20200825220314587.png)



# writeConcern

https://docs.mongodb.com/manual/reference/write-concern/

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

在3.2的版本之后，j和w是可以兼容的，j为true，而且w为major。会要求major个节点都写日志才会返回。

## 使用

`db.collectionName.insert({},{writeConcern:{w:majory}})`

## 演示效果

可以通过前面的设置从节点同步延时。再在主节点插入数据，会看到出现等待。只有到延时到了，从节点同步数据，才会显示成功。

## 作用

writeConcern的w可以保证多节点下数据一致，j也是。

w：如果是1。在三节点下，如果有更新数据1，主节点写成功。数据1还没同步到其他节点，那么宕机了。重新选举主节点。那么数据1丢失了。如果w的值是majory，那么过半才响应。在写完后，即使主节点宕机了。也有其他从节点拥有数据1，而且会被选举为父节点，那么数据1就永远不会丢失。

j：write操作前，先记录到日志。

# readPreference

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

## 使用：

通过mongo的连接串参数：

`mongodb://host1:xx,host2:xx,host3:xx/?replicaSet=rs&readPreference=secondary`

通过mongodb驱动程序api：

`mongoCollection.withReadPreference(ReadPreference readPref)`

mongo shell:

`db.collection.find({}).readPref("secondary")`

## 演示效果

设置从节点同步延时，readPref("secondary")，同样可以看出，数据要等延时后才能查看到。

# readConcern

https://docs.mongodb.com/manual/reference/read-concern/

决定哪些数据可读，类似关系数据库的隔离级别。

available：读所有可用的数据。no guarantee that the data has been written to a majority of the replica set members

local：读所有可用的数据，而且属于当前节点。no guarantee that the data has been written to a majority of the replica set members

majority：读取大多数节点上提交完成的数据并且已经持久化。 guarantees that the data read has been acknowledged by a majority of the replica set members。 要求写是writeconcern：majority。否则会读不到数据。

linearizable：可线性读取文档。

snapshot：读取最近快照中的数据。Read concern `"snapshot"` is only available for [multi-document transactions](https://docs.mongodb.com/manual/core/transactions/).

1. available和local 的区别：在复制集没有任何区别。在分片集有区别：chunkx从shard1向shard2迁移时。在迁移过程中，chunkx仍旧属于shard1，但是在shard2读时，如果采用available，会将chunkx的数据也读出来。如果采用local，则不会读取到chunkx。只有到迁移完成了，chunkx真正属于shard2，那么local和available读取出的数据才是一致的。

   注意：主节点读默认是local，从节点默认是available。

2. 使用majority需要设置enableMajorityReadConcern。使用majority可以读到的数据是不会被回滚了。

   例子：writeConcern 是1时，只有主节点自己有数据，那么从节点还没同步，主节点宕机的，那么重新选举某个从节点，那么原主节点的这条数据就丢失了。而如果`{writeConcern:majority}`，那么能够保证数据不会丢失。所以读使用`readConcern("majory")`也能保证读到的数据是同步到多个节点的，那么这个数据也就不会被丢失。

```js
	Each replica set member maintains, in memory, a view of the data at the majority-commit point; the majority-commit point is calculated by the primary. To fulfill read concern "majority", the node returns data from this view and is comparable in performance cost to other read concerns.
    为了实现读取关注点的“多数”,每个复制集成员在内存中维护一个主要提交点的数据视图;多数提交点是由主服务器计算的。节点从这个视图返回数据，并且在性能成本上与其他读取关注点相当。
```

3. linearizable 使用场景：

   复制集，主节点出现脑裂。随后出现更新操作，再出现读取操作，而且读的是主节点。采用majority，主节点返回x=1。

   解决：使用linearizable，这种读取会去所有节点读，然后获取到最新的数据。

   缺点：只对读取单个文档有效、效率低。

![image-20200830164850743](img\image-20200830164850743.png)

4. snapshot

# mongo的事务

https://docs.mongodb.com/manual/core/transactions/

In MongoDB, an operation on a **single document is atomic**.  this single-document atomicity obviates the need for multi-document transactions for many practical use cases.

For situations that require atomicity of reads and writes to multiple documents , MongoDB supports multi-document transactions. With distributed transactions, transactions can be used **across multiple operations, collections, databases, documents, and shards.**

clients **must** use MongoDB drivers updated for MongoDB 4.2.

When using the drivers, each operation in the transaction **must** be associated with the session.

```js
  // For a replica set, include the replica set name and a seedlist of the members in the URI string; e.g.
  // const uri = 'mongodb://mongodb0.example.com:27017,mongodb1.example.com:27017/?replicaSet=myRepl'
  // For a sharded cluster, connect to the mongos instances; e.g.
  // const uri = 'mongodb://mongos0.example.com:27017,mongos1.example.com:27017/'

  const client = new MongoClient(uri);
  await client.connect();

  // Prereq: Create collections.

  await client.db('mydb1').collection('foo').insertOne({ abc: 0 }, { w: 'majority' });

  await client.db('mydb2').collection('bar').insertOne({ xyz: 0 }, { w: 'majority' });

  // Step 1: Start a Client Session
  const session = client.startSession();

  // Step 2: Optional. Define options to use for the transaction
  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' }
  };

  // Step 3: Use withTransaction to start a transaction, execute the callback, and commit (or abort on error)
  // Note: The callback for withTransaction MUST be async and/or return a Promise.
  try {
    await session.withTransaction(async () => {
      const coll1 = client.db('mydb1').collection('foo');
      const coll2 = client.db('mydb2').collection('bar');

      // Important:: You must pass the session to the operations

      await coll1.insertOne({ abc: 1 }, { session });
      await coll2.insertOne({ xyz: 999 }, { session });
    }, transactionOptions);
  } finally {
    await session.endSession();
    await client.close();
  }
```



Starting in MongoDB 4.2, the two terms are synonymous. Distributed transactions refer to multi-document transactions on sharded clusters and replica sets

从MongoDB 4.2开始，这两个术语是同义词。分布式事务是指分片集群和复制集上的多文档事务。

**In version 4.0**, MongoDB supports multi-document transactions on replica sets.

**In version 4.2**, MongoDB introduces distributed transactions, which adds support for multi-document transactions on sharded clusters and incorporates the existing support for multi-document transactions on replica sets.

## Create Collections and Indexes In a Transaction

https://docs.mongodb.com/manual/core/transactions/#create-collections-and-indexes-in-a-transaction

In MongoDB 4.2 and earlier, you **cannot create collections in transctions**. Write operations that result in document inserts must be on existing collections if run inside transactions.

Starting in MongoDB 4.4, you **can create collections in transactions implicitly or explicitly**. You must use MongoDB drivers updated for 4.4, however. **unless the transaction is a cross-shard write transaction**.

在4.4版本可以在事务内创建集合和索引，除了是跨分片。具体看链接。

## Count Operate

https://docs.mongodb.com/manual/core/transactions/#count-operation

The 4.0 drivers have deprecated the `count()` API.

Starting in MongoDB 4.0.3, the [`mongo`](https://docs.mongodb.com/manual/reference/program/mongo/#bin.mongo) shell provides the [`db.collection.countDocuments()`](https://docs.mongodb.com/manual/reference/method/db.collection.countDocuments/#db.collection.countDocuments) helper method that uses the [`$group`](https://docs.mongodb.com/manual/reference/operator/aggregation/group/#pipe._S_group) with a [`$sum`](https://docs.mongodb.com/manual/reference/operator/aggregation/sum/#grp._S_sum) expression to perform a count.

## Distinct Operation

https://docs.mongodb.com/manual/core/transactions/#distinct-operation

For sharded collections, you cannot use the [`db.collection.distinct()`](https://docs.mongodb.com/manual/reference/method/db.collection.distinct/#db.collection.distinct) method or the [`distinct`](https://docs.mongodb.com/manual/reference/command/distinct/#dbcmd.distinct) command.

To find the distinct values for a sharded collection, use the aggregation pipeline with the [`$group`](https://docs.mongodb.com/manual/reference/operator/aggregation/group/#pipe._S_group) stage instead.

```js
db.coll.aggregate([
   { $match: { status: "A" } },
   { $group: { _id: null, distinctValues: { $addToSet: "$x" } } },
   { $project: { _id: 0 } }
])

{ "distinctValues" : [ 2, 3, 1 ] }
```

## session and transaction

https://docs.mongodb.com/manual/core/transactions/#transactions-and-sessions

When using the drivers, each operation in the transaction must be associated with the session

If a session ends and it has an open transaction, the transaction aborts.

Transaction and read Preference

transaction-level <- session-level <- client-level   by default ,is primary

## Transactions and Read Concern

transaction-level <- session-level <- client-level   by default ,is local

Transactions support the following read concern levels:

#### `"local"`

- Read concern [`"local"`](https://docs.mongodb.com/manual/reference/read-concern-local/#readconcern."local") returns the most recent data available from the node but can be rolled back.
- For transactions on sharded cluster, [`"local"`](https://docs.mongodb.com/manual/reference/read-concern-local/#readconcern."local") read concern cannot guarantee that the data is from the same snapshot view across the shards. If snapshot isolation is required, use ["snapshot"](https://docs.mongodb.com/manual/core/transactions/#transactions-read-concern-snapshot) read concern.
- Starting in MongoDB 4.4, with [feature compatibility version (fcv)](https://docs.mongodb.com/manual/reference/command/setFeatureCompatibilityVersion/#view-fcv) `"4.4"` or greater, you can [create collections and indexes](https://docs.mongodb.com/manual/core/transactions/#transactions-create-collections-indexes) inside a transaction. If [explicitly](https://docs.mongodb.com/manual/core/transactions-operations/#transactions-operations-ddl-explicit) creating a collection or an index, the transaction must use read concern [`"local"`](https://docs.mongodb.com/manual/reference/read-concern-local/#readconcern."local"). [Implicit](https://docs.mongodb.com/manual/core/transactions-operations/#transactions-operations-ddl-implicit) creation of a collection can use any of the read concerns available for transactions.

#### `"majority"`

- Read concern [`"majority"`](https://docs.mongodb.com/manual/reference/read-concern-majority/#readconcern."majority") returns data that has been acknowledged by a majority of the replica set members (i.e. data cannot be rolled back) **if** the transaction commits with [write concern “majority”](https://docs.mongodb.com/manual/core/transactions/#transactions-write-concern).
- If the transaction does not use [write concern “majority”](https://docs.mongodb.com/manual/core/transactions/#transactions-write-concern) for the commit, the [`"majority"`](https://docs.mongodb.com/manual/reference/read-concern-majority/#readconcern."majority") read concern provides **no** guarantees that read operations read majority-committed data.
- For transactions on sharded cluster, [`"majority"`](https://docs.mongodb.com/manual/reference/read-concern-majority/#readconcern."majority") read concern cannot guarantee that the data is from the same snapshot view across the shards. If snapshot isolation is required, use ["snapshot"](https://docs.mongodb.com/manual/core/transactions/#transactions-read-concern-snapshot) read concern.



#### `"snapshot"`

- Read concern [`"snapshot"`](https://docs.mongodb.com/manual/reference/read-concern-snapshot/#readconcern."snapshot") returns data from a snapshot of majority committed data **if** the transaction commits with [write concern “majority”](https://docs.mongodb.com/manual/core/transactions/#transactions-write-concern).
- If the transaction does not use [write concern “majority”](https://docs.mongodb.com/manual/core/transactions/#transactions-write-concern) for the commit, the [`"snapshot"`](https://docs.mongodb.com/manual/reference/read-concern-snapshot/#readconcern."snapshot") read concern provides **no** guarantee that read operations used a snapshot of majority-committed data.
- For transactions on sharded clusters, the [`"snapshot"`](https://docs.mongodb.com/manual/reference/read-concern-snapshot/#readconcern."snapshot") view of the data **is** synchronized across shards.



## Transactions and Write Concern

Write operations inside transactions must be issued without explicit write concern specification and use the default write concern. At commit time, the writes are then commited using the transaction-level write concern.

事务内部的写操作必须在没有显式写关注规范的情况下发出，并使用默认的写关注。在提交时，然后使用事务级的写关注点来提交写操作。

Do not explicitly set the write concern for the individual write operations inside a transaction. Setting write concerns for the individual write operations inside a transaction results in an error.

不要为事务内的各个写操作显式设置写关注。为事务内的各个写操作设置写关注点会导致错误。

transaction-level <- session-level <- client-level   by default ,is {w:1}

#### `w: 1`

- Write concern [`w: 1`](https://docs.mongodb.com/manual/reference/write-concern/#writeconcern.) returns acknowledgement after the commit has been applied to the primary.

  IMPORTANT

  When you commit with [`w: 1`](https://docs.mongodb.com/manual/reference/write-concern/#writeconcern.), your transaction can be [rolled back if there is a failover](https://docs.mongodb.com/manual/core/replica-set-rollbacks/).

- When you commit with [`w: 1`](https://docs.mongodb.com/manual/reference/write-concern/#writeconcern.) write concern, transaction-level [`"majority"`](https://docs.mongodb.com/manual/reference/read-concern-majority/#readconcern."majority") read concern provides **no** guarantees that read operations in the transaction read majority-committed data.

- When you commit with [`w: 1`](https://docs.mongodb.com/manual/reference/write-concern/#writeconcern.) write concern, transaction-level [`"snapshot"`](https://docs.mongodb.com/manual/reference/read-concern-snapshot/#readconcern."snapshot") read concern provides **no** guarantee that read operations in the transaction used a snapshot of majority-committed data.

#### `w: "majority"`

- Write concern [`w: "majority"`](https://docs.mongodb.com/manual/reference/write-concern/#writeconcern."majority") returns acknowledgement after the commit has been applied to a majority (M) of voting members; i.e. the commit has been applied to the primary and (M-1) voting secondaries.
- When you commit with [`w: "majority"`](https://docs.mongodb.com/manual/reference/write-concern/#writeconcern."majority") write concern, transaction-level [`"majority"`](https://docs.mongodb.com/manual/reference/read-concern-majority/#readconcern."majority") read concern guarantees that operations have read majority-committed data. For transactions on sharded clusters, this view of the majority-committed data is not synchronized across shards.
- When you commit with [`w: "majority"`](https://docs.mongodb.com/manual/reference/write-concern/#writeconcern."majority") write concern, transaction-level [`"snapshot"`](https://docs.mongodb.com/manual/reference/read-concern-snapshot/#readconcern."snapshot") read concern guarantees that operations have from a synchronized snapshot of majority-committed data.



Regardless of the [write concern specified for the transaction](https://docs.mongodb.com/manual/core/transactions/#transactions-write-concern), the commit operation for a sharded cluster transaction includes some parts that use `{w: "majority", j: true}` write concern.

不管为事务指定的写关注点是什么，分片集群事务的提交操作都包括一些使用{w: "majority"， j: true}写关注点的部分。



other：https://docs.mongodb.com/manual/core/transactions/#general-information









![image-20200830171712013](img\image-20200830171712013.png)



持久化：使用writeconcern，写到journal日志即可。默认的存储引擎：wiredtiger会使用过checkpoint。隔一段时间会将该点的数据刷盘，如果出现在checkpoint之间出现宕机，那么就需要journal去恢复某个checkout之后发生的操作。



注意：

![image-20200830172319221](img\image-20200830172319221.png)

案例：

![image-20200830173024358](img\image-20200830173024358.png)

![image-20200830173100490](img\image-20200830173100490.png)

![image-20200830173117412](img\image-20200830173117412.png)

![image-20200830173205898](img\image-20200830173205898.png)

![image-20200830173253563](img\image-20200830173253563.png)

![image-20200830173301060](img\image-20200830173301060.png)

# mongodb开发最佳实践

## 连接串

![image-20200831224925148](img\image-20200831224925148.png)

![image-20200831224952089](img\image-20200831224952089.png)



![image-20200831225030031](img\image-20200831225030031.png)

## 使用域名

![image-20200831225942722](img\image-20200831225942722.png)

## 负载均衡

![image-20200831230016730](img\image-20200831230016730.png)

## 事务

![image-20200831230248776](img\image-20200831230248776.png)

## 游标

![image-20200831230451431](img\image-20200831230451431.png)

## 索引

![image-20200831230505182](img\image-20200831230505182.png)

## 写操作

![image-20200831230528577](img\image-20200831230528577.png)

## 文档规范

![image-20200831230544797](img\image-20200831230544797.png)

## 分页

![image-20200831230554317](img\image-20200831230554317.png)

![image-20200831230601502](img\image-20200831230601502.png)