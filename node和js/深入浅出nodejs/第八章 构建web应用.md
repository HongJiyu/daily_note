```js
var http = require('http'); 
http.createServer(function (req, res) { 
 res.writeHead(200, {'Content-Type': 'text/plain'}); 
 res.end('Hello World\n'); 
}).listen(1337, '127.0.0.1'); 
console.log('Server running at http://127.0.0.1:1337/');
```

基于以上的createServer的参数——》高级函数，进行处理。将许多处理细节封装到这个高级函数里。像connect、express示例：

```js
var app = connect(); 
// var app = express(); 
// TODO 
http.createServer(app).listen(1337);
```



请求方法在req.method

请求路径在req.url

# cookie

cookie在req.headers.cookie （第三方cookie）

- 减少cookie大小
- 静态组件用不同的域名，dns缓存

其他看安全下的cookie

# session

session 存储在服务端，因此需要客户端和服务段的数据对应起来（服务端根据客户端传递的信息，在服务端找到对应的session）。

- 基于cookie实现关联，cookie存储session的口令。（依赖cookie）
- url带上session_id实现关联，如果没有则新生成后返回302和location，浏览器会重新跳转。（其他人拿到session_id，就能拥有别人的身份）

session存储在服务端内存，存在问题：

- 用户激增，内存不够用。
- 服务为了利用多核cpu启动多个进程，进程所占内存互不通，不能直接共享。

session安全：

- 防止伪造：session随机算法可能存在一定规律，让黑客查询到可能的结果，以获取正确的session进而获取用户在服务器上的信息。（只防止伪造，黑客拿到正确的session，那么就无法阻止了）

![image-20201124164009107](D:\note\node和js\深入浅出nodejs\image\image-20201124164009107.png)

如果私钥还包含用户特定信息，那么即使黑客拿到原值和签名，那也无法被破解。比如：用户ip和用户代理等。

- csrf ：看安全
- xss：看安全

# 前端资源缓存

- expires或Cache-Control
- 配置ETags
- 让Ajax可缓存

## 缓存操作

浏览器访问服务器，并将静态资源缓存在本地目录中，等第二次请求时，会判断该文件能够继续被使用，可以的化，就不会再向服务器获取新的资源。

If-Modified-Since（时间，秒级别）：浏览器将该属性放在头部请求服务器，请求的文件stat的mtime（node查看文件的属性），发现两者匹配，表示文件没改变过。**因此返回304**。则浏览器直接使用本地版本。

使用秒级别的时间存在问题：

- 时间改变，内容不一定改变。
- 秒级别，如果文件在0.5s内改动，那时间还是原来的时间，会让客户端以为时间没变，即认为内容没变。

解决：使用ETag：服务器生成-文件内容的散列值。

请求和响应属性：

If-Modified-Since/Last-Modified

If-None-Match/ETag

浏览器第一次访问，服务器会返回ETag。浏览器第二次访问，将之前的ETag值放在If-None-Match（头部

）中进行请求。

以上还是会发起http请求，以求判断是否需要使用本地缓存，最好的办法时连请求都不发。

## 缓存优化

在YSlow规则里：在响应里设置Expires或Cache-Control头，浏览器将根据该值进行缓存。

Expires是一个GMT格式的时间字符串，只要在这个值过期前都从本地拿取缓存。不过因为是一个确切的时间，如果客户端和服务端时间不一致，那么会出现问题。（客户端比服务端慢，客户端晚到达时间，那么晚的时间，其实服务端已经更新了文件）

Cache-Control：设置了max-age值，是过多久之后时间过期，是一个时间段，而不是时刻。

max-age会覆盖expires

## 清除缓存

缓存是以url来缓存的，因此url改变，就会重新从服务器获取资源。

以多益官网为例，就是采用的cache-control和etag。

cache-control：no-cache，max-age

no-cache：每次都去检验。

etag：该资源的内容的hash。

