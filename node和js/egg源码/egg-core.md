egg-core包

其根目录下的index.js，指明了对外暴露的资源：

EggCore  整个包最核心的类，内嵌了EggLoader。

EggLoader 其原型上内嵌了所有资源的加载器。

BaseContentClass 基础类。构造方法用于将资源挂载到它根路径上。

utils 提供整个文件需要用到的工具类。

# Loader

主要还是loader文件夹，里面包含了对每种资源的加载。

1. 周末时间粗略地阅读了egg-core的源码，其根目录下的index.js，指明了对外暴露的资源：

   1. EggCore 整个包最核心的类，内嵌了EggLoader。
   2. EggLoader 其原型上内嵌了所有资源的加载器。
   3. BaseContentClass 基础类。构造方法用于将资源挂载到它根路径上。
   4. utils 提供工具类。

   主要还是loader文件夹，里面包含了对每种资源的加载。

## plugin

   `egg-core/lib/loader/mixin/plugin.js`
   从loadPlugin()入手，整体流程为：
   1.读取应用和所有框架的插件配置文件，并为每个插件对象初始化属性。因为插件可以简略配置如：`redis：true` 变为：

   ```
   plugins[name] = {
       name,
       enable: plugin,
       dependencies: [],
       optionalDependencies: [],
       env: [],
       from: configPath,
      }
   ```

   同时从`EGG_PLUGINS`环境变量获取用户自定义插件。

   2.合并所有插件配置，即用户自定义配置覆盖应用插件，应用插件覆盖框架插件。

   3.为每个插件对象赋予对应在`node_modules`所处路径（path属性）。先从应用路径的`node_modules`=》框架的`node_modules`再到命令执行路径下的`node_modules`下找。

   4.在上面的path中找到对应插件的`package.json`，并将`'dependencies', 'optionalDependencies', 'env'`覆盖（没有才覆盖）插件对象的属性。

   5.根据当前的`EGG_SERVER_ENV`和插件的env，来禁用某些插件。

   6.在getOrderPlugins调用utils中sequencify方法（**递归，很精髓**）：检查插件的依赖关系、插件的依赖包是否完整，如果存在循环依赖、依赖包不完整则报错。对被依赖的插件，但是被禁用的，重新设置为enable。并返回最终的所有插件配置。

## config

   `egg-core/lib/loader/mixin/config.js`

   1. 预先加载应用的两个配置`'config.default'和config.${this.serverEnv}`
   2. 再遍历所有插件、框架以及应用的配置，并将预先加载的应用的结果传递给插件和框架的加载配置中。
   3. 使用extend2依赖包来进行合并。
   4. 加载环境变量`EGG_APP_CONFIG`的定义的配置。
   5. 将`coreMiddleware`不存在则初始化，并赋予给`coreMiddlewares`。将`middleware`不存在则初始化，并赋予给`appMiddlewares`和`appMiddleware`。
   6. 同时以上所有参数的合并过程中，有一个`configMeta`用来记录所有配置合并后的结果，不过将其值更改为`filePath`。

   

## Extend

1. 获取所有加载单元（覆盖顺序也是由它决定的）下的app/extend/name。

2. 如果非单元测试环境，但是设置了`EGG_MOCK_SERVER_ENV`则同时加载单元测试环境的文件，否则只加载对应环境下的。

3. 遍历每一个文件下的每一个属性

```js
Object.getOwnPropertyNames(ext).concat(Object.getOwnPropertySymbols(ext))
```

如果已存在，则会告警，然后覆盖。

4. 通过`getOwnPropertyDescriptor`获取原属性的描述符和extend文件中属性的描述符。

原属性存在set，但extend文件的属性不存在，则用原属性的set描述符。get描述符同理。

5. 最后用`Object.defineProperty`进行覆盖。

## FileLoader

先看构造方法的所有参数。然后再看load方法和parse方法。

具体流程：

1. 确定要在指定目录下（例如：/xx/app/service）进行匹配时文件的正则，默认是所有js文件（`**/*.js`）。确定要忽略的文件，例子： `!xx/x.d.ts`，然后合并两者。
2. 在指定目录下，通过globby去匹配这些正则。然后对每个匹配到得路径，获取properties（匹配到的文件的路径 demand/test，则properties为 ['demand','test']），然后再和目录的最后一个文件名，拼接如下：（service.demand.test）
3. 加载匹配到的文件，如果有，则根据initializer去处理加载后的exports。或者：如果是class or generator 则直接返回。如果是方法，并且call为true。则执行exports并将执行结果返回。
4. 根据参数filter去过滤exports，然后将所有的export 去push到items。
5. 遍历items，使用reduce灵活地根据properties生产对象。根据override判断是否需要覆盖。具体如：为一个空对象obj={}，properties=['demand','test']，export为TestClass 生成为.

