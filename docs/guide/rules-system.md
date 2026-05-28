# Rules 系统设计

Rules（规则）是白鹿工作流的重要组成部分，用于约束 AI 的行为和输出风格。

## 什么是 Rules？

Rules 是一组 Markdown 文件，定义了 AI 应该遵循的规范和准则。

**类比**：如果 Skills 是 AI 的"技能"，Rules 就是 AI 的"行为准则"。就像公司有员工手册一样，Rules 就是 AI 的"工作手册"。

---

## Rules 层级体系

白鹿工作流采用三级 Rules 层级体系：

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Rules 层级体系                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Level 1: 全局通用 Rules (~/.claude/rules/)                             │
│  ├── common/                                                            │
│  │   └── coding-style.md        # 代码风格通用规范                      │
│  ├── python/                                                            │
│  │   └── python-style.md        # Python 规范                           │
│  └── typescript/                                                        │
│       └── ts-style.md           # TypeScript 规范                       │
│                                                                         │
│  Level 2: 工作流级 Rules (工作流包内)                                    │
│  ├── workflow-rules.md          # 工作流规范                             │
│  └── team-rules.md              # 团队规范                               │
│                                                                         │
│  Level 3: 项目目录级 Rules (项目/.claude/rules/)                        │
│  ├── project-structure.md       # 项目目录结构                           │
│  ├── business-rules.md          # 业务特定规则                           │
│  └── database-config.md         # 数据库配置规则                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 生效优先级

```
Level 3 (项目目录级) > Level 2 (工作流级) > Level 1 (全局通用级)
```

**说明**：
- 项目级规则可以覆盖工作流通用规则
- 工作流通用规则可以覆盖全局通用规则
- 高优先级规则中的同名规则会覆盖低优先级规则

---

## Rules 文件结构

### Frontmatter

每个 Rules 文件可以包含 Frontmatter 元数据：

```yaml
---
name: coding-style
description: 代码风格通用规范
alwaysApply: true
globs:
  - "*.php"
  - "*.js"
  - "*.ts"
---
```

**字段说明**：

| 字段 | 必填 | 说明 |
|------|------|------|
| name | ✅ | 规则名称 |
| description | ❌ | 规则描述 |
| alwaysApply | ❌ | 是否总是生效（默认 false） |
| globs | ❌ | 文件匹配模式 |

### alwaysApply 说明

- `true`：规则对所有文件生效
- `false`：规则只对匹配 globs 的文件生效

### globs 说明

使用 glob 模式匹配文件：

```yaml
globs:
  - "*.php"           # 匹配所有 PHP 文件
  - "app/**/*.php"    # 匹配 app 目录下的 PHP 文件
  - "!vendor/**"      # 排除 vendor 目录
```

---

## Level 1: 全局通用 Rules

全局通用 Rules 存储在 `~/.claude/rules/` 目录下。

### common/coding-style.md

**Frontmatter:**

```yaml
name: coding-style
description: 代码风格通用规范
alwaysApply: true
```

**规则内容:**

#### 基本原则

- 代码清晰优于聪明
- 一致性优于个人偏好
- 明确优于隐式

#### 命名规范

- 类名：PascalCase（UserService、OrderController）
- 方法名：camelCase（getUserById、createOrder）
- 变量名：camelCase（$userId、$orderItems）
- 常量：UPPER_SNAKE_CASE（MAX_RETRY_COUNT、STATUS_ACTIVE）
- 数据库表名：snake_case（users、order_items）
- 数据库字段：snake_case（user_id、created_at）

#### Examples

**Correct:**

```php
class UserService
{
    private const MAX_RETRY_COUNT = 3;
    
    public function getUserById(int $userId): ?User
    {
        // ...
    }
}
```

**Incorrect:**

```php
class user_service  # VIOLATION: 类名应为 PascalCase
{
    private $maxRetryCount = 3;  # VIOLATION: 常量应为 UPPER_SNAKE_CASE
    
    public function get_user_by_id($userId)  # VIOLATION: 方法名应为 camelCase
    {
        // ...
    }
}
```

---

### common/git-workflow.md

**Frontmatter:**

```yaml
name: git-workflow
description: Git 工作流规范
alwaysApply: true
```

