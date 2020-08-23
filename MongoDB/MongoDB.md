mongo是库、集合、文档。

集合可以放任意格式的文档，但是建议放同一类型的文档。

mongo shell 是功能完备的javascript解释器，使用js的语法。

```js
show dbs //显示使用库（有内容），和占用空间。
db //当前连接的库
use xxx  //转换库、创建库。
db.dropDatabase() //删除库
show users //显示用户

//不需要创建集合，可以直接通过操作文档来创建库。
db.fruit.insert({name:"apple"});

db.getCollection("user")  // 兼容性比较好，不过也可以使用db.user 前提是当前库没有user这个属性，不然优先返回属性而非集合
db.getCollectionNames() //获取所有集合名
show collections //同上
db.user.drop(); //删除集合
```

**查看某个函数的源码：不输入括号。**

# 数据类型

## 数字（老版本）

	javascript只有数字类型，而mongodb有（32位整数，64位整数，64位浮点数），而shell是使用javascript的解释器，所以存在问题number按什么条件转为3种类型。
	
	默认情况，shell中的数字被mongo当作是双精度数（64位浮点数）。
	
	当通过shell从库中取32位整数，然后再录入进去时，这个整数变成了64位浮点数。
	
	当mongo是整数，然后通过shell获取出来时。

64位的整数无法被64位的浮点数完全表示。就会出现：内嵌文档。

```js
{
    'id':{
        'floatApprox':3  //64位浮点数近视表示64位整数
    }
}
```



## 日期

日期类型用new Date() ，这样日期才是date类型。

不用Date(xxx)，这种返回的字符串类型。

```js
> db.test.insert({'date':new Date()})
WriteResult({ "nInserted" : 1 })
> db.test.insert({'date':Date('2000/1/1')})
WriteResult({ "nInserted" : 1 })
> db.test.find({date:{$type:2}})  //查找date是字符串的文档
{ "_id" : ObjectId("5f240a4cf80d468862af45ea"), "date" : "Fri Jul 31 2020 20:10:52 GMT+0800" }
> db.test.find({date:{$type:9}}) //查找date是date类型的文档
{ "_id" : ObjectId("5f240a24f80d468862af45e9"), "date" : ISODate("2020-07-31T12:10:12.106Z") }
```



## 数组

数组可以存放不同数据类型的元素，可以添加索引，提高性能。

## 内嵌文档：

内嵌文档其实就是文档内部嵌了另一个文档，或者说：对象里面存放了一个对象。

在mysql中，学生表里面只需要存放班级的id，两个表之间关联起来。

而mongo是：学生集合里面存放班级的信息，这样班级的信息就是内嵌文档，容易导致信息重复。

```
{
    'name':'hjy',
    'id':'16124120000',
    'class':{
        name:'5-6',
        number:30
    }
}
```



## ObjectId 12字节

每个字节用两位十六进制数字表示，也就是24位字符串 （时间戳、机器、pid、seq）。

不同的机器也能产生唯一的值。

# CURD文档

## 创建

批量插入的速度会快很多，因为不需要发起多次请求，服务器也就不需要每次都去解析请求。

批量插入消息最大长度是16MB，

MongoDB使用驱动程序插入时会转换成BSON的形式，然后再传入数据库，数据库解析，检验是否包含"_id",并且文档不超过4MB，然后就直接存入数据库。

MongoDB在插入不执行代码，不像mysql，会去执行sql语句，所以这块是没有注入式攻击的可能。

**大于4MB的BSON格式的文档是不可能存入数据库。批量插入的最大也是16MB**

```js
//返回插入的行数。
db.test.insert({'test':'333'})  //单条插入 
db.test.insert([{'test':'111'},{'test2':'222'}]) //批量插入
//可以用one和many，返回insertedIds。
db.fruit.insertOne({name:"banana",price:20});
db.fruit.insertMany([{name:"banana1",price:20},{name:"banana2",price:20}]);
```



## 删除

db.student.remove({})  //只删除文档，不会删除集合和索引

db.drop_collection("集合名") //删除集合和索引。

## 更新

更新是原子性的。先到先执行。

`db.student.update({},variable) //这种修改是覆盖`

