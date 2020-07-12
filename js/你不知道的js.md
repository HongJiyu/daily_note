# 第一章：作用域

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

# 第二章：词法作用域

词法作用域就是定义在词法阶段的作用域。换句话说，词法作用域是由你在写代码时将变量和块作用域写在哪里来决定的，因此当词法分析器处理代码时会保持作用域 不变。

词法作用域也就是静态作用域。在执行前，作用域就已经确定了。在编译期就会创建并存放了该作用域下的变量。

动态作用域：在执行的时候才会去确定作用域。

```js
var value = 1;

function foo() {
    console.log(value);
}

function bar() {
    var value = 2;
    foo();
}

bar();
```

静态作用域的执行结果是：1。

动态作用域的执行结果是：2。



## eval和with可以变为动态作用域

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

​		函数表达式：(Function fun(){})()   可以将代码隐藏到该作用域下，同时fun变量名是在变量自身作用域下，不会污染上一级的作用域。包含方法的()：使函数变为一个表达式，最后的()：执行这个函数。 **var tmp=function (){} 也是函数表达式**

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

# 第六章：this

this 的绑定和函数声明的位置没有任何关系，只取决于函数的调用方式。

也就是包含this的函数，这个函数声明在对象里面，它也不属于这个对象，具体this的指向是看这个函数被如何调用。

具体分析看另一篇文章：this绑定与丢失。

**具体流程：**

foo是一个函数。

```js
foo(){
    console.log(this.a);
}
```

1. 函数是否在 new 中调用（new 绑定）？如果是的话 this 绑定的是新创建的对象。 var bar = new foo()
2. 函数是否通过 call、apply、bind（显式绑定）？如果是的话，this 绑定的是 指定的对象。 var bar = foo.call(obj2)
3. 函数是否在某个上下文对象中调用（隐式绑定）？如果是的话，this 绑定的是那个上 下文对象。 var bar = obj1.foo()
4. 如果都不是的话，使用默认绑定。**如果在严格模式下，就绑定到 undefined**，非严格模式下绑定到 全局对象。 var bar = foo()



ES6的箭头函数在this这块是一个特殊的改进，箭头函数使用了词法作用域取代了传统的this机制，所以箭头函数无法使用上面所说的这些this优先级的原则，注意的是在箭头函数中，是根据**外层父亲作用域来决定this的指向**。

## 不关心this时

当不关心调用的函数，它this的指向时。

在严格模式下，可以传入null或者是空对象（传入null，this指向的时undefined）

在非严格模式下，最好传入空对象。（如果传入null，函数中的this指向了全局，进而更改了全局的变量。)

空对象：Object.create(null) 和 {} 很像，但是并不会创建 Object. prototype 这个委托，所以它比 {}“更空”。

## call、apply、bind

三个都是显示绑定this对象。

bind是返回一个绑定之后的函数，不会直接调用。

```js
let tmp=xw.say.bind(xh);   //将xw对象的say方法的this指向xh对象，并返回绑定后的say方法。
tmp(xx,xx); //调用tmp方法,并传入两个参数。

//上面的例子可以简化为这样。
xw.say.bind(xh,xx,xx)();
xw.say.bind(xh)(xx,xx);
```

apply方法是直接执行这个方法，而不是像bind返回一个绑定后的函数。所以apply方法需要传入绑定对象和参数。

同时参数要求是以**数组**的形式传入。

```js
xw.say.apply(xh,["实验小学","六年级"]);
```

call方法和apply方法一样，不过传入的参数是展开的。

```js
xw.say.apply(xh,"实验小学","六年级");
```



# 第七章 对象

对象可以通过两种形式定义：声明（文字）形式和构造形式。

```js
//对象的文字语法大概是这样：
var myObj = {     
    key: value     
    // ... 
};

//构造形式大概是这样：
var myObj = new Object(); 
myObj.key = value;

```



js中有8中类型

null、undefined、string、number、boolean、object、symbol、bigint

​		

​	ES6 中新增了一种 Symbol 。这种类型的对象永不相等，即使创建的时候传入相同的值，可以解决属性名冲突的问题，做为标记。

```js
var user = {
    one: 1,
    two: 2
}
var one = Symbol("one");
user[one] = 3;  
console.log(user); //{ one: 4, two: 2, [Symbol(one)]: 3 }
```

​		解决了当你引入一个对象，想要为这个对象增加属性时，为了避免因为定义了一样的变量名而覆盖了原有值，就可以使用Symbol，它永远是不一样的。



