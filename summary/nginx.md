# 反向代理

upstream + proxy_pass

```shell
 http {
  upstream daili {
 	server 121.36.15.201:7001;
 	server 121.36.15.204:7002;
 }
 server {
 	server_name 域名;
 	location / {
 		proxy_pass http://daili;
 	}
 }
 
 }

```

## 负载

https://www.cnblogs.com/diantong/p/11208508.html

默认轮询

权重weight

iphash

urlhash

参数hash 

## ip问题

在某台nginx上，  它的 `$remote_addr` ：上一台机器的ip地址，可以是上一台代理，可以是客户端。

`$x-forward-for` ：包含之前的机器的所有`ip`，比如   a =》 b =》c =》d ，在d（`nginx`）上获取到的就是a 和b的`ip`，而c的`ip`通过`$remote_addr`获取。

正常一台代理，需要重新设置头部信息，以便于下一台机器能够获取到正确的`ip`

```shell
	location / {
		proxy_set_header   X-Real-IP        $remote_addr;
        proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
		......
    }
```

$proxy_add_x_forwarded_for ： 表示将当前的`nginx` 的 `x-forward-for` 拼接上 `$remote_addr` ，以便下一台`nginx`能够获取到准确的 `$x-forward-for`

因为`$remote_addr`是从`tcp`包中获取的，所以不可能被造假，它指向上一台机器的ip。

`x-real-ip`，在这里设置的原因只有这种模式： 客户端=》nginx代理=》web服务，而nginx代理这么设置，告诉web服务端，用户的ip就是x-real-ip。

如果是多台代理，如 客户端=》nginx代理1=》nginx代理2 =》 web服务 ，那么只能通过x-forward-for获取用户ip地址，因为web服务收到的 `$remote_addr` 是代理2的ip，就算代理2设置x-real-ip，那也知识代理1的ip。 而且要充分校验x-forward-for的值，因为会被伪造。

## location

用于对url进行匹配，以便根据接口进行不同的代理。

https://www.cnblogs.com/jpfss/p/10232980.html