这种修改一般是用于改变比较大的字段。

而且修改是符合条件的第一个文档被修改。

配置：`db.student.update({},variable,false,true)`第四个参数true，就是修改所有符合条件的。

其他：使用updateOne，updateMany，也可以更新多条文档

### 修改器

一个修改器可以修改多个属性，但是一个属性不能被多个修改器修改。

#### $inc
`db.posts.update({'title':'title1'},{'$inc':{'seq':1}}); 不存在时会创建，且在0的基础上+1`

只能修改数字，其他会报错。

#### $set

`db.posts.update({'title':'title1'},{'$set':{'book':'javascript'}});  //没有则添加这个属性，有则覆盖。也可以修改内嵌文档`

**在文档大小不发生变化时立即修改，否则性能会下降，因为预留位置不够，会被移动。**

#### $unset 

删除某个属性。

#### 数组修改器

$push

```js
$push db.posts.update({'title':'title1'},{"$push":{"array":"hjy"}})//给符合条件的第一个文档的array属性push一个字符串'hjy'
db.test.update({'test':'111'},{"$push":{"array":["hjy",'hjy22','hjy333']}})//给符合条件的第一个文档的array属性push一个数组，而不是批量push，批量push则搭配$each
```

$ne 

```js
//针对array不存在hjy字符串的文档，选取第一个，为它push'hjy'
db.posts.update({'array':{"$ne":"hjy"}},{"$push":{"array":"hjy"}})
```

$addToSet

```js
//为符合条件的第一个文档添加'hjy1'字符串，如果不存在才添加
db.posts.update({'title':'title1'},{"$addToSet":{"array":'hjy1'}})
```

$each 和$addToSet 

```js
//遍历添加未曾添加过的值。
db.posts.update({
    'title': 'title1'
}, {
    "$addToSet": {
        "array": {
            "$each": ["hjy", "hjy1", "hjy2", "hjy3", 'hjy4']
        }
    }
})
```

$pop 

```js
{$pop:{key:1}} //从尾部删除一个
{$pop:{key:-1}} //从头部删除一个
//例子
db.test.update({'test':'111'},{'$pop':{'array':1}})
```

$pull

```js
//会将array中所有的hjy删除掉。
db.test.update({'test':'111'},{'$pull':{'array':'hjy'}}) 
```

$

数据：文档有一个数组（posts），数组存放内嵌文档，内嵌文档有name属性（name）。

场景：要找到内嵌文档name是hjy的文档，并修改为hjy zheli

```js
//$是定位符
db.test.update({'posts.name':'hjy'},{'$set':{'posts.$.name':'hjy zheli'}})
```

#### update参数

```js
//修改，如果没有就新增。第三个参数为true
db.posts.update({'title':'title1'},{'$incr':{'seq':1}},true);
```

```js
//更新，是对符合条件的文档，选取第一个进行操作。更新多个文档,则第四个参数为true：
db.posts.update({'title':'title1'},{'$incr':{'seq':1}},false,true);  
```

#### save

```js
//存在就修改，不存在就创建，在shell中可以，在navicat报错。
var one=db.food.findOne()
one.name="hjy"
db.food.save(one)

```



## 查找

```js
//使用find最多显示20个匹配文档，不写参数会默认匹配所有
db.student.find() 
```

### 指定返回字段

```js
//默认全返回，字段为0则表示不返回，为1则表示要返回。
//只有1则只会返回1；只有0则不会返回0；有0有1则只会返回1.
// '_id'不做设置的话，都会被返回。
db.posts.find({},{'username':1,'email':1,'_id':0})
```

### 指定查询条件

使用运算符。

```js
// $lt $lte $gt $gte  （$ne 不相等）
db.test.find({'age':{'$gt':18,'$lt':30}})
db.test.find({'age':{'$ne':'joe'}})
```

```js
//$in $nin 
db.test.find({'age':{'$in':['xx','xx','xx']}})
```

```js
//$or
db.test.find({'$or':[{'title':'title1'},{'seq':'1'}]}) 
```

```js
//$mod  
db.test.find({'age':{'$mod':[5,1]}}) 查询结果和5取模，如果余数为1则是需要被返回的。
```

