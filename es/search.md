https://www.elastic.co/guide/en/elasticsearch/reference/5.5/search.html

1. search_type的两中类型：

2. from/Size：from+size的数量不能超过index.max_result_window，默认是10000。而且分页效率并不高。
3. scroll：
4. search after：适用于用户实时查询，利用上一页的结果帮助下一页的检索。但是处理解决跳页的场景。
5. post filter：post filter执行于聚合之后，也就是先查询，结果用于聚合后，在执行post filter得到最终查询结果。也不会影响聚合的内容。
6. 

