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

arguments其实只是一个对象，以数字作为变量名。如：`[Arguments] { '0': 1, '1': 2, '2': 3 }`

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

isNaN( a ); // true 
isNaN( b ); // true  所以一定要使用Number.isNaN()

```

### 无穷数