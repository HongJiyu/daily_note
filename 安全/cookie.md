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

## 投放广告

1. 了解用户的兴趣爱好（浏览网站）
2. 访问旗下网站时，进行广告的精准投放。
例子：篮球和旅游，接入抖音，希望抖音能播放自己的广告，给浏览过自己网站的人。
原理：抖音用户访问过篮球、旅游等网站（抖音作为第三方cookie），然后等用户访问到抖音时，抖音再将用户（cookie）感兴趣的信息展示出来。


那么抖音和旅游网站B与篮球网站C合作并把抖音的跟踪代码加入到这两个网站的页面中。

当用户来到旅游网站B时，跟踪代码会读取抖音的一个1×1的gif，并通过请求时HTTP头部的Cookie字段或者gif后的参数把唯一的标识符传递回抖音，同样当访问篮球后抖音样也会知道用户的访问事件。（这里抖音的cookie作为第三方cookie）

那么当用户访问抖音时（这里的抖音的cookie作为第一方），针对页面上的广告位，抖音已知浏览器存放的cookie，则会对该用户进行精准广告投放。