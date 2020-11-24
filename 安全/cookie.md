简单知识不讲。

# cookie分类

cookie 分第一方和第三方。

第一方：属于当前访问地址栏上（域名）的cookie，则属于第一方。

第三方：该页面上，属于其他域名的cookie，则归为第三方。

例如：访问www.baida.com，在www.baida.com下的cookie属于第一方。www.baida.com页面存在访问其他地址：www.js.com / www.cs.com 等，属于其他域名的cookie归为第三方。

# cookie危害

第三方的危害：csrf （cross sit request forgery）

```
   1. 用户打开浏览器，访问受信任银行网站，输入用户名和密码请求登录网站；
   2.在用户信息通过验证后，银行网站产生Cookie信息并返回给浏览器，此时用户登录网站成功，可以正常发送请求到网站；
   3. 用户未退出银行网站之前，在同一浏览器中，打开一个TAB页访问其他网站B
   4. 这时候网站B 已被黑客注入诱导信息，加入是一张图片,图片地址指向
     src=”http://bank.example/withdraw?account=bob&amount=1000000&for=黑客
     点击之后转账给黑客这个账户
   5. 浏览器在接收到这些攻击性代码请求后，根据网站B的请求，在用户不知情的情况下携带Cookie信息，根据用户的Cookie信息以C的权限处理该请求，导致来自黑客请求恶意代码被执行。 
```

因为访问网站b，但是网站b下有银行的地址，这个银行地址有cookie（银行通过这个cookie标识是哪个用户），这个cookie属于第三方cookie。而造成的危害，也是第三方cookie造成的。

# sameSite解决

http://www.ruanyifeng.com/blog/2019/09/cookie-samesite.html

# SpringBoot的sameSite

默认是strict。因此如果前后端分离，不同的域名，那么在前端页面域名A，访问后端域名B，这时候B所属的cookie是第三方cookie，在strict下，不会将B的cookie传递给B。

# 第三方cookie的其他作用

某个广告平台A需要把广告投放给喜欢旅游并喜欢篮球的群体。

那么它和旅游网站B与篮球网站C合作并把它的跟踪代码加入到这两个网站的页面中。

当用户访问这个广告平台的众多网站之一时，跟踪代码会**生成一个唯一的标识符并以第三方Cookie的形式存储到浏览器**。

当用户来到旅游网站B时，跟踪代码会读取广告平台的一个1×1的gif，并通过请求时HTTP头部的Cookie字段或者gif后的参数把唯一的标识符传递回广告平台A，同样当访问篮球后广告平台一样也会知道用户的访问事件。

那么当用户访问广告平台的网站D时，针对D页面上的广告位，D会先通知A该用户的唯一标识符，A判断用户的访问历史后确认访问过B和C，则会对该用户进行精准广告投放。