以下是访问同一个资源文件：

![image-20201124225008206](image\image-20201124225008206.png)

前面几次都是200，因为谷歌浏览器设置了disable cache。后面几次304是将disable cache去掉，由前面说的，校验到资源未变动，采用本地缓存资源，服务器返回304。后面又变成200，是因为资源缓存是依赖url的，url变动了（后面多了参数），所以又变成200。后续继续访问，又变成304了。

# 数据上传

http模块只对头部进行了解析，判断是否有内容需要用户自行接收和解析。通过transfer-Encoding或content-length即可判断你请求中是否带有内容（请求体，而非路径参数和query参数）。

不过在HTTP_Parser解析报头结束后，报文内容会通过data事件触发，我们只需要以流的方式处理即可。

![image-20201124231602093](image\image-20201124231602093.png)

实践：看看req.rawBody是否存在对象。

## 表单数据

application/x-www-form-urlencoded

`querystring.parse(req.rawBody)`

## json

application/json

`JSON.parse(req.rawBody)`

## xml

xml2js模块。

## 文件

multipart/form-data;boundary=AaB03x。

Content-Length

boundary：指定每部分内容的分界，报文体内容开头：在boundary前面添加--为开头，报文结束时在它前后都加上--表示结束。

```js
--AaB03x\r\n 
Content-Disposition: form-data; name="username"\r\n 
\r\n 
Jackson Tian\r\n 
--AaB03x\r\n 
Content-Disposition: form-data; name="file"; filename="diveintonode.js"\r\n 
Content-Type: application/javascript\r\n 
\r\n 
 ... contents of diveintonode.js ... 
--AaB03x--
```

已知格式，解析就容易多了，但是未知数据量，需要谨慎。

formidable模块，它基于流式处理解析报文，**将接收到的文件写入到系统的临时文件夹中**，并返回对应的路径：

```js
var formidable = require('formidable'); 
function (req, res) { 
 if (hasBody(req)) { 
 if (mime(req) === 'multipart/form-data') { 
 var form = new formidable.IncomingForm(); 
 form.parse(req, function(err, fields, files) { 
 req.body = fields; 
 req.files = files; 
 handle(req, res); 
 }); 
 } 
 } else { 
 handle(req, res); 
 } 
}
```

因此只需要检查req.body和req.files中的内容即可。

# 数据上传与安全

- 内存限制

  Connect采用req.on('data') 逐块录入。

- csrf

# 路由解析

略

# 中间件

中间件，**就是由数组保存，然后通过递归调用**。这也是为什么每个中间件，都需要next()，同时还是洋葱模型。

![image-20201125193909266](D:\note\node和js\深入浅出nodejs\image\image-20201125193909266.png)

# 异常处理

异步的异常处理没看懂，在递归里面。

# 页面渲染

content-type：报文头上的content-type指明了报文内容的类型，它的值是mime。接收方会根据这个mime值去做对应的处理。

在node中，require('minme'); mime.lookup('txt')  即可查看这个文件类型的mime值。

## 响应

附件下载：

```js
fs.stat(filepath, function(err, stat) {
     var stream = fs.createReadStream(filepath);
     // 设置内容
     res.setHeader('Content-Type', mime.lookup(filepath));
    ܈设置长 //
     res.setHeader('Content-Length', stat.size);
     // 设置为附件
     res.setHeader('Content-Disposition' 'attachment; filename="' +path.basename(filepath) + '"');
     res.writeHead(200);
     stream.pipe(res);
 });
```

响应json

```js
res.json = function (json) {
 res.setHeader('Content-Type', 'application/json');
 res.writeHead(200);
 res.end(JSON.stringify(json));
}; 
```

响应跳转

```js
res.redirect = function (url) {
 res.setHeader('Location', url);
 res.writeHead(302);
 res.end('Redirect to ' + url);
}; 
```

## 模板渲染

略

## Bigpipe