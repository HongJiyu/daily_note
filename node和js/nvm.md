要用nvm来控制版本，那么就得通过nvm来安装，否则只能下载多个node，然后切换得去环境变量改。

nvm 安装：

 nvm list available  //查看最近的一些版本

nvm install <version> //指定安装版本

安装后会发现成功，但是npm有问题。

https://www.cnblogs.com/jaxu/archive/2020/10/30/13904018.html

解决：

nvm root 查看nvm的目录，找到对应版本，看看，node_modules下是不是有npm。

没有就得去官网下载，https://nodejs.org/download/release/

然后将下载下来的，取npm放到nvm下载的版本的node_modules下。