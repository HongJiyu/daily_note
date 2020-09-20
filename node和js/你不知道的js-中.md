# 第一章：类型

我们这样来定义“类型”（与规范类似）：对语言引擎和开发人员来说，类型是值的内部特征，它定义了值的行为，以使其区别于其他值。

JavaScript 有七种内置类型：（**除对象之外，其他统称为“基本类型”**）

+ 空值（null）
+ 未定义（undefined）
+  布尔值（ boolean）
+ 数字（number）
+ 字符串（string）
+ 对象（object）
+ 符号（symbol，ES6 中新增）

使用typeof可以获取他们对应的同名字符串，只有null不一样：

``` js
typeof null ==="object"  //true
typeof function a(){ /* .. */ } === "function"; // true 它实际上是 object 的一个“子类型”。
typeof [1,2,3] === "object"; // true  //数组也是对象。确切地说，它也是 object 的一个“子类型”
```

## 值和类型

JavaScript 中的变量是没有类型的，只有值才有。变量可以随时持有任何类型的值。

在对变量执行 typeof 操作时，得到的结果并不是该变量的类型，而是该变量持有的值的类 型，因为 JavaScript 中的变量没有类型。

```js
var a = 42; 
typeof a; // "number" 
 
a = true; 
typeof a; // "boolean"

```

在js中，声明和和赋值是两回是。

声明：`var tmp;`

赋值：`tmp=1;`

在js中如果一个**变量**未声明，你就去访问，那么会报 is not defined的错误。如果一个变量声明了但是未赋值，访问会得到undefined的结果。

如果是访问一个对象的属性，它未声明，会得到undefined的结果，而非报错。

 ## typeof 的安全防范机制

场景：当你有一个模块给别人引用时（你的模块需要一个变量，如果引用人未声明，则需要自己创建），如果别人引用时未声明变量，你直接使用，就会报错 xx  is not defined的错误。

解决：(typeof  变量 === "undefiend")  这个变量未声明或者是undefined值，使用typeof 都会返回"undefined"。

当然可以不使用以上的判断，改用：

`var helper = FeatureXYZ ||  function() { /*.. default feature ..*/ }; `

以上方法都可以。



# 第二章 ：值

## 数组

```js
var a = [ 1, "2", [3] ]; 
a.length;       // 3 
a[0] === 1;     // true 
a[2][0] === 3;  // true 可以创建二维数组
```

```js
var a = [ ]; 
a[0] = 1; // 此处没有设置a[1]单元 
a[2] = [ 3 ]; 
a[1];       // undefined  稀疏数组
a.length;   // 3

```

```js
var a = [ ]; 
a[0] = 1; 
a["foobar"] = 2; //数组也是一个对象，是对象的子类型，所以也可以存放属性
a.length;       // 1 
a["foobar"];    // 2 
a.foobar;       // 2
a["13"] = 42;   //当属性名可以转为数字，那么便成为了索引
a[13]===42; //true

```

类数组：一组通过数字索引的值，比如arguments，转为真正的数组。这一般通过数组工具函数（如 indexOf(..)、concat(..)、forEach(..) 等）来实现。

arguments其实只是一个对象（类数组），以数字作为变量名。如：`[Arguments] { '0': 1, '1': 2, '2': 3 }`

```js
function foo() {     
    var arr = Array.prototype.slice.call( arguments );   //由于arguments不是数组（原型链上不存在），所以用不了slice函数。  只能通过Array。最终将类数组转化为真正的数组。
    arr.push( "bam" );     
    console.log( arr ); 
} 
 
foo( "bar", "baz" ); // ["bar","baz","bam"]

```

另一种写法：（问题：Object.create(Array)却不行，为啥！）

```js
function fun() {
    // 方法的参数arguments
    arguments.__proto__ = Object.create(Array.prototype); //为arguments创建一个原型链，指向Array的原型
    console.log(arguments instanceof Array); //原型链上存在Array。
    console.log(arguments.slice());  //可以使用Array的slice方法了。
}

fun("bar", "baz") //["bar","baz"]
```

## 字符串

字符串和数组的确很相似，它们都是类数组，都有 length 属性以及 indexOf(..) 。它可以借用数组的很多api。

字符串是不可变的。

```js
var c = Array.prototype.join.call( a, "-" ); 
var d = Array.prototype.map.call( a, function(v){     
    return v.toUpperCase() + "."; 
} ).join( "" );
```

## 数字