```js
obj={
    demand：{
    test：TestClass
}
}
```

6. 注意TestClass 如果是一个非基本类型，会给他赋予一个`obj[EXPORTS] = true;`，在ContextLoader会去判断是否是最后一层（文件），不然还是文件夹。

## Service(加载到ctx)

loadService方法：

1. 初始化属性，然后调用loadToContext方法。

loadToContext方法：

1. 再次初始化属性，实例化ContextLoader，并调用load方法。

## ContextLoader

是FileLoader的子类，它用来联合Service和FileLoader这两个类，做到将所有service采用懒加载的方式加载到ctx上。

注意：

1. ContextLoader的target，在super(options)时，传递给了FileLoader，并且后续调用FileLoader的load方法`new ContextLoader(opt).load();`，将所有的service都赋予给了target。如下

```js
target={
    serviceFold:{
        serviceFold1:service1(export的内容，如果时方法则是方法的返回值)
        serviceFold2:service2(export的内容)
    }
}
```

2. getInstance方法的`values[EXPORTS]`和FileLoder中对export的内容赋予的值是相对应的，用来判断是否是最后一层，如果是且为class，则new，若为object，则return。如果不是最后一层，而是中间文件夹，则new ClassLoader。

3. 全程都是通过definedProperty，且有用map进行缓存。因此很轻量（只有ctx用到某一个service，才会去加载这条链路，否则不会）。

```js
    Object.defineProperty(this, property, {
      get() {
        let instance = this._cache.get(property);
        if (!instance) {
          instance = getInstance(values, this._ctx);
          this._cache.set(property, instance);
        }
        return instance;
      },
    });
```

4. 一开始会将service定义在ctx上。然后如果使用ctx.service那么会调用它的service的属性描述符get方法，然后实例化为一个ClassLoder，并为其下的其他属性定义了get方法。调用ctx.service.test。则调用test的get属性描述符，如果test是一个文件夹，则继续实例化为ClassLoader并为旗下其他属性定义get方法。如果是一个类或者对象。则new或者直接返回。

## Middleware（加载到app）

所有加载单元的app/middleware下的，都会被加载到app.middlewares上，但是只有配置启动的（app.use(mv)）或者写在路由上，才会真正被使用。

```js
//中间件的固定写法
module.exports = (options,app) => {
  return async function midwareTest(ctx, next) {
    await next();
  };
};
```

执行流程：

1. middleware文件夹下不支持文件夹，应该。
2. 按照所有加载单元的顺序遍历，将中间件加载到app.middlewares上。同时遍历middlewares，通过`defineProperty`将中间件都定义到app.middleware上，且赋予属性描述符get，并且是不可枚举不可修改配置。get方法，return的是`app.middlewares[name]`，这是为什么middleware是数组，但是也能`const {middleware:{middlewareName}}=app`

```js
app.middlewares={
    [middleName]:(options,app) => {} //（因为call为false）
}
```

3. 从config中获取coreMiddleware和appMiddleware，合并。这些是要启动的中间件。然后遍历
   1. 判断要启动的中间件是否在app.middlewares中，不存在、map判断重复都报错。
   2. 获取config中对该中间件的配置以及app（作为参数），执行中间件方法。
   3. 如果config中对该中间件的配置有ignore或match，则对该中间件封装。

```js
(ctx, next) => {
       if (!match(ctx)) return next();  //egg-path-matching进行匹配
       return mw(ctx, next); 
     };
```

4. 使用`app.use(mw)`启动该中间件（koa的用法）。

### middleware之egg-session

1. 打印app.middlewares，里面有fullpath（因为加载中间件时会赋予它fullpath属性），指明了这个中间件的路径。是egg-session。

   ```js
   FileLoader的load方法：obj[FULLPATH] = item.fullpath;
   ```

3. 找到egg-session的middleware方法下是一个文件`require('koa-session')`

4. koa-session的index文件。就是本次的中间件，

   ```js
     return async function session(ctx, next) {
       const sess = ctx[CONTEXT_SESSION];
       if (sess.store) await sess.initFromExternal();
       try {
         await next();
       } catch (err) {
         throw err;
       } finally {
         if (opts.autoCommit) {
           await sess.commit();
         }
       }
     };
   ```

6. opts.autoCommit默认为true。可以在config配置文件配置`session:{autoCommit:false}`，那么会一直登录不上。因为火星登录是修改session，但是没有提交到redis中去。

## Controller （加载到app）

同service，不过需要注意initializer方法， 这个函数就是用来针对不同的情况将 controller 中的内容转换为中间件的。

# Router

不想看了