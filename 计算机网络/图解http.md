## TCP/IP协议族

把与互联网相关的协议集合起来总称为TCP/IP。也有说法认为，TCP/IP是指TCP和IP这两种协议。还有一种说法，TCP/IP是在IP协议的通讯过程中，使用到的协议族的统称。

## TCP/IP的分层管理

应用层决定了向用户提供应用服务时通信的活动。

传输层提供了网络连接中两台计算机之间的数据传输。

网络层处理流动的数据包，选择一条传输路线。

链路层处理网络硬件部分。

## IP、TCP、DNS

ip协议不是IP地址，它的作用是把各种数据包传送给对方。需要两个重要的条件：ip地址和mac地址。

tcp是可靠的传输协议，可靠是因为能准确传输并确认。基于三次握手。

dns协议，解析域名

# Http协议（无状态）

post、delete、put、get、option（没模拟成功，可以获取服务器所能支持的方法）、trace、connect

初始版本，每次http通讯后（请求结束），服务端就会发送finsh，来断开tcp连接。

1.1和部分1.0版本使用长连接：建立一次tcp连接后，就能进行多次请求和响应。减少了频繁建立和断开tcp的资源损耗。

**注意 **：服务端和客户端都需要配置，使其支持长连接。

管线化技术：使得不需要等待上一次请求响应后，才发起下一次请求。而是可以连续发起多个请求，再等待响应即可。

cookie解决无状态，不过不安全，因为cookie可以被伪造，而服务端不知道。由客户端记录状态

session不一样，session基于cookie实现，而且sessionId在服务端有存档，除非碰巧伪造正确，否则无法获取信息。由服务端记录状态。

# 第三章

Http报文有：请求报文和响应报文，大致可以分为报文首部和报文主体，使用空行（CR+LF）划分。

一般首部有4种，通过google可以看到：General、Request Headers、Response Headers和实体首部。

1. 传输数据时使用编码能提升传输速率。
2. 内容编码使实体保持原样压缩，并由客户端接收并解码。
3. 在传输大容量数据时，把数据分割多块，让浏览器逐步显示页面。把实体分块的功能称为分块传输编码。**http/1.1存在传输编码，但只定义于分块传输编码中。**
4. 发送邮件能添加多份不同类型的附件，使用为MIME机制，MIME扩展中会使用多部份对象集合（Multipart）的方法，来容纳不同类型的数据。HTTP协议也采纳了多部份对象集合，在Content-type：multipart/form-data ； multipart/byteranges。在boundary划分多部分对象集合指明的各类实体。每个部分类型都可以含有首部字段。
5. 实现断网继续下载，需要指定下载的实体范围。请求字段是：Range：bytes = 1001-10000。响应字段是：Content-Range：bytes 5001-10000/10000 。其他：`5001字节及之后：Range: bytes=5001- / 3000之前和5000到7000 Range: bytes=-3000, 5000-7000 ` 对于范围请求，响应206.如果是多重范围，响应字段标明multipart/byteranges，如果无法响应，返回200。
6. 内容协商：就对响应的资源内容进行干涉，然后提供给客户端最合适的资源。以请求报文中的某些字段为判断基准（Accept、Accept-Charset、Accept-Encoding、Accept-Language、Content-Language）

# 第四章 状态码

200：成功。

204：成功，但是没有返回内容。

206：成功，请求是范围请求，响应是Content-Range。

301：永久重定向。

302：临时重定向。后台redirect会出现。

303：请求资源存在另一个URI，应使用GET定向获取请求资源。

304：客户端发送附带条件（请求报文包含If-Match、if-modified-since、if-none-match、if-range、if-unmodified-since）的请求，服务端允许访问，但未满足条件。但和重定向无关。

307：临时重定向，但是不会将post变为get。

400：请求报文中存在语法错误。

401：该状态码表示发送的请求需要通过HTTP认证。返回401响应必须包含一个WWW-Authenticate首部用以质询用户信息

