# mongoose的简单使用
find()：查找
create()：添加，返回添加的文档
update()：更新，返回更新的状态、条数。
remove()：删除，返回删除的状态、条数。

在mongose 可以直接 '\_id' : 'xxxx ' 而不用：_id':ObjectId("xxxx")。

# 创建动态集合：

```js
 models(gate = '') {
    if (gate) {
      const gateModel = this.app.mongoose.models[`${gate}Statistic`];
      if (!gateModel) {
        const mongoose = this.app.mongoose;
        const Schema   = mongoose.Schema;
        const schema = new Schema({
          classificationId: {
            type   : String,
            comment: '分类ID',
          },
        }, {
          autoIndex : false,
          versionKey: false,
          collection: `${gate}_statistic`,
        });
        schema.index({ gate: 1, type: 1, ctype: 1, date: 1, status: 1 });
          //mongoose.model()这个方法去生成模型的
        this.app.model[`${gate}Statistic`] = mongoose.model(`${gate}Statistic`, schema);
      }
    }
    return this.app.mongoose.models;
  }

```



# eleMatch和$结合查询

```js
   await ctx.model('xx').updateOne({
    _id  : otherRecord._id,
    remarks: {
     $elemMatch: {
      imId,
      createAt,
      deleted: 1,
     },
    },
   }, { $set: { 'remarks.$.deleted': 0 } });
```



# lookup

```js
    const result = await ctx.models().DetailData.aggregate([
      {
        $match: {
          gate   : { $eq: gate },
          type   : { $eq: type },
          collect: { $eq: 1 },
        },
      },
      {
        //分组后，字段名是_id
        $group: {
          _id: '$objId',
        },
      },
      {
          //from是集合名，不是模型名，doc返回是一个数组
          //匹配字段类型必须一致，不能一个string，一个objectId
        $lookup: {
          from        : `${options.gate}_statistic`,
          localField  : '_id',
          foreignField: '_id',
          as          : 'doc',
        },
      },
      {
        $unwind: '$doc',
      },
      {
        $project: {
          '_id'         : '$_id',
          'errorname'   : 'errorname',
          'platform'    : 'platform',
          'effectcustom': 'effectcustom',
          'happentimes' : 'happentimes',
        },
      },
    ]);
```

根据match筛选出符合条件的文档后，按照objId分组，然后进行外连接，再将doc展开，然后筛选出五个字段。