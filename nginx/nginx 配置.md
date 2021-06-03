# nginx进程间的关系

worker和master的关系。

worker尽量和cpu数量一致。（最好每一个worker进程都绑定特定的cpu核心），进程间特换代价最小。

# nginx配置的通用语法

## 块配置项

由块配置项名和一对大括号组成。

![image-20210603202819192](D:\note\nginx\images\image-20210603202819192.png)![image-20210603202852819](D:\note\nginx\images\image-20210603202852819.png)

- 上面代码段中events、http、server、location、upstream 都是块配置项，至于后面是否要加参数，如： backend ，、webstatic ，这取决于解析这个块配置项的模块，不能一概而论。

- 块配置项可以嵌套，内层直接继承外层块。server块的任意配置都是基于http块里已有的配置。如果冲突，取决于解析这个配置项的模块。如location和http块的gzip冲突，这时，在处理/webstatic模块时，gzip是按照gzip off处理请求的。

## 配置项语法格式

- 配置项名 必须是nginx某个模块想要处理的，否则会认为配置文件出现了非法的配置项名。

- 配置项名 输入后，必须以空格作为分隔符。

- 配置项值，可以是数字或字符串或正则，可以有一个值或多个值，值之间也用空格符分隔。

- 每行配置的结尾要加上分号
- 配置项值中有语法符号：空格，那么需要用单引号或双引号括住。

如下：

`log_format main '$remote_addr - $remote_user [$time_local] "$request" '`

## 配置项注释

