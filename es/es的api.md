https://xiaoxiami.gitbook.io/elasticsearch/   中文文档

# es的字段

es的keyword是不会分词的，text字段会被分词（完全匹配反而查不到）。

text被分词例子："xiao xia mi"  =>  "xiao"  "xia" "mi" 

keyword不会被分词，"xiao xia mi"  => "xiao xia mi"

# es分析器

分析器（无论是内置还是自定义）只是一个包含三个较底层组件的包：字符过滤器，分词器，和词语过滤器。

```js
//查看某个分析器的效果
POST _analyze
{
  "analyzer": "whitespace",
  "text":     "The quick brown fox."
}
```

分析器不仅将单词转换为词语，还记录了每个词语（用于短语查询或近义词查询）的顺序或相对位置，以及原始文本中每个词语的起始和结束字符的偏移量（用于突出搜索片段）。

自定义分析器的使用

```js
PUT my_index
{
//my_index索引下配置分析器
  "settings": {
    "analysis": {
      "analyzer": {
        "std_folded": {                       #1
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "asciifolding"
          ]
        }
      }
    }
  },
//my_index索引下 my_type索引类型的my_text字段用std_folded分析器
  "mappings": {
    "my_type": {
      "properties": {
        "my_text": {
          "type": "text",
          "analyzer": "std_folded"            #2
        }
      }
    }
  }}
//查看my_index索引下std_folded分析器对"Is this déjà vu?"的分词效果
GET my_index/_analyze {                       #3
  "analyzer": "std_folded",                   #4
  "text":     "Is this déjà vu?"}

GET my_index/_analyze {                       #5
  "field": "my_text",                         #6
   "text":  "Is this déjà vu?"}
```

## 安装中文插件

```js
https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v7.5.2/elasticsearch-analysis-ik-7.5.2.zip
```

把7.5.2换成对应的es版本，然后下载，解压。在es/plugins/ik/ 下放入解压后的文件

# es 的查询api

term 查询的值不会分词。只要xiao是name字段的子集，就能匹配得到。

比如有个文档的值是"xiao xia mi" （text） =>  "xiao"  "xia" "mi" 那么xiao是它的自己，就会返回这个文档。

不过如果是keyword "xiao xia mi" （keyword）  => "xiao xia mi" ， "xiao" 不是它的子集，所以查不到。

```js
 "query": {
    "term": {
      "name": "xiao"
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

## minimum_should_match

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

