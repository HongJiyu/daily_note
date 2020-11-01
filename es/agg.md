https://www.elastic.co/guide/en/elasticsearch/reference/5.5/search-aggregations.html

1. 指标聚合：

   cardinality：使用cardinality用来取唯一（去重），例如：bugly中设备唯一码uuid。该值是存在误差的，因为该关键字的计算需要加载数据到哈希集合（耗费内存），同时节点间传递每个分片的集合也会耗费集群资源。因此会有一个阈值，如果低于该阈值，结果是准确的。但是高于该阈值则结果存在误差。默认是3000，支持最大值是4000。

2. 聚合桶size/shard size：

   使用聚合桶时，如果size为5，那么协调节点会从每个分片获取聚合后前5的数据，并返回给协调节点，协调节点再根据返回的数据组合排序后取前5，这样会导致返回给客户端的5个桶的doc_count可能存在误差，因为doc_count是每个分片的前5的数据汇总，而非所有分片。

   解决：

   - 该索引只设置一个分片。
   - ize尽可能地大。
   - 设置shard size，这样既不会影响返回最终地size，也可以使得每个桶的doc_count尽可能精确。默认：如果只有一个分片，那么shard size等于size。否则 shar size=（1.5*size+10）

3. 聚合桶的sort：

    对聚合桶进行排序，可以为每个桶取一个指标聚合，比如每个桶中的最大/最小的发生时间。然后根据该指标进行排序。

```json
{
    "aggs" : {
        "problem" : {
            "terms" : {
                "field" : "allmd5",
                "order" : { "lastreporttime" : "desc" }
            },
            "aggs" : {
                "lastreporttime" : { "max" : { "field" : "ftime" } }
            }
        }
    }
}
```

		聚合桶中使用脚本时，有以下两个分割符：

```shell
AGG_SEPARATOR       =  '>' ; #取某个聚合桶下的子聚合桶   parentBucket>childBucket
METRIC_SEPARATOR    =  '.' ; #取某个聚合指标
```

4. 聚合桶的min_doc_count/shard_min_doc_count：

		min_doc_count应用于协调节点从所有分片获取数据后，筛选出至少含有min_doc_count个文档的桶。如果在分片级别返回的都是按照非默认排序（doc_count排序），那可能导致分片返回的桶的文档数量都是比较少，那么在协调节点聚合后，会导致筛选掉大部分桶，因为doc_count不满足min_doc_count。

      解决：设置shard_min_doc_count，使得分片级别返回的桶的文档数据满足最小文档数，那么协调节点就能够返回正常数量的桶，而不会说被筛选掉。

5.聚合桶过滤：

		使用include过滤出要包含的桶，使用exclude排除掉不想要的桶。可以使用正则进行模糊匹配。使用数组表示精确匹配。

```js
    "aggs" : {
        "tags" : {
            "terms" : {
                "field" : "tags",
                "include" : ".*sport.*",
                "exclude" : "water_.*"
            }
        }
    }

    "aggs" : {
        "tags" : {
            "terms" : {
                "field" : "tags",
                "include" : ["xxx"],
            }
        }
    }
```

6. 分区过滤：

		可以将聚合桶分区，并每次返回某个分区。使得每次返回的数据量不会太大。缺点：所有的文档是进行均匀分区的，而非按照某个排序顺序进行分区。也就是并不适用于类似分页的功能。

7. collect mode：

		breadth_first和deth_first，聚合时默认采用的聚合方式是深度优先。广度优先会将最上层的桶进行缓存，便于子聚合时获取。如果是桶数量非常多，而只需要取有限小的数量，可以使用breadth_first。这样可以减少不必要的计算。