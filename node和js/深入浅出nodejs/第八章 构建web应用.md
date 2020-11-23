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

cookie在req.headers.cookie （第三方cookie）