**规则内容:**

#### 分支命名规范

**分支创建原则：需要一同发布的需求则放在同一个分支中开发**

迭代分为两种：
- **瀑布迭代**：不固定时间范围，通过产品研发测试评估协商得出开发时间范围
- **日常迭代**：固定时间范围为两周，开始时间是周五，结束时间是周四

**瀑布迭代分支命名：**

```
feature-[工程模块]-V[版本号]-[TB任务ID]

示例：
feature-admin-V1.0.5-CJRK-9580
feature-h5-V1.0.5-CJRK-9580
```

如果需要多个分支分批发布：

```
feature-[工程模块]-V[版本号]-[TB任务ID]-[英文关键词]

示例：
feature-admin-V1.0.5-CJRK-9580-moduleA
feature-admin-V1.0.5-CJRK-9580-moduleB
```

**日常迭代分支命名：**

```
feature-[工程模块]-[迭代日期范围]-[TB任务ID]

示例（迭代范围 8月11日 到 8月24日）：
feature-admin-08110824-CJRK-9580
feature-h5-08110824-CJRK-9580
```

**生产 Bug 修复分支命名：**

```
hotfix-[日期]-[TB任务ID]

示例：
hotfix-20230816-CJRK-9580
```

**修复分支命名：**

```
fix-[日期]-[TB任务ID]
```

#### Commit Message 格式

```
type(scope): subject

body

footer
```

**Type 类型：**
- feat: 新功能
- fix: 修复
- docs: 文档
- style: 格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

#### Examples

**Correct:**

```
feat(order): 添加订单导出功能

- 支持按时间范围导出
- 支持 Excel 和 CSV 格式
- 异步导出，完成后通知

Closes #123
```

**Incorrect:**

```
add export  # VIOLATION: 缺少 type 和 scope
```

---

### common/security.md

**Frontmatter:**

```yaml
name: security
description: 安全规范
alwaysApply: true
```

**规则内容:**

#### 敏感数据处理

- 禁止在代码中硬编码密码、密钥、Token
- 使用环境变量或配置文件存储敏感信息
- 日志中禁止输出敏感数据（密码、Token、身份证号等）

#### SQL 注入防护

- 禁止拼接 SQL 语句
- 使用参数绑定或 Eloquent ORM

#### Examples

**Correct:**

```php
$users = DB::table('users')
    ->where('status', $status)
    ->get();

Log::info('用户登录', ['user_id' => $user->id]);
```

**Incorrect:**

```php
$users = DB::select("SELECT * FROM users WHERE status = '$status'");
// VIOLATION: SQL 注入风险

Log::info('用户登录', ['user_id' => $user->id, 'password' => $password]);
// VIOLATION: 日志泄露密码
```

---

### common/documentation.md

**Frontmatter:**

```yaml
name: documentation
description: 文档规范
alwaysApply: true
```

**规则内容:**

#### 代码注释

- 使用中文注释
- 类和方法必须有文档注释
- 复杂逻辑必须有行内注释

#### 注释格式

```php
/**
 * 用户服务类
 *
 * @description 处理用户相关的业务逻辑
 */
class UserService
{
    /**
     * 根据用户ID获取用户信息
     *
     * @param int $userId 用户ID
     * @return User|null 用户模型实例
     */
    public function getUserById(int $userId): ?User
    {
        // 从缓存中获取用户信息
        return Cache::remember("user:{$userId}", 3600, function () use ($userId) {
            return User::find($userId);
        });
    }
}
```

---

## Level 2: 工作流级 Rules

工作流级 Rules 存储在工作流包的 `rules/` 目录下。

### workflow-rules.md

**Frontmatter:**

```yaml
name: workflow-rules
description: 工作流规范
alwaysApply: false
globs:
  - "*.md"
```

**规则内容:**

#### 检查点规范

- 每个阶段结束时必须创建检查点
- 检查点需要等待用户确认
- 确认后才能进入下一阶段

#### 文档规范

- 每个阶段必须生成对应的文档
- 文档必须存储在指定目录
- 文档必须包含必要的元数据

#### Examples

**Correct:**

```
阶段 1 完成，创建检查点：
- 问题清单已确认
- 方案方向已确认
进入阶段 2...
```

