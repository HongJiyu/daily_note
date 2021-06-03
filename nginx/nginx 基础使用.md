# linux操作系统要求

需要linux2.6及以上内核支持epoll，因为仅靠select或poll无法解决高并发压力问题。

uname -a

# 使用nginx必备软件

以下四个为完成web服务器最基本功能所必须。

- GCC，用来编译C语言程序 `yum install -g gcc`

G++编译器，编译C++， `yum install -y gcc-c++`

- PCRE ，perl兼容正则表达式，如果nginx.confg使用正则表达式，则需要把它编译进nginx，因为nginx的http模块要靠它来解析正则表达式。如果确定不会使用到正则，则可以不安装

`yum install -y pcre pcre-devel`pcre-devel是PCRE做二次开发所需的开发库。

- zlib库

zlib库对http包的内容做gzip格式压缩，如果再nginx.conf配置 gzip on 并指定对于某些类型（content-type）的http响应使用gzip来进行压缩减少网络传输量，编译时则必须将zlib编译进nginx。

`yum install -y zlib zlib-devel`

- OpenSSL开发库

如果需要再SSL协议上传输http，或者是使用md5、sha1等散列函数，也需要安装它

`yum install -y openssl openssl-devel`

# 磁盘目录

- nginx源代码存放目录：存放官网下载的nginx源码文件、第三方或我们呢自己写的模块源代码文件。
- nginx编译阶段所产生的中间文件存放目录：存放configure命令执行后所生产的源文件及目录和make执行后生成的目标文件和最终连接成功的二进制文件。默认：configure命名该文件为objs，且在nginx源代码目录下。
- 部署目录：nginx运行期间所需的二进制文件、配置文件，默认为/usr/local/nginx
- 日志文件存放目录

# linux内核参数优化

nginx使用场景不同，可以调整内核参数来适应不同的情况。针对通用、支持更多并发请求的tcp网络参数：

/etc/sysctl.conf 更改内核参数

![image-20210602165704247](D:\note\nginx\images\image-20210602165704247.png)

![image-20210602173227830](D:\note\nginx\images\image-20210602173227830.png)

- file-max：一个进程可以同时打开最大的句柄数，该参数直接限制了最大并发连接数。
- tcp_tw_reuse：设置为1表示将time-wait状态的socket重新用于TCP连接。
- tcp_keepalive_time：表示keepalive启用时，tcp发送keepalive消息的频率，设置更小可以更早清理无效连接。
- tcp_fin_timeout：表示当服务器主动关闭连接时，socket保持在FIN-WAIT-2状态的最大时间。
- tcp_max_tw_buckets：表示操作系统允许time_wait套接字数量的最大值，超过则立即清除并打印警告信息，默认为180000，过多会使web服务器变慢。
- tcp_max_syn_backlog：表示三次握手阶段接收syn请求队列的最大长度，默认1024，设置大，防止出现丢失客户端发起的连接请求。
- ip_local_port_range：定义了udp和tcp连接中本地端口的取值范围。（不包括连接远端）
- net.ipv4.tcp_wmem：这个参数定义了TCP发送缓存（tcp发送滑动窗口）的最小值、默认值、最大值。
- net.ipv4.tcp_rmem：这个参数定义了TCP接受缓存（tcp发送滑动窗口）的最小值、默认值、最大值。
- netdev_max_backlog：当网卡接收数据包的速度大于内核处理的速度时，会有一个队列保存这些数据包。这个参数表示该队列的最大值。
- rmen_default：表示内核套接字接收缓存区默认的大小。
- wmem_default：表示内核套接字发送缓存区默认的大小。
- rmen_max：表示内核套接字接收缓存区最大的大小。
- wmem_max：表示内核套接字发送缓存区最大的大小。
- tcp_syncookies：与性能无关，用于解决tcp的syn攻击。

![image-20210602173136374](D:\note\nginx\images\image-20210602173136374.png)

# 获取nginx源码并编译安装

http://nginx.org/en/download.html 下载并放置到准备好的源代码目录中，然后解压

`tar -zxvf xxx`

