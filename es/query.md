query context

​		查询子句放在查询参数中

filter context

​		查询子句被放在过滤参数中：例如 复合查询的 filter、must_not内、const_scroe、聚合的filter中。

查询上下文会影响算分，而过滤上下文不会。

# full text queries

## match_phrase

https://www.elastic.co/guide/en/elasticsearch/guide/current/phrase-matching.html#phrase-matching

文档既要包含要查询的text的所有词，同时相对位置不能够变化。

## match_phrase_prefix

它在match_phrase的基础上，还允许最后一个词是前缀匹配

```console
GET /_search
{
    "query": {
        "match_phrase_prefix" : {
            "message" : "quick brown f"
            "max_expansions": "50"
        }
    }
}
```

比如这样可以匹配到 quick brown fox。

max_expansions 用于控制最后一个术语可以扩展多少个后缀，（不是很懂）

关于max_expansions的疑问：https://segmentfault.com/q/1010000017179306

## multi_match

多字段匹配。查询方式由type决定：best_fields ，most_fields，cross_fields，phrase，phrase_prefix

### 前提 了解should的算分

- 查询should 语句中的两个查询
- 加和两个子句的查询的评分
- 乘以匹配子句的总数
- 除以所有子句的总数

### best_fields

期望查询的值：i like you，我们更加希望这个值存在于同一个字段时，文档分数更高，而非i出现在一个字段，like出现在另一个字段。同时考虑其他字段出现时的分数。因此使用这个best_fields，其实就是使用dis max query + tie_breaker。具体看：https://www.jianshu.com/p/ad463f80fa72

还有需要注意的：https://www.elastic.co/guide/en/elasticsearch/reference/5.5/query-dsl-multi-match-query.html#operator-min

```console
GET /_search
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

GET /_search
{
  "query": {
    "dis_max": {
      "queries": [
        { "match": { "subject": "brown fox" }},
        { "match": { "message": "brown fox" }}
      ],
      "tie_breaker": 0.3
    }
  }
}
```

分数：这里有两个子句，一个文档的分数为： 某个子句的分数（最佳匹配）+另一个的分数*tie_breaker。

### most_fields

```console
GET /_search
{
  "query": {
    "multi_match" : {
      "query":      "quick brown fox",
      "type":       "most_fields",
      "fields":     [ "title", "title.original", "title.shingles" ]
    }
  }
}
==》 convert to below
GET /_search
{
  "query": {
    "bool": {
      "should": [
        { "match": { "title":          "quick brown fox" }},
        { "match": { "title.original": "quick brown fox" }},
        { "match": { "title.shingles": "quick brown fox" }}
      ]
    }
  }
}
```

这里有三个子句，一个文档的分数为 三个子句的分数 / 匹配上的子句的数量

### phrase and phrase_prefix

和best_fields一样，不过使用的不是match，而是phrase和phrase_prefix

The `fuzziness` parameter cannot be used with the `phrase` or `phrase_prefix` type

### cross_field

一个标识，却存储在了多个字段。比如姓名：姓一个字段，名一个字段。

https://blog.csdn.net/wuzhiwei549/article/details/80409027

https://www.elastic.co/guide/en/elasticsearch/reference/5.5/query-dsl-multi-match-query.html#type-cross-fields

https://blog.csdn.net/wangmaohong0717/article/details/60141394 算分