# 串行执行

必须是以promise开头

then里面的成功函数必须是return promise

catch后可以继续then函数

reject和catch应该是一个意思，都是捕获错误。

# 简单的Promise

Promise的api

1. 接受完成态，错误态时的回调方法，以便在Promise状态改变时，调用相应回调方法。

2. 只接受函数

3. then方法会继续返回一个Promise，以实现链式调用。其实then方法的行为只是将他接受的回调函数储存起来，在某一刻Promise状态改变时，再进行调用罢了。

Deferred的api：改变Promise状态的对象，即延迟对象。

```js
'use strict';
const fs = require('fs');
/*
  first version
*/

// promise
const myPromise = function() {
  this.handle = {}; // 储存处理函数
};
myPromise.prototype.then = function(resolveHandler, rejectHandler) {
  const handle = {};
  if (typeof resolveHandler == 'function') {
    handle.resolve = resolveHandler;
  }
  if (typeof rejectHandler == 'function') {
    handle.reject = rejectHandler;
  }
  this.handle = handle;
};

// deferred
const myDeferred = function() {
  this.status = 'pending';
  this.promise = new myPromise();
};
myDeferred.prototype.resolve = function(obj) {
  this.status = 'resolve';
  const handle = this.promise.handle;
  if (handle && handle.resolve) {
    handle.resolve(obj);
  }
};
myDeferred.prototype.reject = function(obj) {
  this.status = 'reject';
  const handle = this.promise.handle;
  if (handle && handle.reject) {
    handle.reject(obj);
  }
};

// 构造异步的read
function read(path) {
  const deferred = new myDeferred();
  fs.readFile(path, (err, data) => {
    if (err) {
      deferred.reject(err);
      return;
    }
    deferred.resolve(data);
  });
  return deferred.promise;
}

// 调用
read('promise.js').then(data => {
  console.log(data);
}, err => {
  console.log(err);
});

```

# 调用链：（但是没有关于状态和catch的内容）

1. 将所有回调都存入到队列中

2. Promise完成时，逐个执行回调，一旦检测到返回了新的Promise对象，停止继续执行回调。然后将当前的deferred对象的promise引用改变为新的Promise对象，并将队列余下回调转交给它。

```js
'use strict';
const fs = require('fs');

const Promise = function() {
  this.queue = [];
  this.isPromise = true;
};
Promise.prototype.then = function(fulfilledHandler, errorHandler, progressHandler) {
  const handler = {};
  if (typeof fulfilledHandler === 'function') {
    handler.fulfilled = fulfilledHandler;
  }
  if (typeof errorHandler === 'function') {
    handler.error = errorHandler;
  }
  this.queue.push(handler);
  return this;
};


const Deferred = function() {
  this.promise = new Promise();
};
Deferred.prototype.resolve = function(obj) {
  const promise = this.promise;
  let handler;
  while ((handler = promise.queue.shift())) {
    if (handler && handler.fulfilled) {
      const ret = handler.fulfilled(obj);
      if (ret && ret.isPromise) {
        ret.queue = promise.queue;
        this.promise = ret;
        return;
      }
    }
  }
};
Deferred.prototype.reject = function(err) {
  const promise = this.promise;
  let handler;
  while ((handler = promise.queue.shift())) {
    if (handler && handler.error) {
      const ret = handler.error(err);
      if (ret && ret.isPromise) {
        ret.queue = promise.queue;
        this.promise = ret;
        return;
      }
    }
  }
};
// 生成回调函数
Deferred.prototype.callback = function() {
  const that = this;
  return function(err, file) {
    if (err) {
      return that.reject(err);
    }
    that.resolve(file);
  };
};

const readFile1 = function(file, encoding) {
  const deferred = new Deferred();
  fs.readFile(file, encoding, deferred.callback());
  return deferred.promise;
};
const readFile2 = function(file, encoding) {
  const deferred = new Deferred();
  fs.readFile(file, encoding, deferred.callback());
  return deferred.promise;
};

readFile1('E:\\0nodejsworkspace\\test\\promise\\file1.txt', 'utf8')
  .then(function(file1) {
    console.log(file1);
    return readFile2('E:\\0nodejsworkspace\\test\\promise\\file1.txt', 'utf8');
  })
  .then(function(file2) {
    console.log(file2);
  });

```

# 真正的Promise

在事件循环中，promise.resolve() ，会在该次事件循环（6个阶段都执行完）后再执行process.nextTick和promise.resolve。（指北这么说的）。

Promise能够实现异步，也就是不阻塞其他请求。其实是事件循环的原因。promise能够继续下去，其实是依靠异步回调，也就是调用resolve()。

promise本质上也只是一个流程控制器。