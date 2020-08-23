# mongo的优势

1. mongo使用json进行存储，结构和对象十分类似。便于理解。
2. mongo存储的Json Document，很灵活 ，可以动态增加字段。扩展性很好。
3. mongo很少进行关联查询。数据可以存储在单表中，而不像mysql需要符合范式后进行关联查询。多表存储会导致关联时数据寻址过长。而mongo基本不需要进行关联查询，所以文档存储在同一个位置下。
4. 高可用：replica-set - 2-50个成员、自恢复、多中心容灾、滚动服务。
5. 横向扩展：多种数据分布策略、支持TB-PB级别。

# mongo的事务

4.0开始支持

# mongo的全家桶

![image-20200823163223306](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20200823163223306.png)

