

# es的字段

es的keyword是不会分词的，text字段会被分词（完全匹配反而查不到）。

# es 的查询api

term 查询的值不会分词。只要washing 是name字段的子集，就能匹配得到。

```js
 "query": {
    "term": {
      "name": "washing"
    }
  }
```

match 查询的值会被分词，只要match分词的结果与tip字段存在并集，就能匹配得到。

```js
 "query": {
    "match": {
      "tip": "he goes to school"
    }
  }
```

match_phrase的分词结果必须在tip字段分词中都包含，而且顺序必须相同，而且必须都是连续的。

match_phrase_prefix 还必须满足前缀

```js
 "query": {
    "match_phrase": {
      "tip": "he goes to school"
    }
  }
```

query_string ，和match_phrase区别的是，不需要连续，顺序还可以调换。

```js
 "query": {
    "query_string": {
      "query": "he goes to school"
      "fields":['tip']
    }
  }
```

# es的组合查询

```js
"query":{
    "bool":{
        "must":[
            
        ],
         "must_not":[
                
            ]
    }
}
```

must和must_not可以放如下：(fieldName和name是需要填写的)

```js
{
    "range":{
        "fieldName":{
            "gte": "2020-08-12 00:00:00",
            "lte": "2020-08-12 00:00:00"
        }
    }
}

{
    "term":{
        "fieldName":"value"
    }
}

{
    "terms":{
        "fieldName":["value","value"]
    }
}

{
    "exists":{
        "field":"fieldName"
    }
}
```

must和filter组合

```js

{
     'query': {
          'bool': {
            'filter': {
              'script': {
                'script': "doc['fail_reason'][0].length()<50",
              },
            },
            'must': [
              {
                'range': {
                  'ftime': {
                    'gte': lastYearTime,
                    'lte': curTime,
                  }
                }
              },
              {
                'term': {
                  'translateStatus': '1',
                },
              },
            ],
          },
        },
 }
```

must后再进行筛选（满足must后，1or2 都可以）

```js
        query: {
          bool: {
            must: [
              // 满足rowkeys后：符合 errNameRowKeys or 其他信息符合keyword
              { terms: { rowkey: rowkeys } },
              {
                bool: {
                  should: [
                    {
                      multi_match: {
                        fields: [
                          'version',
                          'chid',
                          'script_ver',
                          'engine_ver',
                          'os',
                        ],
                        query: keyword,
                      },
                    },
                    { terms: { rowkey: errNameRowKeys } },
                  ],
                },
              },
            ],
          },
        },
```





# es的聚合

alias和fieldName 是需要填写的。

```js
//以fieldName分组
"aggs":{
    "alias":{
        "terms":{
            "field":'fieldName'
        }
    }
}

//以fieldName分组并只得出分组数量
"aggs":{
    "alias":{
        "cardinality":{
            "field":"fieldName"
        }
    }
}

//以多个字段一起分组
"aggs":{
    "alias":{
        "terms":{
            "scripts": "doc['fieldName'].values+''+doc['fieldName'].values"
        }
    }
}

//将数据按时间进行分组
  "aggs": {
    "alias": {
      "date_histogram": {//按照日期时间聚合分析数据
        "field": "fieldName",//分析的字段
        "interval": "month/day",//按照月份间隔
        "format": "yyyy-MM-dd",//日期格式
        "min_doc_count": 0,// 没有数据的月份返回0
        "extended_bounds":{//强制返回的日期区间，是连续的
          "min":"2014-01-01",
          "max":"2018-12-31"
        }
      }
    }
  }

```

es的分组是在query之后进行分组的。在某个分组后，还能继续嵌套`"aggs"`，继续分组。