```js
//$not
db.test.find({'age':{'$not':{'$mod':[5,1]}}})
```

**一个键可以有多个条件，但是一个键不能对应多个更新修改器。不过查询条件没有这种限制**

```js
{'$inc':{'age':1},'$set':{age:40}}  //这种是不允许的。
```

```js
//null：不仅匹配自身，而且匹配不存在这个键的文档。
db.posts.find('z',null)  //会返回z为null的文档，也会返回不包含z这个键的文档。
db.posts.find({'z':{'$in':[null],'exists':true}})
```



### 查询数组
前提：`db.food.insert({'fruit':['11','22','33']})`

```js
db.food.find({'fruit':'11'}) //能查找得到上面插入的文档

db.food.find({'fruit':{'$all':['11','22']}}) //查找包含'11'和'22'两个值的文档。

db.food.find({'fruit.2':'peach'}) //指定数组下标的值

db.food.find({'fruit':{$size:3}}) //查找fruit数组长度是3的文档

db.food.findOne({},{'fruit':{'$slice':2}}) //查询出来的文档的fruit数组取前两个
```

### 查询内嵌文档

**查询内嵌文档要全部匹配，包括顺序：**

```js
//插入数据
db.food.insert({'name':'apple','other':{'other1':11,'other2':22}})
//查找内嵌文档，顺序颠倒，查找不到。
db.food.find({'other':{'other2':22,'other1':11}})
```

**其他区别**

```js
//插入数据
db.food.insert({'name':'apple','other':{'other1':11,'other2':22}})
//查询
//查询到上面的语句
db.food.find({"other.other1":11});
//查询的是other的值为{other:11}的文档，而不是other.other1为11.
db.food.find({other:{other1:11}});
```



#### $elemMatch

查询**数组里面的内嵌文档**，要求这个文档符合条件才返回，而不是所有内嵌文档有一点符合才返回。

```js
db.food.insert({
    "content": "...",
    "comments": [
        {
            "author": 'joe',
            'score': 3,
            'comment': 'nice post'
        },
        {
            "author": 'mary',
            'score': 6,
            'comment': 'nice post'
        },
        
    ]
})
场景：要求内嵌文档中，有内嵌文档符合author是joe并且score大于或者等于5的文档。
使用：以下语句会返回上面的两个文档，因为查询条件在两个内嵌文档都能找到对应符合的属性，所以能返回。
db.food.find({
    'comments.author': 'joe',
    'comments.score': {
        '$gte': 5
    }
})

使用：以下语句不会返回上面的文档，因为没有一个内嵌文档符合全部条件。（一般是这种场景。）
db.food.find({
    'comments': {
        '$elemMatch': {
            'author': 'joe',
            'score': {
                '$gte': 5
            }
        }
    }
})


```

#### where 查询

查询的最高级写法，性能较差：

```js
db.foo.find('$where':function(){
	for(var current in this)
	{
		for(var other in this)
		{
			ifI(xxx) return true;
		}
	}
})
```

### 查询内嵌文档和数组的区别

查询内嵌文档，指定内嵌文档的值那么就必须全部匹配。

```js
//other是内嵌文档，other完全是{'other2':22,'other1':11} 这种顺序格式，才会返回查询结果。
db.food.find({'other':{'other2':22,'other1':11}})
db.food.find({'other.other2':22}) //可以查询到
```

查询数组，只要数组内有满足条件的就会返回。

```js
//db.food.insert({'fruit':['11','22','33']})
db.food.find({'fruit':'11'}) //能查找得到上面插入的文档
```

查询数组内嵌文档时，一定要考虑清楚，使用$elemMatch



## 游标

find 返回的只是一个游标。可以用next方法，hasNext查看是否有结果。也可以用foreach。
find的时候，shell并不立即查询数据库，而是等要结果的时候才发送查询。所以可以拼接很多方法，游标对象的方法返回的都是游标对象。
db.foo.find().sort({'x':1}).limit(1).skip(10)。
场景：查出所有，再遍历，挨个变大，再save。
问题：原先的位置不够大，会被移动，那么游标跟着移动，导致循环问题。mongo中如果有操作是会改变文档的大小，性能会下降。因为需要补充空间，遍历也需要耗费时间。

