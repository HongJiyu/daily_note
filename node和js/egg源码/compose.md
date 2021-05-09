```json
  return function (context, next) {
    // last called middleware #
    let index = -1
    // 假设只有两个中间件
    // dispatch(0).then(handleResponse).catch(onerror);
    // Promise.resolve(fn1(context, dispatch.bind(null,1) )).then(handleResponse).catch(onerror);
    // 执行中间件1（fn1） => 遇到 next() => 即 dispatch(1) => Promise.resolve(fn2(context, dispatch.bind(null,2)))
    // 执行中间件2（fn2） => 遇到 next() => 即 dispatch(2) => Promise.resolve() => 继续中间件2（fn2） => 继续中间件1（fn1） => then
    return dispatch(0)
    function dispatch (i) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      let fn = middleware[i]
      if (i === middleware.length) fn = next
      if (!fn) return Promise.resolve()
      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
```