403：客户端的访问被服务器拒绝了。无访问权限是发送403的原因。

404：服务器上无该请求的资源。

500：服务端存在错误。

503：该状态码表明服务器暂时处于超负载或正在进行停机维护。最好写入RetryAfter首部字段再返回客户端。



# 第五章

## 代理

定义：接收客户端发送的请求后转发给服务器，不改变请求url。通过代理服务器转化请求或响应时，都会追加Via首部信息。

作用：缓存、针对特定网络的访问控制、获取访问日志。

这个代理服务器的缓存和浏览器的缓存有待深入。

## 网关

工作机制和代理相似，而网关能使通信线路上的服务器提供非http服务。能提高通讯安全。像用有资源的源服务器一样对请求进行处理。

## 隧道

建立一条通信线路，使用加密手段进行通信。确保通讯安全。本身不会去解析http请求，在通讯双方断开连接结束。



# 第六章 首部字段

首部字段分为：通用首部字段、请求首部字段、响应首部字段、实体首部字段。

通用首部字段是：请求和响应两方都会使用的首部。

可以分为两类：端到端（会转发到最终目标）、逐跳（单次转发有效）

逐跳只有：connection、keep-alive、proxy-authenticate、proxy-authorization、trailer、te、transfer-encoding、upgrade。

## 通用首部字段

### cache-control（控制缓存的行为）

服务器返回请求时添加头 Response.Headers["Cache-Control"] = "max-age=28800,must-revalidate";那么下次请求，客户端就会从本地缓存（内存或者磁盘）找。

响应public：其他用户也可以使用缓存。

响应private：对特定的用户的请求提供资源缓存去响应。

请求no-cache：强制向源服务器再次验证。

响应no-cache：缓存前必须先确认其有效性。

请求和响应no-store：不缓存请求或响应的任何内容

响应s-maxage：供多位用户使用的公共缓存服务器的时间，也就是说对于向同一用户重复返回响应的服务器来说，这个指令没有任何作用。（个人理解为这个值是全局的），当使用这个指令后，expires和max-age指令失效。

响应max-age：这个时间段内，针对这个缓存，服务器都不需要对资源进行有效性确认。

请求max-age：如果请求小于服务器的值（剩余时间），那么客户端可以接收缓存，如果为0，则转发给服务器。（http1.0和http1.1的版本对与expire和max-age不一样。）

请求min-fresh：如果缓存存在的时间比请求的值小，则返回缓存。

请求max-stale：如果未指定值，则缓存过期多久都可以响应。指定值，则缓存过期的时间不超过指定值，也能返回。

请求only-if-cached：要求缓存服务器返回缓存，不会去加载响应，也不会去确认有效性，如果缓存服务器无响应，则504

响应must-revalidate：可缓存，但必须再向服务器确认有效性。若无法确认，则504.（会忽略max-stale）

响应proxy-revalidate：要求缓存服务器必须再次验证缓存有效性。

请求和响应no-transform：缓存不能更改实体主体的类型，即不被压缩等类似操作。

### connection

1. 控制不再转发给代理的首部字段。案例：请求：Connection：upgrade 。 则中间服务器不会将upgrade字段转发给下一个服务器。
2. 管理长连接。案例：请求：Connection：Keep-Alive。则响应会是：Keep-Alive：timeout=xx，max=xx。指定长连接的过期时间。断开长连接：Connection:Close

### Date

表示报文的创建时间。

### Pragma

为了考虑兼容而定义的。

案例：如果中间服务器都是HTTP 1.1 那么使用Cache-Control：no-cache即可。但是可能中间服务器有些是其他版本，那么

```js
Cache-Control：no-cache 
Pragma：no-cache
```

### Trailer

说明了再报文主体后还记录了一些首部字段。（该首部字段可用在1.1版本分块传输编码）

