

每周笔记

# 路由

备注在common
状态更新和添加跟进人 router/crash_error
提供接口给平台开发： 在router/api/v1/

# 使用redis

1.用redis限制请求频繁。din

2.近期访问栏目前三。

3.记录定时任务更新日期。（在汇总表数据不一致情况下，需要定时任务去聚合es来更新mongo的汇总表）



# oaMessage

自己调用发送火星消息没有使用await。

提供给平台的火星消息使用了await。



# remark

remarks里面的remark ： 更新过是：1,普通备注是0，处理状态是2，然后我加了个判断跟进人的为3。



# config

config挂载在app.config ，不清楚。bugly项目app下的config和this下的config是一样的。



# 提供给平台的接口

get请求、gate和objectId
http://10.17.5.253:8082/api/v1/message?gate=m2test&objectId=5f3527e6cd9c535d18af2f6b  设置了白名单



# 第一次提交

三个单子：跟进人同步、备注同步、跟进人变更进行备注、跟进人添加进行通知



# egg-fw-tec-base的代码

ip_access,通过router.('path',ipAccess(),controller.action)的方式来起到中间件的作用

response_warpper, 通过中间件的形式，在接口返回时进行拦截判断是否存在apiResult，并进行封装实现。

  result = {code:xx,msg:'已调用发送通知接口'};

egg-bd-plugin-validate,优先通过from，否则按优先级 ctx.params > ctx.request.body > ctx.request.query 获取值

# es的聚合aggs
date_histogram 用于处理时间的函数

cardinality 类似于mysql的distinct

constant_score 忽略评分

query和filter：query的上下文条件用来打分，而filter只是过滤，不参与打分。

date_histogram

size:0  不需要文档，只需要聚合报告



# Mongo的汇总表

{
  "_id": 
  "allmd5": 
  "status": 处理状态
  "translateStatus": 解析状态
  "date": 出现的日期,
  "appVersion": 出现的应用版本
  "trend48hour": 废弃,
  "lastreporttime": 上次报错时间
  "lastreportrowkey": 在es中上次报错的文档：rowkey
  "rule": 是否被清除和lastreporttime组合
  "type": 在库里面只有error和crash
  "allos": 废弃，
  "inner_happentimes": 内部数据发生次数
  "platform": 平台
  "alldevice": 所有设备
  "stackmd5": "stackmd5信息
  "jailbreak": 是否越狱
  "errorstack": 栈信息
  "engineVersion": 引擎版本
  "inner_effectcustom": 内部影响用户
  "scriptVersion": 脚本版本
  "errorname": 错误名
   "firstreporttime": 首次发生错误
  "happentimes": 发生次数
  "version": 脚本和引擎版本，用上面两个
  "trend30day": 废弃
  "allversion": 废弃
  "effectcustom": 影响用户数
  "ctype": "8",
  "gate": "m2csm"
}

# 使用eslint检查代码

npm run lint

配置eslint规则 ：在方法上配置：  /\*eslint-disable xxxxx\*/