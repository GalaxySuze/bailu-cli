# Python Code Review 规范

## 命名规范

- 变量/函数名：snake_case（get_order_list）
- 类名：大驼峰（OrderService）
- 常量：全大写下划线分隔（MAX_RETRY_COUNT）
- 私有方法/属性：单下划线前缀（_internal_method）
- 模块名：全小写，短横线或下划线（order_service.py）

## 类型标注

- 所有函数参数和返回值必须有类型标注（Python 3.6+）
- 使用 Optional[T] 表达可能为 None 的类型
- 复杂数据结构使用 TypedDict 或 dataclass 定义，不用裸 dict

## 函数职责

- 单个函数不超过 50 行
- 函数只做一件事，名称能准确描述其行为
- 参数不超过 5 个，超出考虑封装为 dataclass 或配置对象

## 异常处理

- 捕获异常要具体，禁止 except Exception: pass 吞掉异常
- 使用自定义异常类区分业务错误和系统错误
- 资源操作（文件、数据库连接、HTTP 请求）使用 with 语句确保释放
- 异常必须记录日志，不静默失败

## 日志

- 使用 logging 模块，不用 print 输出到生产环境
- 日志中不记录密码、完整手机号等敏感信息
- 使用 % 格式化或 f-string，不用字符串拼接（影响性能）

## 安全

- 数据库操作使用 ORM 或参数化查询，禁止 f-string 拼接 SQL
- 用户输入不直接传入 eval/exec
- 文件路径拼接使用 pathlib.Path，不用字符串拼接（防路径遍历）
- 敏感配置从环境变量读取，不硬编码在代码中

## 性能

- 避免在循环内做数据库查询，使用批量查询
- 大文件/大数据量使用生成器（yield）而不是一次性加载到内存
- I/O 密集型场景考虑 asyncio，CPU 密集型考虑 multiprocessing

## 可维护性

- 删除无用的 import 和注释掉的代码
- 使用列表推导/字典推导替代简单的 for 循环，但不要过度复杂
- 魔法数字定义为常量
- 模块级代码（非函数/类内）最小化，放在 if __name__ == '__main__' 中