​		谷歌67版本中还出现了一种 bigInt。是指安全存储、操作大整数。（但是很多人不把这个做为一个类型）



基本类型：null、undefined、string、number、boolean

Object ：其中包含了Data、function、Array等。这三种是常规用的。



## 对象子类型

JavaScript 中还有一些**对象子类型**，通常被称为内置对象。有些内置对象的名字看起来和 简单基础类型一样，不过实际上它们的关系更复杂，我们稍后会详细介绍。它们实际上只是一些内置函数。这些内置函数可以当作构造函数来使用，从而可以构造一个对应子类型的新对 象。

+ String
+ Number
+ Boolean
+ Object
+ Function
+ Array
+ Date
+ RegExp
+ Error

```js
var strPrimitive = "I am a string";  
typeof strPrimitive; // "string"  
strPrimitive instanceof String; // false 
 
var strObject = new String( "I am a string" );  
typeof strObject; // "object" 
strObject instanceof String; // true 
```

​		原始值 "I am a string" 并不是一个对象，它只是一个字面量，并且是一个不可变的值。 如果要在这个字面量上执行一些操作，比如获取长度、访问其中某个字符等，那需要将其 转换为 String 对象。
​		幸好，在必要时语言会自动把字符串字面量转换成一个 String 对象，也就是说你并不需要 显式创建一个对象。JavaScript 社区中的大多数人都认为能使用文字形式时就不要使用构 造形式。

```js
var strPrimitive = "I am a string"; 
 
console.log( strPrimitive.length ); // 13 
 
console.log( strPrimitive.charAt( 3 ) ); // "m"

```



**函数就是对象的一个子类型**（从技术角度来说就是“可调用的对象”）。JavaScript 中的函数是“一等公民”，因为它们本质上和普通的对象一样（只是可以调用），所以可以像操作 其他对象一样操作函数（比如当作另一个函数的参数）。

数组也是对象的一种类型，具备一些额外的行为。数组中内容的组织方式比一般的对象要 稍微复杂一些。

## 内容

​		在引擎内部，这些值的存储方式是多种多样的，一般并不会存 在对象容器内部。存储在对象容器内部的是这些**属性的名称**，它们就像指针（从技术角度 来说就是引用）一样，指向这些值真正的存储位置。

```js
var myObject = {     a: 2 }; 
 
myObject.a; // 2 
 
myObject["a"]; // 2

```

可以通过`.`的方式访问，也可以通过["xx"]的方式访问属性。

 . 操作符要求属性名满足标识符的命名规范，而 [".."] 语法 可以接受任意 UTF-8/Unicode 字符串作为属性名。

举例来说，如果要引用属性名称为 **SuperFun!** 的属性，那就必须使用 ["Super-Fun!"] 语法访问，因为 Super-Fun! 并不是一个有效 的标识符属性名。所以不能通过`.Super-Fun!`来访问。



​		**在对象中**，属性名永远都是字符串。如果你使用 string（字面量）以外的其他值作为属性名，那它首先会被转换为一个字符串。即使是数字也不例外。而数组下标中使用的的确是数字，所以当心不要搞混对象和数组中数字的用法（因为对象使用["xx"]的方式和使用数组很像）

```js
var myObject = { }; //这是一个对象
 
myObject[true] = "foo";  
myObject[3] = "bar";  
myObject[myObject] = "baz"; 
 
myObject["true"]; // "foo"  
myObject["3"]; // "bar"  
myObject["[object Object]"]; // "baz"

```



### 可计算属性名

​	可以使用 myObject[prefix + name]。但是使用文字形式来声明对 象时这样做是不行的。ES6 增加了可计算属性名，可以在文字形式中使用 [] 包裹一个表达式来当作属性名：

```js
var prefix = "foo"; 

var myObject = {     
    [prefix + "bar"]:"hello",      
    [prefix + "baz"]: "world" 
}; 

myObject["foobar"]; // hello 
myObject["foobaz"]; // world
```

可计算属性名最常用的场景可能是 ES6 的符号（Symbol）

### 方法、函数

在其他语言中，属于对象（也被称为“类”）的函数通常 被称为“方法”。

但是在js中，函数不属于任何一个对象，即使这个函数声明在对象中。

因为 this 是在运行时根据调 用位置动态绑定的，所以函数和对象的关系最多也只能说是间接关系。

### 数组

数组也是对象，所以虽然每个下标都是整数，你仍然可以给数组添加属性：

