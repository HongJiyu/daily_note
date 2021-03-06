。ECMA 是一个将信息标准化的组织，而ECMAScript是一个语言标准，JavaScipt是该标准（最流行）的一个实现。

# 数组

**创建数组：**`new Array() / []`，使用中括号的形式是最常见。

unshift（头插）  push（尾插）

shift（头删）       pop （尾删）

增加数组长度，只需要在下一个索引赋值即可。

删除数组长度，则只能用一个新数组。

指定位置删除或增加：splice。 splice(5,2) 删除索引位置为5和6的元素，数组长度减少，2表示删除2个元素。

splice(5,0,1,2,3)。表示删除0个元素，并从索引位置为0插入 1，2，3.

slice 是截取一段，而splice是拼接。

**数组方法：**

![image-20210124144826284](img\image-20210124144826284.png)

![image-20210124144804252](img\image-20210124144804252.png)

**数组排序：**

arr.sort();  将元素认成字符串进行比较的。而且是根据字符对应的ASCII值比较的。（A、J、a、j 分别为65、74、97、106）。如果忽略大小写，则自定义，并使用toLowerCase，如果要同字母时，小写在大写前面，则使用 one.localeCompare(two)。

如果需要自定义，则传入一个函数。

```js
arr.sort( (one,two) => {
    return one-two;  //true交换，false不交换
})
```

**类型数组**（略）

# 栈

要自己定义一个栈类。所需的方法：

```js
push：添加元素到栈顶。
pop：移除栈顶元素，同时返回被移除的元素。
peek：返回栈顶元素，不对栈做修改。
isEmpty：判断栈是否为空。
clear：移除栈的所有元素。
size：返回栈的元素个数。
```

实现的数据结构：（较简单，自己实现）

- 使用数组来实现栈。（时间复杂度基本是O（n），且需要连续内存地址），待看源码。
- 使用对象+count来实现栈。（时间复杂度基本是O（1））

**保护数据结构内部元素：**

通过Object.getOwnPropertyNames ， 可以获取到这个对象下的属性，那么就可以对这个栈进行操作，而不用遵循对外提供的方法的逻辑。

解决：

- 使用Symbol，不过ES2015提供了Object.getOwnPropertySymbols 方法，因此也会被破坏。
- 使用WeakMap实现类。

![image-20210124161145968](img\image-20210124161145968.png)

**解决问题：**

两个栈实现浏览器的前进和回退功能。

# 队列和双端队列

队列所需要的方法：

```js
enqueue：向队列尾部添加
dequeue：移除队列第一项
peek：查看队列第一项
isEmpty：判断是否为空
size：个数
```

实现：

使用object+endCount+firstCount。

- object 存放数据
- endCount 最后一个数据的key
- firstCount 第一个数据的key

**双端队列：**头部和尾部都可以操作元素。

实现：同样使用以上的数据结构即可。

**队列解决问题：**

- 击鼓传花，关键代码： queue.enqueue(queue.dequeue); 构成一个循环。

# 链表

**单向链表** 需要两个类：LinkedList（head，eqFun，count）、Node（next，element）

```js
push ：向链表尾部添加元素
insert：向指定索引位置添加元素
getElementAt：获取指定索引位置的元素
removeAt：删除指定位置的元素
remove：删除值为xx的元素，比较取决于eqFun
indexOf：返回元素所在链表的索引，比较取决于eqFun
isEmpty
siez
toString
```

心得：对链表某个节点的增删操作，都需要获得上一个节点的引用。

**双向链表**：多了prev指针。

**循环链表**：head的prev指向tail，tail的next指向head

**有序链表**：需要compareFun比较大小

# 集合

set，没有可用的并集、交集、差集和子集判断。

只能自己实现。

常用的方法

```js
set.has(xx);
[...set];
set.forEach();
```

ES2015 提供了Set

# 字典和散列表

字典： 

```js
{
	key.toString():{
        key:key
        value:value
    }    
}
```

散列表：

```js
{
    key.hasCode():{
        key:key
        value:value
    }   
}
```

ES2015还提供了Map和WeakMap

- WeakSet和WeakMap没有entries、keys和values
- 只能用对象作为键

# 递归

- 必须要有停止点，不然会无限递归下去。

- 主要调用栈的大小限制（操作系统和浏览器不同而有差异）

- ECMAScript 2015 有尾调用优化（tail call optimization）。如果函数内的最后一个操作是调用

  函数（就像示例中加粗的那行），会通过“跳转指令”（jump）而不是“子程序调用”（subroutine 

  call）来控制。

```js
// 斐波那契（递归+记忆）
function fibonacciMemoization(n) { 
 const memo = [0, 1]; // {1} 
 const fibonacci = (n) => { 
 if (memo[n] != null) return memo[n]; // {2} 
 return memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo); // {3} 
 }; 
 return fibonacci; 
}
```

总结：递归并不是最快，直接遍历更快。直接遍历在有些场景会不适用。递归代码更简单。

# 树 

深度：从上往下数 ，从0开始

高度：从下往上数，从0开始

**二叉搜索树**

```js
class Node { 
 constructor(key) { 
 this.key = key; // {1} 节点值
 this.left = null; // 左侧子节点引用
 this.right = null; // 右侧子节点引用
 } 
}

class BinarySearchTree {
 constructor(compareFn = defaultCompare) { 
 this.compareFn = compareFn; // 用来比较节点值
 this.root = null; // {1} Node 类型的根节点
 }

//insert(key)：向树中插入一个新的键。需要递归判断插入
//search(key)：在树中查找一个键。如果节点存在，则返回 true；如果不存在，则返回false。 
//inOrderTraverse()：通过中序遍历方式遍历所有节点。 （左中右）
//preOrderTraverse()：通过先序遍历方式遍历所有节点。 （中左右）
//postOrderTraverse()：通过后序遍历方式遍历所有节点。 （左右中）
//min()：返回树中最小的值/键。遍历即可
//max()：返回树中最大的值/键。遍历即可
//remove(key)：从树中移除某个键。 使用compareFn方法比较。删除节点时，要判断是否有左右节点，四种情况。
    //无左右节点，return null即可。
    //只有左节点或者只有右节点，则直接return 这个左/右节点即可。
    //有左右节点，则获取右子树的最小值节点，替换掉要删除的节点。然后在右子树删除掉该最小值节点即可。
```

**avl树**（p187）

- 出现ll ：节点的左子节点右旋
- 出现lr：节点的左子节点左旋，再右旋
- 出现rr：节点的右子节点左旋
- 出现rl：节点的右子节点右旋，再左旋

