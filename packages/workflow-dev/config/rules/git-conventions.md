# Git 提交与分支规范

## 分支策略

### 主分支
- `main` / `master` — 生产就绪代码，受保护
- `develop` — 开发集成分支

### 功能分支
- 命名格式：`<type>/<description>`
- 示例：`feat/user-login`、`fix/api-timeout`、`refactor/db-layer`
- 从 `develop` 创建，合并回 `develop`

### 发布分支
- 命名格式：`release/<version>`
- 从 `develop` 创建，合并到 `main` 和 `develop`

## 提交规范

### 提交信息格式
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Type 类型
| type | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug 修复 |
| docs | 文档更新 |
| style | 代码格式（不影响功能） |
| refactor | 重构（不新增功能，不修复 bug） |
| perf | 性能优化 |
| test | 测试相关 |
| chore | 构建/工具/依赖更新 |
| revert | 回滚提交 |

### Scope 范围
- 模块名或功能名，如 `auth`、`api`、`ui`
- 可省略，使用英文小写

### 提交粒度
- 每次提交只做一件事
- 提交信息准确描述做了什么
- 不提交不完整的代码（编译不过、测试不通过）

## Code Review 要求

- 所有合并到 `main` 的代码需经过 Review
- Review 前确保 CI 通过
- Reviewer 关注：正确性、安全性、性能、可维护性
- 发现问题使用建议（Suggestion）而非直接修改