```js
var myArray = [ "foo", 42, "bar" ];  

myArray.baz = "baz";  

myArray.length; // 3 

myArray.baz; // "baz"
```



如果你试图向数组添加一个属性，但是属性名“看起来”像一个数字，那它会变成 一个数值下标（因此会修改数组的内容而不是添加一个属性）：

```js
var myArray = [ "foo", 42, "bar" ];  

myArray["3"] = "baz";  

myArray.length; // 4 

myArray[3]; // "baz"
```

### 赋值

基本都是浅复制。

对于JavaScript的深复制(循环引用导致死循环)应当采用哪种方法作为标准呢？在很长一段时间里，这个问题都没有明确的答案。

对于 JSON 安全（也就是说可以被序列化为一个 JSON 字符串并且可以根据这个字符串解 析出一个结构和值完全一样的对象）的对象来说，有一种巧妙的复制方法：
```var newObj = JSON.parse( JSON.stringify( someObj ) );  ```

当然，这种方法需要保证对象是 JSON 安全的，所以只适用于部分情况。

### 属性描述符

对象的属性除了有对应了值，还有一些权限。

```js
var myObject = {      a:2 }; 
 
Object.getOwnPropertyDescriptor( myObject, "a" );
// { 
//    value: 2,    
//    writable: true,可写 
//    enumerable: true, 可枚举
//    configurable: true 可配置
// }
```

writable：改为false，那么无法修改a的值。

configurable：改为false，那么无法修改属性描述符的其他属性，而且是不可逆。也不能使用delete删除这个属性。

enumerable：属性是否会出现在对象的属性枚举中，比如说 for..in 循环。如果把 enumerable 设置成 false，这个属性就不会出现在枚举中，虽然仍 然可以正常访问它。相对地，设置成 true 就会让它出现在枚举中。用户定义的所有的普通属性默认都是 enumerable。



```js
var myObject = {}; 
 
Object.defineProperty( 
    myObject, "a", {     
        value:100,
        writable: false, // 修改为不可写！     
        configurable: true,     
        enumerable: true 
    } 
); 

Object.defineProperty( myObject, "a", {     
    value:10,
    writable: true,     
    configurable: false, // 不可配置！  delete myObject.a;  删除会失败，重新defineProperty也会报错。
    enumerable: true 
} );


```

### 不变性

#### 1.对象常量

结合 writable:false 和 configurable:false 就可以创建一个真正的常量属性（不可修改、 重定义或者删除）

```js
var myObject = {}; 
 Object.defineProperty( 
     myObject, "FAVORITE_NUMBER", 
     {     
         value: 42,     
      	 writable: false,     
      	 configurable: false  
     } );

```

#### 2.禁止扩展

如果你想禁止一个对象添加新属性并且保留已有属性，可以使用 

```js
Object.prevent Extensions(..)：
var myObject = {      a:2 }; 
Object.preventExtensions( myObject ); 
myObject.b = 3;  
myObject.b; // undefined
```

在非严格模式下，创建属性 b 会静默失败。在严格模式下，将会抛出 TypeError 错误。

#### 3.密封

​		Object.seal(..) 会创建一个“密封”的对象，这个方法实际上会在一个现有对象上调用 Object.preventExtensions(..) 并把所有现有属性标记为 configurable:false。所以，密封之后不仅不能添加新属性，也不能重新配置或者删除任何现有属性（虽然可以 修改属性的值）。

#### 4.冻结

​		Object.freeze(..) 会创建一个冻结对象，这个方法实际上会在一个现有对象上调用 Object.seal(..) 并把所有“数据访问”属性标记为writable:false，这样就无法修改它们 的值。

### [[Get]]

访问属性，如果属性不存在，结果是undefined。

访问属性，如果属性的值是undefined，那么结果也是undefined。

访问变量，如果变量不存在，会报错。

```js
var myObject = {      a: undefined }; 
 
myObject.a; // undefined  
 
myObject.b; // undefined

console.log(a); //ReferenceError: a is not defined
```

首先在对象中查找是否有名称相同的属性， 如果找到就会返回这个属性的值。

如果没有找到名称相同的属性，按照 [[Get]] 算法的定义会执行另外一种非常重要 的行为（其实就是遍历可能存在的 [[Prototype]] 链， 也就是原型链）。

如果无论如何都没有找到名称相同的属性，那 [[Get]] 操作会返回值 undefined。

如何区分属性不存在和属性值为undefined。

### [[Put]]

