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

使用#

## 配置项的单位

大模块遵循一些通用的规定，如空间不用每次定义到字节，时间不用精确到毫秒。

- 空间：K或者k （KB）  
- 时间：ms,s,m,h,d,w,M,y （毫秒，秒，分，时，天，周7天，月30天，年365天）

是否可以用这些单位，取决于解析该配置项的模块。只有这个模块使用了nginx框架提供的相应解析配置项方法，配置项值才可以携带这些单位。

## 配置项中使用变量

需要加上 $ 如：$remote_addr

![image-20210604173503967](D:\note\nginx\images\image-20210604173503967.png)

# nginx服务的基本配置

nginx在运行时，至少必须加载几个核心模块和事件类模块，这些模块运行时所支持的配置项称为基本配置——其他模块执行都依赖的配置项。

分为四类：

- 用于调试、定位的
- 正常运行必备的
- 优化性能的
- 事件类配置

有一些即使没有显式配置，也会有默认值，如daemon，即使在nginx.conf没有进行配置，也相当于打开了这个功能。

## 调试进程和定位问题

- 是否以守护进程方式运行 ： daemon on|off ; ，默认 daemon on;
- 是否以master/worker方式工作： master_process on|off;  默认  master_process on;
- error日志设置： error_log pathfile level; 默认 error_log logs/error.log error;

如果 pathfile为/dev/null ，就不会输出任何日志，这也是关闭error的唯一手段。 也可以为 stderr，这样会输出到标准错误文件中。

level 范围： debug、info、notice、warn、error、crit、alert、emerg。 当设定为某个级别时，大于或等于该级别的日志才会输出到指定文件。

如果设置到debug，必须在configure时加入 ： --with-debug，配置项。

- 指定客户端输出debug级别日志：  debug_connection <ip|cidr>;

```shell
events {
	debug_connection 10.224.66.14;
	debug_connection 10.224.57.0/24;
}
```

该配置实际是事件类配置，不过用户定位问题，这样，以上ip地址会输出debug级别日志，其他请求沿用error_log配置的日志级别。

如果设置到debug_connection，必须在configure时加入 ： --with-debug，配置项。

- 限制coredump核心转储文件大小： worker_rlimit_core size;

nginx进程出现非法操作（内存越界）导致直接被操作系统强制结束，会生成核心转储core文件，从中可以获取当时堆栈、寄存器信息。但是有很多其他信息，如果不限制，几次后就会占满磁盘。

- 指定coredump文件生成目录： working_directory path;

worker进程的工作目录，防止coredump文件放置目录

## 正常运行的配置项

- 定义环境变量 ：  env  xx=xx;

让用户直接设置操作系统上的环境变量

- 嵌入其他配置文件： include pathfile;

将其他配置文件嵌入到nginx.conf文件，参数可以是相对或绝对。可以包含通配符*，同时一次嵌入多个配置文件。

```shell
include mime.types
include vhost/*.conf
```

- pid路径 ： pid path/file;  默认：pid logs/nginx.pid;

保存master进程id的pid文件存放路径。默认与configure执行时的参数 --pid-path一致，该文件直接影响nginx是否可以运行。

- nginx worker进程运行的用户及用户组。user username [groupname]; 默认 user nobody nobody;

用于设置master进程启动后，fork出的worker进程运行在哪个用户和用户组下。当按照 user username; 设置，用户组和用户名相同

在configure执行时使用 --user=username  和--group=groupname，则nginx.confg使用参数指定的。

- nginx worker 进程可以打开的最大句柄描述符个数。 worker_rlimit_nofile limit;
- 限制信号队列 。 worker_rlimit_sigpending limit;

设置每个用户发往nginx信号队列的大小。当某个用户的信号队列满了，该用户再发送的信号量会被丢掉。

## 优化性能的配置项

- nginx worker进程个数。 worker_processes number; 默认： worker_processes 1;
- 绑定 worker进程到指定的cpu内核：worker_cpu_affinity cpumask [cpumask...];

liunx是抢占式的，如果多个worker都在抢一个cpu，就会出现同步问题。如果每个worker进程独享一个cpu，在内核调度策略上实现完全的并发。

```shell
worker_processes 4;
worker_cpu_affinity 1000 0100 0010 0001;
```

linux通过sched_setaffinity()调用实现该功能。

- ssl硬件加速：ssl_engine device;

如果服务器上有ssl硬件加速设备，则可以配置以加快ssl协议的处理速度。通过`openssl engine -t`查看是否有ssl硬件加速设备。

- 系统调用gettimeofday的执行频率：timer_resolution t;

更新时间的频率，早期比较耗时，现在代价不大。如果期望日志时间更准确，可以使用。 

- nginx worker 进程优先级设置： worker_priority nice; 默认：worker_priority 0;

操作系统上有很多进程，都处于可执行状态，将按照优先级来决定内核选择哪一个进程。（默认，最小时间片只有5ms，最大有800ms）。优先级由 静态优先级+进程执行情况动态调整（上下5ms的调整）。

取值范围由 -20~19. -20最高 ，+19最低。可以把值调小，以保证获得更多资源。但不建议比内核进程小（-5）

## 事件类配置项

- 是否打开accept锁：accept_mutex <on|off> 默认 accept_mutext on;

用于nginx 负载均衡的，第9章讲，可以让多个worker进程轮流与新客户端建立tcp连接。当一个worker进程建立的数量达到worker_connections配置的最大连接的 7/8时，会大大减少该worker进程试图建立新tcp连接的机会，以保证所有worker进程维持的连接数接近。

默认打开，关闭会使建立tcp连接耗时更短，但不建议。

- lock文件的路径：lock_file path/file; 默认：lock_file logs/nginx.lock;

accept锁可能需要这个lock文件，如果accept锁关闭，一定不需要用到该文件，如果开启了accept锁，又因为编译程序、操作系统架构等原因导致nginx比支持原子锁，这时才会通过文件锁实现accept锁，该文件才会生效。

- accept锁后到真正建立连接之间的延迟时间：accept_mutex_delay Nms; 默认：accept_mutex_delay 500ms;

同一时间只有一个worker进程能够获取到accept锁，accept不是阻塞锁，如果取不到会立刻返回。如果有一个worker进程试图获取accept而没取到，至少要accept_mutex_delay定义的时间间隔才能再次试图获取锁。

- 批量建立新连接：multi_accept [on|off]; 默认：multi_accept off;

当事件模型通知有新连接时，尽可能对本次调度中客户端发起的所有tcp请求都建立连接。

- 选择事件模型： use[kqueue|rtsig|epoll|/dev/poll|select|poll|eventport]；默认 nginx自动选择。

linux操作系统可供选择有三种（poll、select、epoll），epoll性能最高，9.6节讲。

- 每个worker的最大连接数： worker_connections number;

# 用http核心模块配置静态web服务器