db.student.find().skip(0).limit(3)  skip和limit可以单独使用

每次查询都是取前100条或者4MB（选择最小的一个），然后下次next就不会再去取，而是等用完了，再去服务器取。

## 其他

getLastError  获取影响信息

findAndModify 获取修改的文档

shell会返回结果。驱动程序不会。

mongo 为每一个连接创建一个队列，存放请求。

# 索引

```js
//创建索引，其命名为 date_1_username_-1
db.collection.ensureIndex({'date':1,'username':-1})
//自定义索引名
db.collection.ensureIndex({'test':1},{'name':'index_name'});
//创建索引在后台运行，期间不会阻塞请求。
db.collection.ensureIndex({'username':1},{'background':true});
```

## 创建唯一索引

```js
//如果已有的文档上存在非唯一，那么可以如下配置，那么会顺利建立唯一索引，因为会匹配第一个，后面重复的都会被删除。
db.collection.ensureIndex({'userName':1},{'unique':true,'dropDups':true})
```

## 删除索引

```js
db.collection.dropIndexes();  //remove all index
db.collection.dropIndex({'userName':1})
```

## 地理空间索引

```js
//创建索引,默认是-180到180
db.collection.ensureIndex('gps':'2d');
db.collection.insert({'gps':[0,100]}) 
db.collection.insert({'gps':{'x':0,'y':100}}) 
//扩大范围
db.collection.ensureIndex({'light-years':'2d'},{'min':-1000,'max':1000});
//查询,会由近到远排序出来，默认100条
db.collecion.find({'gps':{'$near':[40,-73]}})
//使用geoNear还可以返回距离
db.runCommand({geoNear:'collection',near:[40,-73],num:10})
```

查找指定形状，并在这形状大小范围内的文档：

```js
//搜索一个矩形（以左下角10，20，右上角15，30）范围的所有文档
db.collection.find('gps':{'$within':{'$box':[[10,20],[15,30]]}});
//搜索一个圆形（以12，25为圆心，5为半径）范围的所有文档
db.collection.find('gps':{'$within':{'$center':[[12,25],5]}});
```

查看索引的执行计划。

`db.collection.find().explain();`

# 聚合

## count

```js
db.foo.count();
db.foo.count({'x':1});  //查询x为1的总数
```

增加查询条件会使count变慢。

## distinct

```js
//field 字段   query 查询条件  options 可选字段
db.collection_name.distinct(field,query,options)
```

## group

finalize



## $keyf

```js
db.posts.group({
    'ns':'posts',
    'keyf':function(x){
        return x.category.toLowerCase();
    }
    'initializer':...
})
```

## MapReduce

## aggregate

聚合的基本格式：

```js
pipeline=[stage1,stage2,stage3];
db.<collection>.aggregate(pipline,{options});
```



| $match（过滤） | $project（投影） |  $group  | $match |  $sort   | $skip | $limit | $sum | $sum  | $lookup | $unwind    | $bucket | $facet            |
| :------------: | :--------------: | :------: | :----: | :------: | ----- | :----: | :--: | :---: | :-----: | ---------- | ------- | ----------------- |
|     where      |  select  和 as   | group by | having | order by | skip  | limit  | sum  | count |  join   | 将数组展开 | 桶      | 和$bucket组合使用 |

一般是 [{$match},{$group},${match},${sort},${skip},${limit}]

在match匹配的文档，进行分组，对分组的结果再进行匹配，然后排序，跳过，限制。

```js
db.orders.aggregate( [
   {
     $group: {
        _id: "$cust_id",  //以cust_id分组，分组字段都会被select
        total: { $sum: "$price" } //以price取总和，并别名为total
     }
   }
] )

类似mysql:
SELECT cust_id,
       SUM(price) AS total
FROM orders
GROUP BY cust_id

```

```js
db.orders.aggregate( [
   {
     $group: {
        _id: "$cust_id",
        count: { $sum: 1 }
     }
   },
   { $match: { count: { $gt: 1 } } }  //在group后面的match作为having
] )

类似mysql:
SELECT cust_id,
       count(*)
FROM orders
GROUP BY cust_id
HAVING count(*) > 1
```

# 进阶指南