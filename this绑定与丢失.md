本文内容主要来自:[js中this的绑定与丢失](https://blog.csdn.net/qq_22855325/article/details/76267925)

# 1.问题

```js
var obj={ 
id:"awesome",
cool:function coolFn(){
  console.log(this.id);
 }
};
obj.cool()//awesome
var id="not awesome";
setTimeout(obj.cool,0);//not awesome
```

在setTImeout的回调方法中，cool明明是obj调用！，应该输出awesome，结果却是not awesome。原因是：cool()函数失去了与this之间的绑定，即this指向丢失，然后this就指向了window。

# 2.知识铺垫

this的指向大概分为如下四种：

## 1.new绑定
new方式是优先级最高的一种调用方式，只要是使用new方式来调用一个构造函数，this一定会指向new调用函数新创建的对象：

```js
function() thisTo(a){
 this.a=a;
}
var data=new thisTo(2); //在这里进行了new绑定
console.log(data.a);  //2
```


## 2.显式绑定

显示绑定指的是通过call()和apply()方法，强制指定某些对象对函数进行调用，this则强制指向调用函数的对象：

```js
function thisTo(){
   console.log(this.a);
}
var data={
    a:2
}; 
thisTo.call(data));  //2
```

## 3.隐式绑定
隐式绑定是指通过为对象添加属性，该属性的值即为要调用的函数，进而使用该对象调用函数：

```js
function thisTo(){
   console.log(this.a);
}
var data={
    a:2,
    foo:thisTo //通过属性引用this所在函数 
};
data.foo(); //2
```

## 4.默认绑定
默认绑定是指当上面这三条绑定规则都不符合时，默认绑定会把this指向全局对象window：

```js
function thisTo(){
   console.log(this.a);
}
var a=2; //a是全局对象的一个同名属性
thisTo(); //2
```

​		以上四点是this在绑定调用对象时的规则。前面的问题中，是符合隐式绑定的。但是存在绑定丢失的情况。具体如下：

# 3.分析

## 1.隐式丢失
### 1.1引用赋值丢失

```js
function thisTo(){
   console.log(this.a);
}
var data={
    a:2,
    foo:thisTo //通过属性引用this所在函数 
};
var a=3;//全局属性

var newData = data.foo; //这里进行没有调用方法，而是将方法先赋值给了newData，所以会发生this丢失
newData(); // 3  
```

原理：data.foo返回的只是一个方法，然后将方法的引用赋给了newData，然后newData调用时，单纯的调用方法，而非对象调用方法。

### 1.2传参丢失

```js
function thisTo(){
   console.log(this.a);
}
var data={
    a:2,
    foo:thisTo //通过属性引用this所在函数 
};
var a=3;//全局属性

setTimeout(data.foo,100);// 3   这里是将方法赋给了setTimeout的回调函数，而非对象调用方法。
```

这就是本文开始的那个题目。所谓传参丢失，就是在将包含this的函数作为参数在函数中传递时，this指向改变。

### 1.3.间接引用

间接引用是指一个定义对象的方法引用另一个对象存在的方法，这种情况下会使得this指向window：

```js
function thisTo(){
   console.log(this.a);
}
var data={
  a:2,
  foo:thisTo
};
var newData={
  a:3
}
var a=4;
data.foo(); //2
(newData.foo=data.foo)() //4
newData.foo();  //3
```



​		这里为什么(newData.foo=data.foo)()的结果是4，与newData.foo()的结果不一样呢？按照正常逻辑的思路，应该是先对newData.foo赋值，再对其进行调用，也就是等价于这样的写法：newData.foo=data.foo;newData.foo();然而这两句的输出结果就是3，这说明两者不等价。

​		接着，当我们console.log(newData.foo=data.foo)的时候，发现打印的是thisTo这个函数，函数后立即执行括号将函数执行。这句话中，立即执行括号前的括号中的内容可单独看做一部本，该部分虽然完成了赋值操作，返回值却是一个函数，该函数没有确切的调用者，故而立即执行的时候，其调用对象不是newData，而是window。下一句的newData.foo()是在给newData添加了foo属性后，再对其调用foo()，注意这次的调用对象为newData，即我们上面说的隐式绑定的this，结果就为3。

# 4解决

## 1.隐式丢失解决方法

​		为了解决隐式丢失（隐式丢失专用）的问题，ES5专门提供了bind方法，bind()会返回一个硬编码的新函数，它会把参数设置为this的上下文并调用原始函数。（这个bind可跟$(selector).bind('click',function(){......})的用法不同）

```js
function thisTo(){
   console.log(this.a);
}
var data={
    a:2
}; 
var a=3;
var bar=thisTo.bind(data);  //显示绑定thisTo方法中的this是data这个对象
console.log(bar()); //2
```

## 2.ES6箭头函数
ES6的箭头函数在this这块是一个特殊的改进，箭头函数使用了词法作用域取代了传统的this机制，所以箭头函数无法使用上面所说的这些this优先级的原则，注意的是在箭头函数中，是根据外层父亲作用域来决定this的指向问题。

```js
function thisTo(){
    setTimeout(function(){
    console.log(this.a);
},100);
}
var obj={
 a:2
}
var a=3;
thisTo.call(obj); //3
```

不用箭头函数，发生this传参丢失，最后的this默认绑定到全局作用域，输出3。

```js
function thisTo(){
   setTimeout(()=>{
    console.log(this.a);
},100);
}
var obj={
 a:2
}
var a=3;//加粗文字
thisTo.call(obj); //2
```

不会发生隐式丢失，this绑定到外层父作用域thisTo()，thisTo的被调用者是obj对象，所以最后的this到obj对象中，输出2。

如果不用箭头函数实现相同的输出，可以采用下面这种方式：

```js
function thisTo(){
   var self=this; //在当前作用域中捕获this 
   setTimeout(function(){
    console.log(self.a); //传入self代替之前的this
},100);
}
var obj={
 a:2
}
var a=3;
thisTo.call(obj); //2
```

相当于闭包，setTimeout的回调方法可以访问thisTo函数作用域下的所有属性。

