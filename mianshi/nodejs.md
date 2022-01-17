# node

## 基础

### 闭包

定义：所有的函数都是一个闭包。不过闭包更多地体现在嵌套函数，即子函数能够访问父函数的局部变量。当父函数返回子函数或者是子函数被外部变量所引用，那么父函数的作用域不会被回收。（大量则导致内存泄漏）

原理：同一个函数内部的闭包作用域只有一个，所有闭包共享。在执行函数的时候，如果遇到闭包，则会创建闭包作用域的内存空间，将该闭包所用到的局部变量添加进去，然后再遇到闭包，会在之前创建好的作用域空间添加此闭包会用到而前闭包没用到的变量。函数结束时，清除没有被闭包作用域引用的变量。

好处：外部函数的变量驻扎内存中，同时可以避免变量污染全局。

场景：暂无特殊使用场景。

### this绑定

具体看this绑定与丢失（new绑定、显示绑定、隐式绑定、默认绑定）

### call、apply、bind

都是改变指向。call和apply是直接执行，bind只是绑定。call和apply的区别是参数。

```js
fn.call(obj,xx,xx,xx)
fn.apply(obj,[xx,xx,xx])
fn1=fn.bind(obj); fn1(xx,xx,xx);
```

### 内存控制（垃圾回收）

```js
process.memoryUsage()
//每个进程在64位操作系统下，默认1.4g，打破默认的配置：
max-old-space-size
max-new-space-size
```

新生代和老年代 、 新生代用复制、老年代用标记清除或标记整理。



## 深入

事件循环、异步非阻塞io、异步编程、require机制、npm i 原理、内存泄漏（原因及排查）

### 事件循环

libuv源码 +  uv_loop_s 

### 异步io



### 异步编程

1. 回调
2. 事件监听
3. 生成消费
4. promise

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
1. 根据y的文件路径（/xx/xx/y.js），则文件路径是 /xx1/xx2/
2. 逐层往上找，/xx2/xx1/node_modules, /xx2/node_modules，以及GLOBAL_FOLDERS
3. 在以上目录找
①尝试将x（@scope/xx）解析成有两段即：name：@scope，/xx ：subPath，然后先找 name/package.js的export字段
②x是文件， x，x.js，x.json，x.node 
③x是目录， x/package.json 的main字段，通过main字段去找index.js 文件。 如果无main字段，则直接在x/下找index.js文件
```

### npm i 原理

package.json 和package-lock.json

https://www.cnblogs.com/goloving/p/14602743.html

### 内存监控



# koa

洋葱-》中间件加载机制

# egg

各类组件加载机制、socketIO及解决方案、node多进程（master、worker、agent）

