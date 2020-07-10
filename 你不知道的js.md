**js虽然归为解释型语言，但是它实际上是一门编译语言。也存在着编译的过程，他的编译发生在代码执行前的几微秒（甚至更短）**

具体过程：

+ 分词/词法分析：拆分成词法单元，词法化的过程会对源代码中的字符进行检查，如果是有状态的解析过程，还会赋 予单词语义。
+ 解析/语法分析）：生成一颗抽象语法树
+ 代码生成：将语法树转换为可执行代码



成员：引擎、编译器、作用域。

var a=0;

1.编译的时候就会去查看作用域是否存声明过变量，然后再去生成代码给引擎去执行。

2.引擎在执行时去当前作用域查看是否存在a变量，不存在则继续找。找到赋值，找不到报错。



查询变量时有LHS和RHS

+ LHS：查找变量本身，在为变量赋值时使用LHS
+ RHS：查找变量的值，需要得到变量值时使用RHS

区别：在非严格模式下，LHS查找时，在全局都找不到，就会在全局作用域下创建一个变量，而RHS找不到。



词法作用域：在编译期就会创建并存放了该作用域下的变量。

eval(""):通常被用来执行动态创建的代码。可以在运行期修改书写期的词法作用域。前提是在非严格模式下。

代码中使用eval和with虽然可以做到词法欺骗，但是会导致引擎无法更好地优化代码，所以影响系统性能。（有些优化依赖于能够根据代码的 词法进行静态分析，并预先确定所有变量和函数的定义位置，才能在执行过程中快速找到 标识符。而词法欺骗会更改变量和函数的定义位置位置。）



#  第三章：函数作用域和块作用域

## 函数作用域

​	函数作用域：将代码隐藏起来，待需要的时候再去调用。符合最小暴露原则。

​	不使用作用域进行隐藏，会导致如下：（变量被随意更改）

​	原因：for里面顶一个的var i会保存在块级作用域下，而因为var不支持块级作用域，所以放在上一级作用域下，所以bar能访问到。如果换成let 修饰i，那么就会报错。

```js
	function bar(a) {         
        i = 3; // 修改 for 循环所属作用域中的 i         		         console.log( a + i );     
    } 
 
    for (var i=0; i<10; i++) {    //i是foo函数级别作用域     
        bar( i * 2 ); // 每次都重置i，导致无限循环了！     
    } 
 
foo();
```

​		在引用其他第三方库时，第三方库也应该把自己的变量隐藏起来，而不是都声明在在全局作用域下，如下：

`var thirdRepo={ name:"hjy"; doSomething:function(){ } }`

​		函数声明：Function fun(){ } ，可以将代码隐藏到该作用域下，但是会污染包含这个方法的作用域。因为fun变量名被使用了。

​		函数表达式：(Function fun(){})()   可以将代码隐藏到该作用域下，同时fun变量名是在变量自身作用域下，不会污染上一级的作用域。包含方法的()：使函数变为一个表达式，最后的()：执行这个函数。

两种写法：(Function fun(){})()  或者 (Function fun(){}())



## 块级作用域

+ for(var i=0;i<10;i++) 声明的`i`属于块级作用域。

+ if(){  }else{  } 的两个花括号包含的也是块级作用域。

+ try{	}catch(){	}  两个花括号也是块级作用域。

+ { 	} 这也是一个块级作用域。

在块级作用域下用var声明，等于是无效。只有`let、const`才有效。



# 第四章：提升

## 变量提升

```js
foo(); // 不是 ReferenceError, 而是 TypeError! 
var foo = function bar() {     
    // ... 
};

```

注意是函数先提升，后是变量

```js
foo(); // 1 
var foo; 
function foo() {     console.log( 1 ); } 
foo = function() {     console.log( 2 ); };
```

会被引擎理解为：

```js
function foo() {     console.log( 1 ); } 
foo(); // 1 
foo = function() {     console.log( 2 ); };
```

var虽然在前面，但是如果var和函数重名，那么会var修饰的变量会被函数覆盖。



# 第五章：作用域闭包

​		个人的理解：闭包是指一个函数1中的作用域下包含着很多的变量和其他函数，比如函数2，函数2可以访问函数1中的所有变量和其他函数。同时函数1返回值是函数2。在返回后，函数1内部不会被回收，而只有函数2可以访问并且持有了函数1作用域下的所有变量和函数。那么这部分不会被回收的就称为闭包。 （这里可以不是返回，也可以通过引用的方法将函数2给外部引用）

```js
function wait(message) { 
    setTimeout( function timer() {         
        console.log( message );     
    }, 1000 ); 
} 
wait( "Hello, closure!" );
```

​		这里的timer也可以访问wait中message变量，同时setTimeout内部持有者timer的引用。因此wait方法结束，timer依旧持有着对wait函数作用域的访问权，不会被回收。这就是闭包。

​		闭包，就是一个函数持有了它外部作用域的访问权。

	## 利用闭包做到模块化

模块模式需要具备两个必要条件。

1. 必须有外部的封闭函数，该函数必须至少被调用一次**每次调用都会创建一个新的模块实例**。
2. 封闭函数必须返回至少一个内部函数，这样内部函数才能在私有作用域中形成闭包，并 且可以访问或者修改私有的状态。

```js
    function CoolModule() {     
        var something = "cool"; 
    	var another = [1, 2, 3]; 
    	function doSomething() {          
            console.log( something );     
        } 
    	function doAnother() {         
            console.log( another.join( " ! " ) );     
        } 
    	return {         
            doSomething: doSomething,          
            doAnother: doAnother     
        }; 
    }
```

以上的代码，每次调用都会生成新的模块实例。

```js
var foo = (function CoolModule() {      
    var something = "cool";     
    var another = [1, 2, 3]; 
    function doSomething() {          
        console.log( something );     
    } 
    function doAnother() {         
        console.log( another.join( " ! " ) );     
    } 
    return {         
        doSomething: doSomething,          
        doAnother: doAnother     
    }; })();
```

如果只需要实例化一次，可以使用以上代码。