一般请求报文：请求头、空行、请求体。 如果有Trailer，那么：请求头、空行、请求体、字段。

### Upgrade

用于检测服务器的http或者是其他协议是否可以使用更高的版本通讯。

```js
Upgrade:TLS/1.0 HTTP/1.1
Connection:Upgrade  //使Upgrade只在下一个服务器使用。
```

对于附有首部字段的Upgrade请求，服务器可使用101 Switching Protocols状态码作为响应。

### Via

使用首部字段Via追踪客户端和服务端之间的传输路径。即经过代理/网关时，会在Via字段上留下代理/网关服务器的信息。

如：客户端-》A-》B-》C-》服务器

则服务器接收到的报文的Via字段会是：Via：A，B，C的信息（也可多个Via字段）

客户端则是：Via：C，B，A。

### Warning

用于通知用户一些和缓存相关的警告信息。

## 请求首部

### Accept

指定用户能够处理的类型的相对优先级。可指定多个，然后使用q指定权重（0-1），默认是1，1也是权重最大的。

案例：Accept：text/html,application/xhtml+xml,application/xml;q=0.9

解释：指定了三种，而且application/xml的权重是0.9。

### Accept-Charset

指定能够支持的字符集的优先级。格式同上。

### Accept-Encoding

指定支持的编码的优先级。

### Accept-Language

指定自然语言集的相对优先级

### Authorization

先是客户端请求，然后服务端响应 401 Unauthorized，那么客户端再次请求时，会把Authorization带上认证信息去请求。

### Expect

通知服务器期望出现某种特定的行为。HTTP/1.1规范只定义了100-continue（状态码100 Continue）。

Expect：100-continue。 //等待服务器响应，且状态码100。

### From

告知服务器，（使用用户代理的）用户的电子邮件地址。一般使用代理时，尽可能包含From首部字段。

From： xx@xx.com

### Host（唯一一个必须包含在请求头的字段）

host指定要访问的主机名。请求发送到服务器时，url上的主机名被ip替换掉。这时候ip下有多个域名，不知道是请求哪个域名的请求，这时就看host指定的主机名。

### if-Match

服务器会比对if-Match的字段和资源的ETag值，当两者一致，才会执行请求。否则返回412。也可以使用星号指定if-Match字段。则服务器会忽略ETag，只要资源存在就处理。

### if-Modified-Since

服务器的资源如果在这个值后更新过，则返回资源。如果在这个值之后没有更新过，那么就报304.

### if-None-Match

如果值和请求资源的ETag值不一致，则处理请求。场景：不一致则处理获取最新的资源。

### if-Range

和rang配合使用

```js
//如果index.html文件的ETag是123456，那么就做范围请求处理。请求和响应如下
//请求
GET /index.html
if-Range:'123456'
Range:bytes=5001-10000

//响应
206 Paritial Content
Content-Range:bytes 5001-10000/1000
Content-Length:5000
```

如果不一致，那么忽略范文请求，并返回全部资源。

不使用if-Range，使用if-Match，那么需要发两次请求。具体看《图解http》110

```js
//解释：
使用if-Range 如果匹配则范围，不匹配则返回全部资源。
使用if-Match 如果不匹配则返回412 PreCondition Failed，目的是催促客户端再次发请求。则再次发起，服务器才会将全部资源返回。 所以用了两次请求。
```

### if-Unmodified-Since

和if-modified-Since相反。如果在值内未修改过，再处理。

### Max-Forwards

指定请求只能被转发的次数。

Max-Forwards：2 ，请求能被转发下下个服务器，然后就不能转发下去了。

### Proxy-Authorization

客户端和代理服务器之间的认证。和Authorization类似，不过这个是客户端和服务器之间的认证。

### Range

指定获取的部分资源。

Range：bytes=5001-10000

服务器会返回206 Paritial Content响应。无法处理则返回200 和全部资源。

### Referer

