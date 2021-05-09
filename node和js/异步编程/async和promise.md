async 返回一个promise对象， await  async func，其实就是执行priomise，然后遇到io操作时，封装请求给其他线程。然后就直接返回了。

```js
async f1()
{
    console.log('11');
    await f2()
    console.log('33');
}
async f2()
{
    console.log('22');
    io操作
}
f1()
```

以上是：11 =》22，然后f1就返回了。这个请求就进入了等待。而node进程则是处理其他请求。等f2的io完成。再继续输出33。promise的then是在每次事件循环各个阶段执行完成后执行的。仅此于nextTick