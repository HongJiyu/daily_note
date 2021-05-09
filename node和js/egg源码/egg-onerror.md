koa  使用ctx下的onerror处理错误：比如中间件出现的错误

const onerror = err => ctx.onerror(err);

fnMiddleware(ctx).then(handleResponse).catch(onerror);