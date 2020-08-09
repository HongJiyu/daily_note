http长连接，前提是客户端和服务端都支持长连接。这个维持长连接是：tcp连接。
好处：不需要频繁三次握手和四次挥手。建立的tcp连接，后续的每个http请求（该页面的静态资源等）都走这个连接。
Connection:keep-alive。 如果指定时间keep-alive:timeout=xx,max=xx 。如果断开连接Connection:Close

```js
In HTTP/1.0, the server closes the TCP connection after delivering the response by default (Connection: Close). That is, each TCP connection services only one request. This is not efficiency as many HTML pages contain hyperlinks (via <a href="url"> tag) to other resources (such as images, scripts – either locally or from a remote server). If you download a page containing 5 inline images, the browser has to establish TCP connection 6 times to the same server.

The client can negotiate with the server and ask the server not to close the connection after delivering the response, so that another request can be sent through the same connection. This is known as persistent connection (or keep-alive connection). Persistent connections greatly enhance the efficiency of the network. For HTTP/1.0, the default connection is non-persistent. To ask for persistent connection, the client must include a request header "Connection: Keep-alive" in the request message to negotiate with the server.

For HTTP/1.1, the default connection is persistent. The client do not have to sent the "Connection: Keep-alive" header. Instead, the client may wish to send the header "Connection: Close" to ask the server to close the connection after delivering the response.

Persistent connection is extremely useful for web pages with many small inline images and other associated data, as all these can be downloaded using the same connection. The benefits for persistent connection are:

CPU time and resource saving in opening and closing TCP connection in client, proxy, gateways, and the origin server.
Request can be "pipelined". That is, a client can make several requests without waiting for each response, so as to use the network more efficiently.
Faster response as no time needed to perform TCP’s connection opening handshaking.
```

