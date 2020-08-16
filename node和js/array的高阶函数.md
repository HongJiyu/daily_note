

map函数并没有真正的对每一个元素执行操作。因为只有当下标存在的时候，map的回调函数才会执行。
var arr=[...Array(10)]; 这种空数组就能够被高阶函数循环。

arry.forEach()

arry.splice(index,howmany,...) 对数组的指定位置进行删除howmany个数，并从index添加...数据到数组中。

arry.join(",") 数组转化为字符串并以，分割。

arry.concat(arr)合并两个数组。

arry.filter(Function) 过滤出符合条件的数据形成新的数组。return true保留，如return false丢弃。

arry.some(Function) 判断数组中是否存在指定条件的数，返回Boolean。return true，不再遍历。