Number类型表示数字，JavaScript 采用“IEEE 754 标准定义的双精度64位格式”（"double-precision 64-bit format IEEE 754 values"）表示数字。

toFixed() 方法可把 Number 四舍五入为指定小数位数的数字。

toPrecision() 方法可在对象的值超出指定位数时将其转换为指数计数法。

**`. `运算符需要给予特别注 意，因为它是一个有效的数字字符，会被优先识别为数字常量的一部分，然后才是对象属 性访问运算符。**

```js
var a = 42.59; 
a.toFixed( 0 ); // "43" 
a.toFixed( 1 ); // "42.6" 
a.toFixed( 2 ); // "42.59" 
a.toFixed( 3 ); // "42.590" 
a.toFixed( 4 ); // "42.5900"

var a = 42.59; 
a.toPrecision( 1 ); // "4e+1" 
a.toPrecision( 2 ); // "43" 
a.toPrecision( 3 ); // "42.6" 
a.toPrecision( 4 ); // "42.59" 
a.toPrecision( 5 ); // "42.590" 
a.toPrecision( 6 ); // "42.5900"

// 无效语法：
42.toFixed( 3 );    // SyntaxError 
42..toFixed( 3 );   // "42.000"
// . 被视为常量 42. 的一部分（如前所述），所以没有 . 属 性访问运算符来调用 tofixed 方法。
```

### 二进制浮点数问题

`0.1 + 0.2 === 0.3; // false`
从数学角度来说，上面的条件判断应该为 true，可结果为什么是 false 呢？
简单来说，二进制浮点数中的 0.1 和 0.2 并不是十分精确，它们相加的结果并非刚好等于 0.3，而是一个比较接近的数字 0.30000000000000004，所以条件判断结果为 false。

要判断0.1+0.2===0.3，最常见的方法是设置一个误差范围值，通常称为“机器精度”（machine epsilon）， 对 JavaScript 的数字来说，这个值通常是 `2^-52 (2.220446049250313e-16)`。

从 ES6 开始，该值定义在 Number.EPSILON 中，我们可以直接拿来用，也可以为 ES6 之前 的版本写 polyﬁll：

```js
if (!Number.EPSILON) {     
    Number.EPSILON = Math.pow(2,-52); //定义了一个精度，如果两个数之间的差值小于这个精度，则默认为相等。
}
function numbersCloseEnoughToEqual(n1,n2) {     
    return Math.abs( n1 - n2 ) < Number.EPSILON; 
} 

var a = 0.1 + 0.2; 
var b = 0.3; 
numbersCloseEnoughToEqual( a, b );                  // true 
```

能够呈现的最大浮点数大约是 1.798e+308（这是一个相当大的数字），它定义在 Number. MAX_VALUE 中。

最小浮点数定义在 Number.MIN_VALUE 中，大约是 5e-324，它不是负数，但 无限接近于 0 ！

### 整数安全范围

能够被“安全”呈现的最大整数（即能够唯一确定的数字，即能够使用64位二进制数唯一确定的整数。）

```js
var one = Math.pow(2, 53);
var two = Math.pow(2, 53) + 1;
console.log(one);//9007199254740992
console.log(two);//9007199254740992
```

one和two两者的值是一样的，无法保证唯一。在安全范围内才能确保计算准确。

（-2^53）+1 < 安 全 <（2^53）- 1

即 9007199254740991，在 ES6 中被定义为 Number.MAX_SAFE_INTEGER。

是-9007199254740991，在ES6 中被定义为Number. MIN_SAFE_INTEGER。

检测是否为整数：`Number.isInteger( 42 );     // true `

检测是否为安全整数：`Number.isSafeInteger( Number.MAX_SAFE_INTEGER );    // true `

### 不是值的值

undefined 和 null 常被用来表示“空的”值或“不是值”的值。二者之间有一些细微的差 别。例如：

null 指空值（empty value），声明了，赋值过，但是目前没有值

undefined 指没有值（missing value），声明了，没有赋值

null 是一个特殊关键字，不是标识符，我们不能将其当作变量来使用和赋值。然而 undefined 却是一个标识符，可以被当作变量来使用和赋值，但是建议不要当作标识符使用。

```js
function tmp() {
    return "aa";
}

var one = void tmp();  //void使得返回值为undefiend
console.log(one);
```

### 不是数字的数字，仍然是数字类型

NaN 意指“不是一个数字”（not a number），这个名字容易引起误会，后面将会提到。将它 理解为“无效数值”“失败数值”或者“坏数值”可能更准确些。

