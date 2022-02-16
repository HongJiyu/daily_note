# 基础知识和机构

看wps的内容

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

![image-20220209224405756](images\image-20220209224405756.png)



- match和query_string的区别

https://blog.csdn.net/feinifi/article/details/100512058

query_string不需要指定查询字段，会在所有字段中搜索

# api

match

```js
 "query": {
    "match": {
      "tip": "he goes to school"
    }
  }
```

term

```js
 "query": {
    "term": {
      "name": "xiao"
    }
  }
```

terms

```js
{
    "terms":{
        "fieldName":["value","value"]
    }
}
```

multi_match （todo，type的各种类型及算分）

```js
{
  "query": {
    "multi_match" : {
      "query":      "brown fox",
      "type":       "best_fields",
      "fields":     [ "subject", "message" ],
      "tie_breaker": 0.3
    }
  }
}
```

# 聚合

## cardinaly

https://www.elastic.co/guide/en/elasticsearch/reference/5.6/search-aggregations-metrics-cardinality-aggregation.html

```js
POST /sales/_search?size=0
{
    "aggs" : {
        "type_count" : {
            "cardinality" : {
                "field" : "type",
                "precision_threshold": 100 
            }
        }
    }
}
```

该聚合是个模糊值，使用`precision_threshold`越大则会分配更多的内存来计算这个唯一值。最大是40000，默认是3000，

![image-20220216224218583](images\image-20220216224218583.png)

如图，设置为10000，就算是1*10的7次方都是精确的。

## shard size

https://www.elastic.co/guide/en/elasticsearch/reference/5.6/search-aggregations-bucket-terms-aggregation.html

```js
{
    "aggs" : {
        "products" : {
            "terms" : {
                "field" : "product",
                "size" : 5
            }
        }
    }
}
```

聚合时，没有使用size，则默认是10

使用聚合桶时，如果size为5，那么协调节点会从每个分片获取聚合后前5的数据，并返回给协调节点，协调节点再根据返回的数据组合排序后取前5，这样会导致返回给客户端的5个桶的doc_count可能存在误差，因为doc_count是每个分片的前5的数据汇总，而非所有分片。

比如：第一个分片前5个是 (a b c d e ) f ，而第二个分片前五个是 (b c d e f) g a，这时候每个分片都会只取前5个到协调节点，就会出现第一个分片的f ，第二个分片的a都没算进去，因此最总的聚合结果的`doc_count`不准确。

解决：多一个`shard size`，且默认`shar size=（1.5*size+10）`，这样分片就会多取数据给协调节点，而协调节点计算完，再只取前5给客户端。

# 分页

- from [offset  size] 分页，会有限制，最多 offset+size = 10000，默认就使用该语法进行查询。允许跳页、页数不多的情况可以使用这个。

对于日志查询，也可以使用，因此日志查询基本是通过筛选条件后，用户一般再翻滚几百条记录就够了。

- scroll  用于大数据量迁移或者大数据量下载。

生成一份类似快照，第一次查返回一个scroll id，后续每次都带上scroll id进行查询。不支持实时，不支持跳页。

- search after 可用于深度分页，但不支持跳页。使用场景不多。

支持实时查询，需要先排序，按照时间+`_uid`进行排序，`_uid`是文档id，为了保证排序顺序。

# 分数

search_type.

问题：

1. 查询时指定from 100，10。如果有10个分片，而且第一个分片的数据刚好能够满足需求，但是仍旧需要从其他9个分片分别取110个文档，然后在协调节点整理排序所有文档，后返回给客户端10条数据。
2. 每个分片都是独立的，文档的算分是在分片上计算的，因此通过TF/IDF算法，如果某个分片文档数量过少时，会导致该分片的查询词的idf在该分片上很小。进而导致该分片的算分普遍较高。这样一对比，算分不精确。

解决问题1： query_then_fetch（**默认查询类型**）：协调节点先向所有相关的分片发起请求，分片**只返回排序列表所需的数据（一般是分数）**。协调节点整理后找到100-110条数据所在的分片，并只向相关的分片查询对应的文档信息。

解决问题2：dfs_query_then_fetch：在query_then_fetch的第一阶段会去查询所有分片的文档词频来达到更准确的评分。 

# should的minimum_should_match

minimum_should_match用于控制bool中should列表，至少匹配几个条件才召回doc。

默认不传minimum_should_match的情况下，查询分2个情况：

- 当bool处在query上下文中时，并且must或者filter匹配了doc，那么should即便一条都不满足也可以返回doc。
- 当bool处在父bool的filter、must上下文中时 或者 bool处在query上下文且没有must/filter子句的时候，should至少匹配1个才能返回doc。

```js
//伪代码
query:{
    bool {
       filter: [
         a=1,
         bool {
            should: [
               b=2,
               c=3
            ]
         }
       ]
    }
}

query:{
    bool {
       filter: [
         a=1,
       ],
       should: [
         b=2,
         c=3
       ],
       minimum_should_match: 1
    }
}
```

这也解释了上一个案例将should写在must里面

# default_operator