告诉服务器这个请求的原始URI

同时Referer正确拼写是Referrer，但一致沿用错误的拼写。

### TE

指定传输编码的优先级，和Accept-Encoding像。

可以指定伴随Trailer字段的分块传输编码的方式：TE：Trailers

### User-Agent

附上浏览器和用户代理名称等信息传达给服务器。

## 响应首部

### Accept-Ranges

告知客户端：服务器能否处理范围请求。

```js
Accept-Ranges:bytes //可以处理
Accept-Ranges:none //不能处理
```

### Age

```js
//缓存服务器响应，则表示这个缓存从向源服务器确认到现在过去的时长。
Age:100
```

### ETag

​	对服务器资源以字符串的形式做唯一标识，算是一个版本号。资源更新，ETag也会更新。

​	资源被缓存时，就会被分配唯一性标识。当访问中文版网址，有一份资源。访问英文版有一份资源。通过uri区分是不可能的。只有通过ETag。

强ETag：发生任何细微的变化都会改变其值。

弱ETag：用于提示资源是否相同，只有资源发生根本改变，才会改变。会在字段最开始附加W/

```
ETag:W/'usagi-1234'
```

### Location

客户端请求 / 地址 ，服务端redirect('/page/index')，那么在响应302 Found，响应报文头：

```
Location: /page/index
```

然后浏览器会强制性地尝试对重定向资源进行访问。

### Proxy-Authenticate

代理服务器所要求地认证信息发送给客户端。也就是访问一个代理服务器，它需要认证信息。那么响应401，同时报文就会有这个字段。

### Retry-After

告知客户端多久之后再发起请求。

可以是具体日期格式，也可以是响应后的秒数

### server

告知客户端，当前服务器上安装的HTTP服务器应用程序的信息。

```
Server:Apache/2.2.6(Unix) PHP/5.2.5
```

### Vary

服务器向缓存服务器响应：`Vary:Accept-Language`

那么当再要进行缓存，客户端请求缓存服务器时，缓存服务器只会对请求中含有相同Vary指定首部字段的请求返回。如果Vary指定的字段不同，必须从源服务器重新获取资源。

### WWW-Authenticate

```
WWW-Authenticate:Basic realm='Usagidesign Auth'
```

服务器告知客户端，客户端访问的URI的认证方案（Basic或者是Digest）和带参数提示的质询。

## 实体首部字段

### allow

```
Allow: GET,HEAD
```

当服务器收到不支持的http方法时，以状态码为405 Method Not Allowed作为响应返回。还将所有支持的http方法写入到首部字段allow中返回。

### Content-Encoding

服务器告知客户端，实体的主体部分选用的内容编码方式。

gzip、compress、deflate、identity

### Content-Language

实体主体使用的自然语言。

### Content-Length

https://www.cnblogs.com/nxlhero/p/11670942.html

表明实体主体部分的大小（单位是字节）

对实体进行内容编码传输时，不再使用Content-Length首部字段。

### Content-Location

和Location不同，它是用于访问资源的直接URL。

Location是重定向，而它是指示用于访问呢资源的直接URL，然后进一步内容协商。

Location是响应头，它是实体头部，会返回数据关联。

### Content-MD5

服务器将主体执行MD5获得128位二进制数，再用过Base64编码后将结果写入Content-MD5字段中。（首部无法记录二进制，所以要Base64编码处理）

因此客户端需要对报文主体再执行一次相同的操作。然后比对两次的值。即可判断报文主体的准确性。

这种方法无法判断是否被恶意篡改过。因为内容能被篡改，那么Content-MD5也可重新计算然后被篡改。

### Content-Range

返回响应的实体范围以及整体大小。

### Content-Type

实体主体内对象的媒体类型，字段值使用type/subtype

### Expires

指定缓存的超时时间。过期了，就会将请求转向源服务器请求资源。Cache-control的max-age指令的优先级大于Expires