```js
var a = 2 / "foo";      // NaN 
 
typeof a === "number";  // true

```

使用`Number.isNaN( a ); `来判断是否是一个NaN。而不使用`isNaN( a ); ` 存在问题。

```js
var a = 2 / "foo"; 
var b = "foo"; 
 
a; // NaN 
b; "foo" 
NaN ==NaN //false  NaN 和自身不相等

isNaN( a ); // true 
isNaN( b ); // true  所以一定要使用Number.isNaN()

```

### 无穷数

```js
var a = 1 / 0; // Infinity   Number.POSITIVE_INfiNITY
var b = -1 / 0; // -Infinity  Number.NEGATIVE_INfiNITY
```

```js
var a = Number.MAX_VALUE; // 1.7976931348623157e+308
a + a; // Infinity
a + Math.pow( 2, 970 ); // Infinity
a + Math.pow( 2, 969 ); // 1.7976931348623157e+308
```

前面说到浮点数最大为Number. MAX_VALUE，最小为Number.MIN_VALUE 。超过了这个限制就会按照规范。

相对于 Infinity，Number.MAX_VALUE + Math.pow(2, 969) 与 Number.MAX_VALUE 更为接近，因此它被“向下取整”（round 

down）；而 Number.MAX_VALUE + Math.pow(2, 970) 与 Infinity 更为接近，所以它被“向上取整”（round up）。

**其他**

Infinity/ Infinity 是一个未定义操作，结果为 NaN。

有穷正数除以 Infinity ，结果是 0。

### 零值

```js
var a = 0 / -3; // -0
var b = 0 * -3; // -0

a.toString(); // "0"
a + ""; // "0"
String( a ); // "0"
JSON.stringify( a ); // "0"

+"-0"; // -0
Number( "-0" ); // -0
JSON.parse( "-0" ); // -0

-0 == 0; // true

function isNegZero(n) {
 n = Number( n );
 return (n === 0) && (1 / n === -Infinity);
}
isNegZero( -0 ); // true
isNegZero( 0 / -3 ); // true
isNegZero( 0 ); // false
```

​		从上面可以看出js中存在0和-0，他们是等值的。同时-0转为字符串，会变为0。字符串类型的“-0”转为整形，会是-0。判断是0还是-0，使用isNegZero方法。

​		-0的意义：有些应用程序中的数据需要以级数形式来表示（比如动画帧的移动速度），数字的符号位（sign）用来代表其他信息（比如移动的方向）。此时如果一个值为 0 的变量失去了它的符号位，它的方向信息就会丢失。所以保留 0 值的符号位可以防止这类情况发生。

### 特殊等式

Object.is(..) 来判断两个值是否绝对相等。可以判断

```js
var a = 2 / "foo";
var b = -3 * 0;
Object.is( a, NaN ); // NaN , NaN  true 
Object.is( b, -0 ); // -0 , -0 true
Object.is( b, 0 ); // -0 , 0 false
```

能使用 == 和 ===时就尽量不要使用 Object.is(..)，因为前者效率更高、更为通用。Object.is(..) 主要用来处理那些特殊的相等比较。



# 第三章：原生函数

JavaScript 的内建函数（built-in function），也叫原生函数（native function），如 String 和 Number。

## [[class]]属性

typeof 返回值为 "object" 的对象（如数组）都包含一个内部属性 [[Class]]（我们可以把它看作一个内部的分类，而非传统的面向对象意义上的类）。这个属性无法直接访问，一般通过 Object.prototype.toString(..) 来查看。

```js
Object.prototype.toString.call( [1,2,3] );
// "[object Array]"
Object.prototype.toString.call( /regex-literal/i );
// "[object RegExp]"
Object.prototype.toString.call( null );
// "[object Null]"
Object.prototype.toString.call( undefined );
// "[object Undefined]"
Object.prototype.toString.call( "abc" );
// "[object String]"
Object.prototype.toString.call( 42 );
// "[object Number]"
Object.prototype.toString.call( true );
// "[object Boolean]"
```

上例中基本类型值被各自的封装对象自动包装，所以它们的内部 [[Class]] 属性值分别为"String"、"Number" 和 "Boolean"。

## 封装对象

基 本 类 型 值 没 有 .length和 .toString() 这样的属性和方法，需要通过封装对象才能访问，此时 JavaScript 会自动为基本类型值包装（box 或者 wrap）一个封装对象。

一般情况下，我们不需要直接使用封装对象。最好的办法是让 JavaScript 引擎自己决定什么时候应该使用封装对象。换句话说，就是应该优先考虑使用 "abc" 和 42 这样的基本类型值，而非 new String("abc") 和 new Number(42)。

