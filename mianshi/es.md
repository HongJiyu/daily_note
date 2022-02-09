# dylog的搜索

精确搜索：match_phrase

实现：搜索内容分词，需要所有词都存在、顺序必须一致、必须连续。

```js
内容：中国科学院研究所   分词： 中国 科学院 研究所
搜索：中国研究院        分词：中国 研究院
```

无法匹配，虽然所有词都在，且顺序一致，但是不是连续的。



模糊搜索：query_string

实现：搜索内容分词，只要某个词存在，且不需要保证顺序。

## 总结：

https://blog.csdn.net/jingyoushui/article/details/100737169

![image-20220209224405756](E:\dailynote\mianshi\images\image-20220209224405756.png)



- match和query_string的区别

https://blog.csdn.net/feinifi/article/details/100512058

query_string不需要指定查询字段，会在所有字段中搜索

