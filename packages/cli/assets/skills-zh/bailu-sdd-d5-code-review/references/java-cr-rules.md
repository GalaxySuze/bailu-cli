# Java Code Review 规范

## 命名规范

- 类名：大驼峰（UpperCamelCase）
- 方法名/变量名：小驼峰（lowerCamelCase）
- 常量：全大写下划线分隔（MAX_RETRY_COUNT）
- 包名：全小写，按模块分层（com.semir.order.service）
- 布尔变量不用 is 前缀（isSuccess → success，isDeleted → deleted）

## 空值处理

- 方法返回集合类型时，返回空集合而不是 null
- 使用 Optional 包装可能为空的返回值，避免 NPE
- 对外部传入参数做 null 检查，使用 Objects.requireNonNull 或 @NotNull
- 不允许直接对 Map.get() 结果不判空直接使用

## 异常处理

- 捕获异常要具体，不允许 catch (Exception e) {} 吞掉异常
- 业务异常统一使用自定义 BizException，携带错误码
- 在 Controller 层或统一异常处理器处理异常，Service 层一般不捕获
- finally 块中不要有 return 语句
- 日志记录异常时必须打印 e.getMessage() 或完整堆栈

## 事务

- @Transactional 只用在 Service 层，不用在 Controller 和 Repository
- 事务方法内不做耗时的外部调用（RPC、HTTP、MQ 发送）
- 大事务必须评估是否拆分，避免长时间占用数据库连接
- 事务内捕获异常后必须显式抛出，否则事务不会回滚

## 集合与 Stream

- 不在循环内做数据库查询，应批量查询后 Map 化处理
- Stream 操作链不超过 5 步，复杂逻辑拆成命名方法
- 大数据量场景禁止 stream().collect(Collectors.toList()) 一次性加载，使用分页

## 日志规范

- 使用 SLF4J + Logback，不直接使用 System.out.println
- 日志中不输出密码、手机号、身份证等敏感字段
- INFO 级别记录关键业务节点，DEBUG 级别记录详细调试信息
- 统一使用占位符格式：log.info("orderId={}, status={}", orderId, status)

## 安全

- SQL 必须使用预编译或 MyBatis #{} 占位符，禁止字符串拼接
- 用户上传文件必须校验类型（白名单）和大小
- 接口必须校验登录态和权限，不依赖前端隐藏
- 返回体不携带数据库主键以外的内部系统字段

## 可维护性

- 方法不超过 80 行，超出应拆分
- 单个类不超过 500 行，超出考虑职责拆分
- 魔法数字/字符串必须定义为常量
- 删除无用代码和注释掉的代码，不保留僵尸代码