想要得到封装对象中的基本类型值，可以使用 valueOf() 函数

## 原生函数做构造函数

String()，Number()，Boolean()，Array()，Object()，Function()，RegExp()，Date()，Error()，Symbol()——ES6 中新加入的！

关于数组（array）、对象（object）、函数（function）和正则表达式，我们通常喜欢以常量的形式来创建它们。实际上，使用常量和使用构造函数的效果是一样的（创建的值都是通过封装对象来包装）。如前所述，应该尽量避免使用构造函数，除非十分必要，因为它们经常会产生意想不到的结果。

**相较于其他原生构造函数，Date(..) 和 Error(..) 的用处要大很多，因为没有对应的常量形式来作为它们的替代。**

var mysym = Symbol( "my own symbol" );

构造函数的原型包含它们各自类型所特有的行为特征，比如 Number#tofixed(..)（将数字转换为指定长度的整数字符串）和 Array#concat(..)（合并数组）。具体可以到浏览器输入：String.prototype查看，所有的函数都可以调用 Function.prototype 中的 apply(..)、call(..) 和 bind(..)。



# 第四章：强制类型转换

# 第五章：语法

# 第六章：异步

把 JavaScript 程序写在单个 .js 文件中，但是这个程序几乎一定是由多个块构成的。这 些块中只有一个是现在执行，其余的则会在将来执行。最常见的块单位是函数。

## 异步控制台（略）

浏览器可能会认为需要把控制台 I/O 延迟到后台，在这种情况下， 等到浏览器控制台输出对象内容时，a.index++ 可能已经执行，因此会显示 { index: 2 }。

## 事件循环

​		有一个用 while 循环实现的持续运行的循环，循环的每一轮称为一个tick。 对每个 tick 而言，如果在队列中有等待事件，那么就会从队列中摘下一个事件并执行。这 些事件就是你的回调函数。

​		setTimeout(..) 并不是直接把回调函数挂在事件循环队列中。它所做的是设定一个定时器。当定时器到时后，环境会把你的回调函数放在事件循环中，这样，在未来 某个时刻的 tick 会摘下并执行这个回调。

​		事件队列是在下一个tick执行，而任务队列是在当前循环中必须执行完。一旦有事件需要运行，事件循环就会运行，直到队列清空。事件循环的每一轮称为一个 tick。用户交互、IO 和定时器会向事件队列中加入事件。

## 并行线程

JavaScript 从不跨线程共享数据，这意味着不需要考虑这一层次的不确定性。但是这并不 意味着 JavaScript 总是确定性的。回忆一下前面提到的，foo() 和 bar() 的相对顺序改变可 能会导致不同结果（41 或 42）。

```js
var a = 20;  
 
function foo() {      a = a + 1;  }  
 
function bar() {      a = a * 2;  }  
 
// ajax(..)是某个库中提供的某个Ajax函数 
ajax( "http://some.url.1", foo );  
ajax( "http://some.url.2", bar );
```

​		在 JavaScript 的特性中，这种函数顺序的不确定性就是通常所说的竞态条件（race condition）， foo() 和 bar() 相互竞争，看谁先运行。具体来说，因为无法可靠预测 a 和 b 的最终结果，所以才是竞态条件。利用代码来规避交互问题。1.4.2

## 任务

​		在 ES6 中，有一个新的概念建立在事件循环队列之上，叫作任务队列（job queue）。这个 概念给大家带来的最大影响可能是 Promise 的异步特性。

​		对于任务队列最好的理解方式就是，它是挂在事件循环队列的每个 tick 之后 的一个队列。在事件循环的每个 tick 中，可能出现的异步动作不会导致一个完整的新事件添加到事件循环队列中，而会在当前 tick 的任务队列末尾添加一个项目（一个任务）。

​		一个任务可能引起更多任务被添加到同一个队列末尾。所以，理论上说，任务循环（job loop）可能无限循环（一个任务总是添加另一个任务，以此类推），进而导致程序的 饿死，无法转移到下一个事件循环tick。从概念上看，这和代码中的无限循环（就像while(true)..）的体验几乎是一样的。

```js
console.log( "A" );  
 
setTimeout( function(){      
    console.log( "B" );  
}, 0 );  
 
// 理论上的"任务API"  ，
schedule( function(){      
    console.log( "C" );  
 
    schedule( function(){          
        console.log( "D" );      
    } );  
} );
```

