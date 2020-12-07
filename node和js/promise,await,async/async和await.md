# generator函数：

```js
'use strict';
function* test() {
  const result = yield new Promise(resolve => { setTimeout(() => { resolve(200); }, 200); });
  return 20;
}

const iterator = test();
console.log(iterator.next());  //{ value: Promise { <pending> }, done: false }
console.log(iterator.next());  //{ value: 20, done: true }
```

（1）遇到yield表达式，就暂停执行后面的操作，并将紧跟在yield后面的那个表达式的值，作为返回的对象的value属性值(没有就为undefined)。
（2）下一次调用next方法时，再继续往下执行，直到遇到下一个yield表达式。
（3）如果没有再遇到新的yield表达式，就一直运行到函数结束，直到return语句为止，并将return语句后面的表达式的值，作为返回的对象的value属性值。
（4）如果该函数没有return语句，则返回的对象的value属性值为undefined。

**总结：**每次next，就继续执行下一次，然后立即返回。这里有个好处，就是**可以通过next控制执行流程。而又可以通过promise来保证下次执行在上次执行完成后才执行**。如下：

```js
'use strict';
function* test() {
  const result = yield new Promise(resolve => { setTimeout(() => { resolve(200); }, 200); });
  return 20;
}

const iterator = test();
iterator.next().value
  .then(result => {
    return iterator.next().value;
  });
```

# async 和 await

async他其实就是Generator的语法糖。

因为Generator最大的毛病就在于，他需要我们自己管理异步流程，而async/await就是为了解决这一问题的。他内置了执行器，帮我们进行异步流程的管理。他的执行流程如下

```js
'use strict';
async function test() {
  const result = await one();
  console.log('test');
  return 20;
}
 function one() {
  return new Promise(resolve => {
    setTimeout(() => { resolve(); }, 2000);
  });
}
//==>类似变成
function* test() {
  const result = yield new Promise(resolve => { setTimeout(() => { resolve(); }, 2000); });
  return 20;
}
```

以上只是一个大概，只需要知道async和await ，其实内部还是通过 generator和promise实现的。

# 总结

```js
async function test() {
  const result = await one();
  console.log('test');
  return 20;
}
```

这个函数test函数中，one可以是一整条异步链。通过promise实现异步链的顺序。

而await也可以看作yield，通过next（）函数，保证console.log不会先于one函数执行。因为要在one返回的是promise，在promise.then() 里面才执行next（）函数。



promise 保证这一整条异步链的执行顺序。

yield保证这个函数的执行顺序。（其实也是通过promise包着next（）方法）