### Last-Modified

最后一次修改的时间。

# 第七章 安全性

http缺点：明文、无法确定完整性，无法确定通讯方。

抓包工具：Packet Capture、Sniffer、Wireshark

https是建立了安全的通信线路，而不是将报文实体内容加密。

http =>tcp =>ip

http =>ssl =>tcp =>ip

## 密钥

共享密钥、公开密钥

共享密钥是两方持有同一把密钥进行加密解密。

公开密钥是每人都有公开密钥和私有密钥。用别人的公开密钥加密，再传输给别人，别人再用自己的私钥解密。

总结：公开密钥加密与共享密钥加密相比，其处理速度要慢。但是更安全。如果能够使得密钥安全传输，那么可以使用共享密钥处理。

**因此：混合加密机制：使用公开密钥使得双方确定后续传输使用的共享密钥后，使用共享密钥传输。这也是https采用的机制。 **

## 确定通讯方

当我们准备访问服务器时，如何知晓这个服务器就是可信赖的。

世界上存在一些权威机构，是可信的。用于数字证书认证的。服务器使用者需要提出申请证书，然后这些机构会分配一个证书，证书证明了服务器者的身份和公开密钥。当客户端访问服务器时，服务器会将这个证书响应给客户端，客户端就能通过这个证书知晓这个网站是可靠的。而浏览器会事先在内部植入常用认证机关的公开密钥。所以浏览器会帮我们识别。

**https在第一次通讯时，服务器就会将自己的证书发送给客户端，以表明自己是可信赖的。 **

## https通讯

第一阶段：

客户端访问443，发送自己能支持的tls版本、加密组件（生成共享密钥的算法、密钥长度），随机数a。

服务器响应，自己的证书、在客户端发送的加密组件选择一套，随机数b。

客户端确认证书，同时第一阶段结束。

第二阶段：

客户端使用证书的密钥发送，随机数c。客户端可以通过算法得出协商密钥。而服务端收到报文后也可以计算出协商密钥。因此两者通过协商密钥进行通信。

中间还有一段是客户端基于一些信息发送给服务端，服务端能解密出来，那才算真正结束。

https使得网络负载变慢2-100倍。

# 第八章 确认用户访问的身份

## basic认证

request

response：WWW-Authenticate：Basic realm="xxxx"

request：Authorization:Basic Z3Vlc3Q6Z3Vlc3Q

响应表示使用basic认证，请求，是将用户id和密码以冒号连接，并通过Base64位编码处理。

BASIC没有采用加密（明文密码），容易被窃取，同时无法实现认证注销操作。因此不常用。

## digest认证（不懂）

质询响应方式，客户端发送认证要求给服务器，服务器响应质询码。客户端计算生成响应码，再将响应码发送过去。

## ssl客户端认证

# 第九章 追加协议

http瓶颈：

1. 一条连接只能发送一个请求。
2. 请求只能从客户端开始，客户端不可以接收除响应外的指令。
3. 请求和响应首部未压缩就发送，信息越多延迟越大。
4. 发送冗长的首部。

## comet技术

可以做到推送功能。服务器接收请求，不会立即响应，而是先挂起，等服务器有内容更新再响应。这样连接的持续变长，维持连接小号更多的资源。

## SPDY协议

在tcp/ip的应用层和传输层通过新加会话层。但还是采用http建立连接。

做到多路复用：一条tcp处理多个http请求。

赋予请求优先级。

压缩http首部。

推松功能。

服务器提示功能。

## WebSocket协议

使服务器和浏览器建立全双工通信。不再使用http数据帧

请求：

Upgrade:websocket 

Connection:websocket

Sec-WebSocket-key、Sec-WebSocket-Protocol、Sec-WebSocket-Version

响应：

Upgrade:websocket 

Connection:websocket

Sec-WebSocket-Accept、Sec-WebSocket-Protocol