如果已经存在这个属性，[[Put]] 算法大致会检查下面这些内容。
1. 属性是否是访问描述符？如果是并且存在 setter 就调用 setter。 
2.  属性的数据描述符中 writable 是否是 false ？如果是，在非严格模式下静默失败，在 严格模式下抛出 TypeError 异常。 
3. 如果都不是，将该值设置为属性的值。

如果对象中不存在这个属性，[[Put]] 操作会更加复杂。

### Getter/Setter

obj.a  会调用get a(){return xx} 方法。

obj.a="xx" 会调用set a(val){}方法。

```js
var myObject = {
    // 给 a 定义一个 getter     
    get a() { return this.a1; },

    // 给 a 定义一个 setter     
    set a(val) { this.a1 = val * 2; }
};

myObject.a = 2;

console.log(myObject.a);

```

这里是将值存储在a1中。  **好大的疑惑！！！**



### 存在性

```js
var myObject = {      a:2 }; 
 
("a" in myObject); // true 
("b" in myObject); // false  
 
myObject.hasOwnProperty( "a" ); // true 
myObject.hasOwnProperty( "b" ); // false
```

in 操作符会检查属性名是否在对象及其 [[Prototype]] 原型链中

 hasOwnProperty(..) 只会检查属性名是否在 myObject 对象中，不会检查 [[Prototype]] 链。 



所有的普通对象都可以通过对于 Object.prototype 的委托来访问 hasOwnProperty(..)，但是有的对象可能没有连接到 

Object.prototype。在这种情况下，形如 myObejct.hasOwnProperty(..) 就会失败。

使用`Object.prototype.hasOwnProperty. call(myObject,"a")`

**存在但不一定会被枚举出来**

在属性描述时，设置了它的可枚举为false。

```js
var myObject = { }; 
 
Object.defineProperty(     myObject,     "a",     // 让 a 像普通属性一样可以枚举     
                      { enumerable: true, value: 2 } ); 
 
Object.defineProperty(     myObject,     "b",     // 让 b 不可枚举     
                      { enumerable: false, value: 3 } ); 
 
myObject.b; // 3 
("b" in myObject); // true  
myObject.hasOwnProperty( "b" ); // true 
 
// ....... 
 
for (var k in myObject) {      
    console.log( k, myObject[k] ); 
} // "a" 2

myObject.propertyIsEnumerable( "b" ); // false
Object.keys( myObject ); // ["a"]  Object.keys(..) 会返回一个数组，包含所有可枚举属性
Object.getOwnPropertyNames( myObject ); // ["a", "b"] 会返回一个数组，包含所有属性，无论它们是否可枚举。

```

​		如上，使用了defineProperty为myObject定义了两个属性，分是a、b。不过设置b不可枚举。通过in和HasOwnProperty可以判断出b是存在的。但是使用for in 进行枚举时，只能枚举出a。



**注意：**

​		在数组上应用 for..in 循环有时会产生出人意料的结果，**因为这种枚举不仅会包含所有数值索引，还会包含所有可枚举属性（包括原型链）。**最好只在对象上应用 for..in 循环，如果要遍历数组就使用传统的 for 循环来遍历数值索引。



## 遍历

目前没有内置的方法可以获取 对象本身的属性以 及 [[Prototype]] 链中的所有属性 。不过你可以递归遍历某个对象的整条 [[Prototype]] 链并保存每一层中使用 Object.keys(..) 得到的属性列表——只包含可枚举属性。

for..in 循环可以用来遍历对象的可枚举属性列表（包括 [[Prototype]] 链）。

```js
var myArray = [1, 2, 3]; 
 
for (var i = 0; i < myArray.length; i++) {      
    console.log( myArray[i] ); 
} // 1 2 3
```

以上的代码其实只是通过遍历数组的下标来获取下标指向的值。

ES6 增加了一种用来遍 历数组的 for..of 循环语法。

```js
var myArray = [11, 20, 33];

for (var v of myArray) { console.log(v); } 
```

​		for..of 循环首先会向被访问对象请求一个迭代器对象，然后通过调用迭代器对象的 next() 方法来遍历所有返回值。数组有内置的 @@iterator，因此 for..of 可以直接应用在数组上。

```js
var myArray = [ 1, 2, 3 ]; 
var it = myArray[Symbol.iterator](); 
 
it.next(); // { value:1, done:false }  
it.next(); // { value:2, done:false }  
it.next(); // { value:3, done:false }  
it.next(); // { done:true }

```

