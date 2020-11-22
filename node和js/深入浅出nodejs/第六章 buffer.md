node需要处理网络协议、操作数据库、处理图片和接收上传文件等，在网络流和文件操作中，要处理大量二进制数据，javascript的字符串无法满足需求，因此buffer对象应运而生。

用来专门存放二进制数据的缓存区。

# Buffer对象

buffer 存放的是16进制，也就是一个1个字节（8位） =》2个（16进制数）

![image-20201122201937078](E:\0git_note\node和js\深入浅出nodejs\image\image-20201122201937078.png)

以上，是6个字节。

buffer.length 也是 ，以上的buffer的长度是6，每个元素是0-255

如果存放大于或小于该范围：  

- 存-1，则加256，即存255。
- 存259，则减256，即存3。

# Buffer内存分配

采用slab分配机制。slab就是一块申请好的固定大小（8KB）的内存区域。有三种状态。

- full：完全分配

- partial：部分分配

- empty：没有被分配

如果要分配的buffer，小于或等于8kb，则认为是小对象，大于则认为是大对象。

如果buffer需要的大小，slab剩余无法满足它，那么会新建一个slab去为这个buffer分配。

一个slab可以被多个buffer占用。因此如果有某个buffer没被释放，那么这个slab就无法被回收。

# Buffer的转换

只支持：

- ASCII
- UTF-8
- UTF-16LE/UCS-2
- Base64
- Binary
- Hex

字符串转buffer： 

new Buffer("xxx",【encoding】) 不传encoding，默认utf-8。

以上为：根据encoding编码，将xxx字符转为字节存储在buffer中。

buf.write(string,[offset],[length],[encoding]) ，先buffer的指定位置存放数据。

buffer转字符串：

buf.toString([encoding],[start],[end])

# Buffer拼接

buffer+buffer 为：buffer.toString() +buffer.toString()

因此不能直接buffer相加。

网络通讯时，接收数据时会产生乱码。很大原因是

- 输入使用的编码和输出使用的编码不一致
- 编码一致，但是分段转码（utf-8 ，1个字符三个字节，但是传输时分段，假设7个7个传。先传7个，接收方收到这个7个字节后，转码时能转出两个中文和一个乱码，因为一个字节不满足）。例子：fs.createReadStream('xx',{highWaterMark:7})

解决：

1. 读取流时，使用

const rs=fs.createReadStream('xx',{highWaterMark:7});

rs.setEncoding('urf-8')

这时候内部的decoder对象，知道编码是utf-8，那么每次读取7个字节，会将前6个字节转为字符，然后传给接收方，而剩下一个字节存起来，等下次读取。

它目前只能处理utf-8，base64和ucs-2/utf-16le

2. 接收时使用一个数组接收，等全部接收完成（end事件），再将数组concat成一个完整的buffer，再转。

![image-20201122203501747](E:\0git_note\node和js\深入浅出nodejs\image\image-20201122203501747.png)

# Buffer与性能

- 提前转buffer

  网络传输，都需要转换成buffer，以进行二进制数据传输。我们提前res.end(buffer)，而无序响应时再进行转换，可以提高性能。

- highWaterMark（字节为单位）。createReadStream：在内存准备一段buffer，然后通过fs.read读取时逐步从磁盘将字节复制到buffer中。完成一次读取时，就将buffer中通过slice方法去除部分数据，通过data事件传递给调用方。每次读取的长度就是用户指定的highWaterMark。
  - highWaterMark堆buffer内存分配和使用有影响
  - highWaterMark过小，导致系统调用次数过多。