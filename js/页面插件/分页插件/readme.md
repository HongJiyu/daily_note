引入js和css，模板按照html写接口和调用

1.P.initMathod 代表调用后台接口生成数据生成数据div，渲染分页div，

2.
第一次初始化（必须） P.initMathod(xx)，
需要再次渲染页面时（div和页码都渲染）：P.renderPage()，
单独渲染div:P.requestFunction(false)，

3.
只调用P.requestFunction() 只修改数据div，不改动分页div
P.renderPage(); 只改动分页div，不修改数据。 用于改变条数时需要重新定义查询条件。

4.改代码：要先unbind，再绑定click。但是没有清除掉click，导致多次绑定。但是自己重写测试案例html("")为空，再重写渲染，click被清楚了。是插件的问题吗。

5.改代码：total小于0，不渲染分页。

6.改分页插件，true是查总数，下一页的按钮是不查总数，别老是去查总数，耗费性能。