# mongoose的简单使用
find()：查找
create()：添加，返回添加的文档
update()：更新，返回更新的状态、条数。
remove()：删除，返回删除的状态、条数。

在mongose 可以直接 '\_id' : 'xxxx ' 而不用：_id':ObjectId("xxxx")。

# 创建动态集合：

```js
/* model.js */
'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


  function dinamycModel(suffix){
  var addressSchema = new Schema(
    {
        "name" : {type: String, default: '',trim: true},
        "login_time" : {type: Date},
        "location" : {type: String, default: '',trim: true},
    }
  );

     return mongoose.model('user_' + suffix, addressSchema);

  }

module.exports = dinamycModel;

------------------------------------------------------------------------------------------------------------

/* user.js */
var  mongoose = require('mongoose'),

 function CreateModel(user_name){//function to create collection , user_name  argument contains collection name

  var Model  = require(path.resolve('./model.js'))(user_name);

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



