# node

## 基础

### var、let、const

- var会变量提升，及声明会被提升，赋值不会提升，且可被反复声明。无块作用域，也就是无视块作用域的限制。只有函数作用域
- let、const有块作用域，在同一作用域下只可声明一次，但可在子作用域下声明父作用域已声明的变量。不会出现变量提升。
- for的() 和{} 是建立了一个父作用域和子作用域。
- 暂时性死区：**凡是在声明之前就使用这些变量,就会报错,所以在代码块内,使用`let`命令声明变量之前,该变量都是不可用的**

```js
let sName = 'itclan';
if (true) {
  console.log(sName); // Uncaught ReferenceError:sName is not defined
  let sName = 'itclan';
}
```

### 闭包

定义：所有的函数都是一个闭包。不过闭包更多地体现在嵌套函数，即子函数能够访问父函数的局部变量。当父函数返回子函数或者是子函数被外部变量所引用，那么父函数的作用域不会被回收。（大量则导致内存泄漏）

原理：同一个函数内部的闭包作用域只有一个，所有闭包共享。在执行函数的时候，如果遇到闭包，则会创建闭包作用域的内存空间，将该闭包所用到的局部变量添加进去，然后再遇到闭包，会在之前创建好的作用域空间添加此闭包会用到而前闭包没用到的变量。函数结束时，清除没有被闭包作用域引用的变量。

好处：外部函数的变量驻扎内存中，同时可以避免变量污染全局，限制访问。

危害：内存泄漏。

场景：局部变量实现自增。

### this绑定

具体看node和js中this绑定与丢失（new绑定、显示绑定、隐式绑定、默认绑定）

### call、apply、bind

都是改变指向。call和apply是直接执行，bind只是绑定。call和apply的区别是参数。

```js
fn.call(obj,xx,xx,xx)
fn.apply(obj,[xx,xx,xx])
fn1=fn.bind(obj); fn1(xx,xx,xx);
```

### 原型

https://blog.csdn.net/cc18868876837/article/details/81211729

- 构造函数和函数的区别。构造函数默认命名首字母大写。用this.xx来构造属性。
- prototype属性每个函数都会有，是这个函数的原型，用于实例的公共函数。
- `__proto__`，函数和对象都有，用于找到上一级的原型（对象则是找到其构造函数的原型）（原型则是找到上一级的原型），最终指向null
- prototype 和__proto__ 一个是找本级的原型，一个是找上一级的原型
- construct，函数和对象都有，找到构造函数。（一个构造函数的原型和实例对象，同样的原型和实例对象的构造函数是同一个）最终指向Function()
- 创建一个对象，其原型指向tmp ：`const new1 = Object.create(tmp);  console.log(new1.__proto__===tmp);  `  
- for in 会取找原型链

### promise

`new promise((resolve,reject)=>{ }).then((data)=>{},(err)=>{})`

注意点：

https://www.cnblogs.com/zhujieblog/articles/13161364.html