​		可能你认为这里会打印出 A B C D，但实际打印的结果是 A C D B。因为任务处理是在当前 事件循环 tick 结尾处，且定时器触发是为了调度下一个事件循环 tick（如果可用的话！）

## 语句顺序

​		代码中语句的顺序和 JavaScript 引擎执行语句的顺序并不一定要一致。当你怀疑 JavaScript 引擎 做了什么疯狂的事情时（怀疑结果和预期的不一致，进而怀疑是指令重排导致的问题），实际上却是你自己代码中的 bug。重新排序是不可见 的，一切都没问题。JavaScript 引擎在编译期间执行的都是安全的优化，最后可见的结果都是一样的。

 		JavaScript 语义让我们不会见到编译器语句重排序可能导致的噩梦，这是一种幸运， 但是代码编写的方式（从上到下的模式）和编译后执行的方式之间的联系非常脆弱，理解 这一点也非常重要。

# 第七章：回调

回调地狱问题

## 信任问题

```js
ajax( "..", function(..){    } ); 
```

​		在 JavaScript 主程序的直接控制之下。而 回调方法会延迟到将来发 生，并且是在第三方的控制下——在本例中就是函数 ajax(..)。从根本上来说，这种控制的转移通常不会给程序带来很多问题。
​		但是，请不要被这个小概率迷惑而认为这种控制切换不是什么大问题。实际上，这是回调 驱动设计最严重（也是最微妙）的问题。它以这样一个思路为中心：有时候 ajax(..)（也就是你交付回调 continuation 的第三方）不是你编写的代码，也不在你的直接控制下。多 数情况下，它是某个第三方提供的工具。
​		我们把这称为控制反转（inversion of control），也就是把自己程序一部分的执行控制交给某个第三方。在你的代码和第三方工具（一组你希望有人维护的东西）之间有一份并没有明确表达的契约。

如果第三方不调用回调函数，那么可以如下：如果不调用，那么会在超时时间内报错，如果回调了，那么立即将报错任务删除。

```js
function timeoutify(fn,delay) {      
    var intv = setTimeout( function(){              
        intv = null;              
        fn( new Error( "Timeout!" ) );          
    }, delay )      ;  
 
    return function() {          // 还没有超时？          
        if (intv) {              
            clearTimeout( intv );              
            fn.apply( this, arguments );          
        }      
    };  
}

ajax( "http://some.url.1", timeoutify( foo, 500 ) ); 
```

如果第三方不是异步执行回调函数，那么： 

```js
function asyncify(fn) {      
    var orig_fn = fn,          
        intv = setTimeout( function(){              
            intv = null;              
            if (fn) fn();          
        }, 0 );  
 
    fn = null;  
 
    return function() {          // 触发太快，在定时器intv触发指示异步转换发生之前？         
        if (intv) {              
            fn = orig_fn.bind.apply(                  
                orig_fn,                   // 把封装器的this添加到bind(..)调用的参数中，
                  // 以及克里化（currying）所有传入参数                  
                [this].concat( [].slice.call( arguments ) )               
            );
        }           // 已经是异步           
        else {               // 调用原来的函数              
            orig_fn.apply( this, arguments );           
        }       
    };   
}
```

# 第八章：promise

# 第九章：生成器

定义一个生成器，并构造一个迭代器执行。

```js
var x = 1;  
 
function *foo() {      
    x++;      
    yield; // 暂停！     
    console.log( "x:", x );  
}  
 
function bar() {      x++;  }

// 构造一个迭代器it来控制这个生成器 
var it = foo();  
 
// 这里启动foo()！  
it.next();  x;                 // 2  
bar();  x;                 // 3  
it.next();         // x: 3 
```

## 输入输出

```js
function *foo(x,y) {      
    return x * y;  
}  
 
var it = foo( 6, 7 );  
 
var res = it.next();  
 
res.value;     // 42 
```

```js
function *foo(x) {      
    var y = x * (yield);      
    return y;  }  
 
var it = foo( 6 );  
 
// 启动foo(..)  
it.next();  
 
var res = it.next( 7 );  //向生成器传值
 
res.value;     // 42
```

```js
function *foo(x) {      
    var y = x * (yield "Hello");     // <-- yield一个值！      
    return y;  
}  
 
var it = foo( 6 );  
var res = it.next();    // 第一个next()，并不传入任何东西 ，接受值
res.value;              // "Hello"  
 
res = it.next( 7 );     // 向等待的yield传入7 
res.value;              // 42 
```