![image-20210602173833337](D:\note\nginx\images\image-20210602173833337.png)

# configure详解

允许的参数分为4大类。

- 路径相关参数
- 编译相关参数
- 依赖软件相关参数
- 模块相关参数
- 其他参数

具体看P34

# configure执行流程

略

# configure 生成的文件

configure执行成功会生成objs目录，并在该目录下产生以下目录和文件。

![image-20210602174720421](D:\note\nginx\images\image-20210602174720421.png)

- src：用于存放编译时产生的目标文件
- Makefile：用于编译nginx工程以及加入install参数后安装nginx。
- autoconf.err：保存configure执行过程中产生的结果
- ngx_auto_headers.h和ngx_auto_config.h：保存了一些宏，会被src/core/ngx_config.h及src/os/unix/ngx_linu
- ngx_modules.c ：是一个关键文件。用来定义ngx_modules数组的。决定了每个模块在nginx中的优先级，当一个请求同时符合处理规则时。。。模块顺序非常重要，不正确的顺序会导致nginx无法工作。

# nginx命令控制

控制nginx服务的启动与停止，重载配置文件、回滚日志文件、平滑升级。

默认安装在 /usr/local/nginx 

二进制文件路径：/usr/local/nginx/sbin/nginx

配置文件路径： /usr/local/nginx/conf/nginx.conf

以上路径都可在configure阶段通过参数配置

## 启动

1. 直接执行nginx二进制程序

/usr/local/nginx/sbin/nginx

读取默认路径下的配置文件： /usr/local/nginx/conf/nginx.conf

没有显示指定时，将打开configure命令执行时的--config-path=Path  指定的nginx.config文件

2. 指定配置文件的启动方式

/usr/local/nginx/sbin/nginx -c tmp.conf

3. 指定安装目录的启动方式

/url/local/nginx/sbin/nginx -p /usr/local/nginx/

4. 指定全局配置项的启动方式（略）

/usr/local/nginx/sbin/nginx -g "pid varnginx/test.pid"

## 检查配置信息

/usr/local/nginx/sbin/nginx -t

可以不把error级别以下的信息输出

/usr/local/nginx/sbin/nginx -t -q

## 显示版本信息

/usr/loca/nginx/sbin/nginx -v

## 显示编译阶段的参数

显示GCC编译器版本、操作系统版本、执行configure时的参数

/usr/local/nginx/sbin/nginx -V

## 快速停止服务

/usr/local/nginx/sbin/nginx -s stop

强制停止nginx ，-s nginx程序向nginx服务发送信号量，nginx程序通过nginx.pid文件找到master进行的id，再向运行中的master进程发送term信号快速关闭nginx。

因此同理，可以通过`ps -ef|grep nginx `找到进程id

然后向该进程发送term信号：`kill -s SIGTERM <master pid>` 或`kill -s SIGINT <master pid>`

## 优雅停止服务

/usr/local/nginx/sbin/nginx -s quit

或 ：`kill -s SIGQUIT <master pid>`

优雅地停止worker进行

`kill -s SIGWINCH <worker pid>`

## 配置生效

/usr/local/nginx/sbin/nginx -s reload

或： `kill -s SIGHUP <master pid>`

事实上，nginx会先检查配置是否有误，无误则优雅关闭，再重启nginx。

## 日志回滚

场景：把当前日志文件改名或转移，使得重新生成一份日志文件，使得日志文件不至于过大。

/usr/local/ngin/sbin/nginx -s open

或： `kill -s SIGUSR1 <nginx master pid>`

## 平滑升级nginx

- 向旧版本地nginx发送USR2信号，`kill -s SIGUSR2 <master pid>` ，这时nginx会将pid重命名，/usr/local/nginx/logs/nginx.pid 重命名为 /usr/local/nginx/logs/nginx.pid.oldbin 这样新的nginx才有可能启动成功
- 启动新版本的nginx，可以发现新旧版本的nginx同时运行。
- 通过kill命令向旧版本的master发送SIGQUIT信号，以优雅的方式关闭旧版本的nginx。

