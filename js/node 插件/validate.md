用validate。
配置后自动将 ‘’、null、undefined转为undefined，也最好这么配置。（widelyUndefined: true,）
使用技巧：

有这些字段：必选、默认、可选、 logo 不动默认不改

前端全部都传。

后端：

1. 添加时所有字段都去用validate验证（空串是没填，变为undefined，放到数据库是null）。
   1. 必选用required的属性，并且类型转换。
   2. 可选用?，或者required=false。并且类型转换。
   3. 默认值手动  -- 放到数据库是null。因为如果为空串，int等类型，会报错。为null 就不会。
2. 修改时对必选字段和默认字段进行验证。其他字段带上？，如果是像logo空默认不改要重新设置。