​		引用类似 iterator 的特殊属性时要使用符号名，而不是符号包含的值。此外，虽然看起来很像一个对象，但是 @@iterator 本身并不是一个迭代 器对象，而是一个返回迭代器对象的函数



# 第八章：混合对象“类”



# 第九章：原型

JavaScript 中的对象有一个特殊的 [[Prototype]] 内置属性，其实就是对于其他对象的引 用。几乎所有的对象在创建时 [[Prototype]] 属性都会被赋予一个非空的值。

在前面讲到引用对象的属性时，出发[[Get]]，如果对象不存在这个属性，会去看看它的原型是否存在这个属性。

```js
var anotherObject = {      a:2 }; 
 
// 创建一个关联到 anotherObject 的对象 
var myObject = Object.create( anotherObject );  
 
myObject.a; // 2

myObject.a = 10; //赋值时，myObject没有，所以给myObject创建并赋值了。而anotherObject不会被修改。
console.log(myObject); //{a:10}
console.log(anotherObject);//{a:2}

```

​		创建了myObject，并将myObject的原型指向了anotherObject。显然，在myObject找不到a，但是在anotherObject找到了。如果 anotherObject 中也找不到 a 并且 [[Prototype]] 链不为空的话，就会继续查找下去。查找到最终，会访问到这个 Object.prototype 对象。

​		



```js
var anotherObject = {      a:2 }; 
// 创建一个关联到 anotherObject 的对象 
var myObject = Object.create( anotherObject ); 
for (var k in myObject) {      
    console.log("found: " + k); 
} // found: a
("a" in myObject); // true
```

for in会去遍历对象的原型链上的属性，同时in操作符也会去查找原型链。



## Object.prototype

​		所有普通的 [[Prototype]] 链最终都会指向内置的 Object.prototype。由于所有的“普通” （内置，不是特定主机的扩展）对象都“源于”这个 Object.prototype 对象，所以它包含 JavaScript 中许多通用的功能。
​		比如说 .toString() 和 .valueOf()， .hasOwnProperty(..), .isPrototypeOf(..)。



方法不写入参，调用时能传入，且通过arguments获取？



## 屏蔽和屏蔽设置

 myObject.foo = "bar" 会出现的三种情况。

1. 如果在 [[Prototype]] 链上层存在 foo ，并且没有被标记为只读（writable:false），那就会直接在myObject 中添加一个名为 foo 的新属性，它是屏蔽属性。 
2.  如果在 [[Prototype]] 链上层存在 foo，但是它被标记为只读（writable:false），那么 无法修改已有属性或者在 myObject 上创建屏蔽属性。如果运行在严格模式下，代码会 抛出一个错误。否则，这条赋值语句会被忽略。总之，不会发生屏蔽。 
3. 如果在 [[Prototype]] 链上层存在 foo 并且它是一个 setter，那就一定会 调用这个 setter。foo 不会被添加到（或者说屏蔽于）myObject，也不会重新定义 foo 这 个 setter。

```js
var anotherObject = {      a:2 }; 
 
var myObject = Object.create( anotherObject );  
 
anotherObject.a; // 2 myObject.a; // 2  
 

anotherObject.hasOwnProperty( "a" ); // true 
myObject.hasOwnProperty( "a" ); // false  
 
myObject.a++; // 隐式屏蔽！ 
 
anotherObject.a; // 2  myObject.a; // 3 
 
myObject.hasOwnProperty( "a" ); // true

```

<<<<<<< Updated upstream
​		尽管 myObject.a++ 看起来应该（通过委托）查找并增加 anotherObject.a 属性，但是别忘 了 ++ 操作相当于 myObject.a = myObject.a + 1。因此 ++ 操作首先会通过 [[Prototype]] 查找属性 a 并从 anotherObject.a 获取当前属性值 2，然后给这个值加 1，接着用 [[Put]] 将值 3 赋给 myObject 中新建的屏蔽属性 a，天呐！
​		修改委托属性时一定要小心。如果想让 anotherObject.a 的值增加，唯一的办法是 anotherObject.a++。
=======
this指向函数作用域

this 是在运行时进行绑定的，并不是在编写时绑定

this 的绑定和函数声明的位置没有任何关系，只取决于函数的调用方式和函数的调用位置。

当一个函数被调用时，会创建一个活动记录（有时候也称为执行上下文）。这个记录会包含函数在哪里被调用（调用栈）、函数的调用方式、传入的参数等信息。this 就是这个记录的一个属性，会在函数执行的过程中用到。
>>>>>>> Stashed changes