**Incorrect:**

```
阶段 1 完成，直接进入阶段 2...
# VIOLATION: 缺少检查点
```

---

## Level 3: 项目目录级 Rules

项目目录级 Rules 存储在项目的 `.claude/rules/` 目录下。

### project-structure.md

**Frontmatter:**

```yaml
name: project-structure
description: 项目目录结构规范
alwaysApply: true
```

**规则内容:**

#### Laravel 项目结构

```
app/
├── Http/
│   ├── Controllers/    # 控制器
│   ├── Middleware/      # 中间件
│   └── Requests/       # 表单请求
├── Models/             # 数据模型
├── Services/           # 业务逻辑
├── Repositories/       # 数据访问
├── Jobs/               # 队列任务
├── Events/             # 事件
└── Exceptions/         # 异常
```

#### 文件命名

- 控制器：`{Module}Controller.php`
- 服务：`{Module}Service.php`
- 模型：`{Module}.php`（单数）
- 表单请求：`{Module}{Action}Request.php`

#### Examples

**Correct:**

```
app/Http/Controllers/OrderController.php
app/Services/OrderService.php
app/Models/Order.php
```

**Incorrect:**

```
app/Http/Controllers/ordercontroller.php
# VIOLATION: 文件名应为 PascalCase

app/Services/order_service.php
# VIOLATION: 文件名应为 PascalCase
```

---

## Rules 匹配机制

### 文件匹配

Rules 通过 `globs` 字段匹配文件：

```yaml
globs:
  - "*.php"           # 匹配所有 PHP 文件
  - "app/**/*.php"    # 匹配 app 目录下的 PHP 文件
  - "!vendor/**"      # 排除 vendor 目录
```

### 匹配优先级

1. 项目目录级 Rules（最高优先级）
2. 工作流级 Rules
3. 全局通用 Rules（最低优先级）

### 冲突处理

当多个 Rules 冲突时：
- 高优先级 Rules 覆盖低优先级 Rules
- 同优先级 Rules 按文件名排序

---

## Rules 最佳实践

### 1. 使用 alwaysApply

对于通用规范，设置 `alwaysApply: true`：

```yaml
alwaysApply: true
```

### 2. 使用 globs 限定范围

对于特定文件类型的规范，使用 `globs` 限定范围：

```yaml
globs:
  - "*.php"
  - "app/**/*.php"
```

### 3. 提供 Correct/Incorrect 示例

在 Rules 中提供正确和错误的示例：

```markdown
## Examples

**Correct:**

// 正确的代码示例

**Incorrect:**

// 错误的代码示例  # VIOLATION: 违规原因
```

### 4. 保持简洁

每个 Rules 文件专注于一个主题，避免内容过长。

### 5. 定期更新

根据项目发展和团队反馈，定期更新 Rules。

---

## Rules 管理命令

### 查看 Rules

```bash
# 查看已安装的 Rules
bailu status

# 在 WebUI 中查看
bailu serve
```

### 安装 Rules

Rules 随工作流一起安装：

```bash
# 安装开发工作流（包含 Rules）
bailu workflow install dev
```

### 自定义 Rules

可以在项目目录下添加自定义 Rules：

```bash
# 创建项目 Rules 目录
mkdir -p .claude/rules

# 添加自定义 Rules
```

然后创建 `.claude/rules/my-rules.md` 文件。

---

## 常见问题

### Q: Rules 和 Skills 有什么区别？

**A**: 
- **Skills**：定义 AI 的能力（能做什么）
- **Rules**：定义 AI 的行为准则（应该怎么做）

类比：Skills 是"技能证书"，Rules 是"工作手册"。

### Q: 如何让 Rules 对所有文件生效？

**A**: 在 Frontmatter 中设置 `alwaysApply: true`。

### Q: 如何让 Rules 只对特定文件生效？

**A**: 在 Frontmatter 中使用 `globs` 指定文件匹配模式。

### Q: 多个 Rules 冲突怎么办？

**A**: 按优先级处理：
1. 项目目录级 Rules（最高）
2. 工作流级 Rules
3. 全局通用 Rules（最低）

高优先级 Rules 会覆盖低优先级 Rules。