- .then 或者 .catch 的参数期望是函数，传入非函数则会发生值穿透。`（p.resolve(1).then(2).then((data)=>{console.log(data)})） 打印的是1`
- 首先`Promise`构造函数会立即执行。
- `promise`的状态一旦由等待`pending`变为成功`fulfilled`或者失败`rejected`。那么当前`promise`被标记为完成，后面则不会再次改变该状态。
- `resolve`函数和`reject`函数都将当前`Promise`状态改为完成，并将异步结果，或者错误结果当做参数返回。
- `then`方法和`catch`方法都能多次调用。要给下一个传参数，必须return，不管是return promsie还是return data。
- then(()=>{//代码}).then() ，代码中，如果直接return data，则不需要等待下一个事件循环。如果是 return promise，则需要等下一个事件循环才会执行下一个then。

编写时，存在同步代码和异步代码。 

- 异步代码，在then中，要用promise包起来，resolve是决定下一个then的什么时候执行。如果还要返回值给下个then则需要resolve(data) 并return promise((resolve)=>{resolve(data)})
- 同步代码，在then中，不需要promise包起来，也就不需要resolve（then代码执行完自动执行下个then），要返回值给下一个then，则直接return data
- then 不需要写error函数，最后用catch捕获即可。

### 生成器和await async

### 垃圾回收

```js
process.memoryUsage()
//每个进程在64位操作系统下，默认1.4g，打破默认的配置：
max-old-space-size
max-new-space-size
```

新生代和老年代 、 新生代用复制、老年代用标记清除或标记整理。

验证可达性：引用技术、gcroot（todo）

## 深入

### 事件循环

结合看：具体看 node和js =》libuv 源码（笔记） + understand nodejs

红黑树和最小堆的

```js
require("bintrees")   // 红黑树
require('js-algorithms')   // 其他数据结构
```



### 异步io

- 阻塞非阻塞
- 同步异步

### 异步编程

1. 回调
2. 事件监听
3. 发布订阅

### require机制

https://nodejs.org/docs/latest-v12.x/api/modules.html#modules_all_together

```txt
LOAD_NODE_MODULES(X, dirname(Y))

LOAD_NODE_MODULES(X, START)
1. let DIRS = NODE_MODULES_PATHS(START)
2. for each DIR in DIRS:
   a. LOAD_PACKAGE_EXPORTS(X, DIR)
   b. LOAD_AS_FILE(DIR/X)
   c. LOAD_AS_DIRECTORY(DIR/X)

NODE_MODULES_PATHS(START)
1. let PARTS = path split(START)
2. let I = count of PARTS - 1
3. let DIRS = [GLOBAL_FOLDERS]
4. while I >= 0,
   a. if PARTS[I] = "node_modules" CONTINUE
   b. DIR = path join(PARTS[0 .. I] + "node_modules")
   c. DIRS = DIRS + DIR
   d. let I = I - 1
5. return DIRS

LOAD_PACKAGE_EXPORTS(X, DIR)
1. Try to interpret X as a combination of NAME and SUBPATH where the name
   may have a @scope/ prefix and the subpath begins with a slash (`/`).
2. If X does not match this pattern or DIR/NAME/package.json is not a file,
   return.
3. Parse DIR/NAME/package.json, and look for "exports" field.
4. If "exports" is null or undefined, return.
5. let MATCH = PACKAGE_EXPORTS_RESOLVE(pathToFileURL(DIR/NAME), "." + SUBPATH,
   `package.json` "exports", ["node", "require"]) defined in the ESM resolver.
6. RESOLVE_ESM_MATCH(MATCH)

LOAD_AS_FILE(X)
1. If X is a file, load X as its file extension format. STOP
2. If X.js is a file, load X.js as JavaScript text. STOP
3. If X.json is a file, parse X.json to a JavaScript Object. STOP
4. If X.node is a file, load X.node as binary addon. STOP

LOAD_AS_DIRECTORY(X)
1. If X/package.json is a file,
   a. Parse X/package.json, and look for "main" field.
   b. If "main" is a falsy value, GOTO 2.
   c. let M = X + (json main field)
   d. LOAD_AS_FILE(M)
   e. LOAD_INDEX(M)
   f. LOAD_INDEX(X) DEPRECATED
   g. THROW "not found"
2. LOAD_INDEX(X)

LOAD_INDEX(X)
1. If X/index.js is a file, load X/index.js as JavaScript text. STOP
2. If X/index.json is a file, parse X/index.json to a JavaScript object. STOP
3. If X/index.node is a file, load X/index.node as binary addon. STOP

// 其他 GLOBAL_FOLDERS
Additionally, Node.js will search in the following list of GLOBAL_FOLDERS:
1: $HOME/.node_modules
2: $HOME/.node_libraries
3: $PREFIX/lib/node
Where $HOME is the user's home directory, and $PREFIX is the Node.js configured node_prefix
```

```txt
y文件里面引用x文件（找node_modules）
0. 如果是系统对象，则直接返回。如果是路径(./xx/ 或者 ../xx/)则直接找文件。
1. 根据y的文件路径（/xx/xx/y.js），则文件路径是 /xx1/xx2/
2. 逐层往上找，/xx2/xx1/node_modules, /xx2/node_modules，以及GLOBAL_FOLDERS
3. 在以上目录找
①尝试将x（@scope/xx）解析成有两段即：name：@scope，/xx ：subPath，然后先找 name/package.js的export字段
②x是文件， x，x.js，x.json，x.node 
③x是目录， x/package.json 的main字段，通过main字段去找index.js 文件。 如果无main字段，则直接在x/下找index.js文件
```

### npm i 原理

package.json 和package-lock.json和node_modules

https://www.cnblogs.com/goloving/p/14602743.html

### 内存监控

- heapdump

https://www.cnblogs.com/xieqianli/p/12619886.html

https://www.bookstack.cn/read/node-in-debugging/2.2heapdump.md

summary视图（构造函数）：

1. Contructor：构造函数名，例如 Object、Module、Socket，(array)、(string)、(regexp) 等加了括号的分别代表内置的 Array、String 和 Regexp。
2. Distance：到 GC roots （GC 根对象）的距离。GC 根对象在浏览器中一般是 window 对象，在 Node.js 中是 global 对象。距离越大，则说明引用越深，有必要重点关注一下，极有可能是内存泄漏的对象。
3. Objects Count：对象个数。
4. Shallow Size：对象自身的大小，不包括它引用的对象。
5. Retained Size：对象自身的大小和它引用的对象的大小，即该对象被 GC 之后所能回收的内存大小。

Comparison 视图（两个快照的对比）：

new ，deleted ，delta ，alloc size，freed size ， size data



- node-memwatch（被遗弃）:安装失败。。。垃圾回收触发stat事件，连续5次垃圾回收但是内存都是上升则触发leak事件。



以上两个结合：做到leak事件后触发生成dump文件。

### 多进程

https://www.cnblogs.com/chyingp/p/node-learning-guide-child_process.html

https://blog.csdn.net/hongchh/article/details/79898816

# koa

## 洋葱

dispatch 函数类似于流程控制，让一个数组函数递归地执行，而数组里函数的参数必须接收这个dispatch函数。

```js
'use strict'

/**
 * Expose compositor.
 */

module.exports = compose

/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Array} middleware
 * @return {Function}
 * @api public
 */

function compose (middleware) {
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
  }

  /**
   * @param {Object} context
   * @return {Promise}
   * @api public
   */

  return function (context, next) {
    // last called middleware #
    let index = -1
    return dispatch(0)
    function dispatch (i) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      let fn = middleware[i]
      if (i === middleware.length) fn = next
      if (!fn) return Promise.resolve()
      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)))
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}
```

仿制

```js
const fn1 = function(next){
    console.log(1);
    next();
}
const fn2 = function(next){
    console.log(2);
    next();
}
const fn3 = function(next){
    console.log(3);
    next();
}
const arr = [fn1,fn2,fn3]; 

const dispatch = function(i){
    if(i>arr.length-1){
        console.log('end');
        return;
    }
    const fn = arr[i];
    if(fn){
        fn(dispatch.bind(null,i+1));
    }else{
        throw new Error("error");
    }
}
dispatch(0)
```

# egg

## 组件加载

 具体看 node和js =》egg源码 => egg-core，针对性看plugin + service 即可。

## 项目启动源码

egg-bin

## 性能监控

egg-xtransit

alinode
