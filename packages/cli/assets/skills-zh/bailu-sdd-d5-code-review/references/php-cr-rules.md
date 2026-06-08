# PHP Code Review 规范

## 命名规范

- 类名：大驼峰（OrderService）
- 方法名/变量名：小驼峰（getOrderList）
- 常量：全大写下划线分隔（MAX_RETRY）
- 数据库字段映射的属性名：与字段名保持一致，统一下划线
- 文件名与类名保持一致

## 请求校验

- 所有入参必须经过 FormRequest 或 Validator 校验，不在 Controller 内手动 if 判断
- 校验规则写在 rules() 方法中，错误提示写在 messages()
- 不信任前端传入的任何字段，包括 id、状态字段

## 控制器职责

- Controller 只做：接收请求 → 调用 Service → 返回响应
- 业务逻辑不写在 Controller 中
- 响应统一使用封装的 ApiResponse/JsonResponse 格式

## SQL 安全

- 禁止原生 SQL 字符串拼接，使用 Eloquent ORM 或 Query Builder 的 ? 占位符
- 复杂查询使用 selectRaw/whereRaw 时，必须传入绑定参数
- 不在循环中执行 N+1 查询，使用 with() 预加载关联

## 异常处理

- 统一在 Handler/ExceptionHandler 中处理异常，不在 Controller 中 try-catch
- 业务异常使用自定义 BizException，携带错误码和消息
- 不允许捕获异常后什么都不做或只 echo 错误信息

## 安全

- 使用 bcrypt 或 argon2 对密码加密，禁止 MD5/SHA1 直接存储密码
- 所有输出到页面的内容使用 htmlspecialchars 或模板引擎自动转义
- 文件上传必须校验 MIME 类型（服务端校验），不依赖扩展名
- 敏感操作使用 CSRF Token 保护

## 日志

- 使用 Log::info/warning/error，不用 var_dump/print_r 到生产环境
- 日志中不记录密码、完整手机号、身份证等敏感信息
- 关键业务操作（支付、权限变更）必须有日志记录

## 可维护性

- 方法不超过 60 行
- 禁止魔法数字，使用常量或枚举
- 删除注释掉的代码块
- 避免深层嵌套（超过 3 层 if 应重构为卫语句或提前返回）
