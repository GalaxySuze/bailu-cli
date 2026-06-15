# 项目规则目录

> 由白鹿工作流（Bailu）创建。此目录用于存放项目级别的规则文件，AI 工具会在每次会话时自动加载。

## 快速开始

### 自动生成规则文件

在 AI 工具（Claude Code / Qoder）中执行：

```
/bailu-project-config
```

命令会自动扫描项目结构，根据技术栈生成符合**白鹿规则规范**的规则文件。

### 手动编写规则

也可以手动在此目录下创建 `.md` 文件，遵循以下规范：

```
---
name: 规则名称
category: 分类
priority: high
globs: "**/*.ext"
alwaysApply: true
description: 一句话描述
---

# 规则名称

::: constraints [MUST]
- 强制要求 1
- 强制要求 2
:::

::: anti_patterns
- ❌ 反模式 1
- ❌ 反模式 2
:::
```

## 规则文件标记说明

白鹿规则规范使用一组轻量的 `:::` 标记来区分规则模块，各模块含义如下：

| 标记 | 用途 |
|------|------|
| `::: constraints [MUST]` | 强制要求，违反时必须阻止 |
| `::: constraints [SHOULD]` | 强烈建议，违反时给出警告 |
| `::: constraints [MAY]` | 可选参考 |
| `::: anti_patterns` | 反模式清单 |
| `::: examples` | 示例代码 |
| `::: guidelines` | 指导建议 |
| `::: references` | 相关引用 |

## 推荐结构

```
rules/
├── README.md                  # 本文件
├── coding-standards.md        # 编码规范
├── database-conventions.md    # 数据库规范（如适用）
├── exception-error-codes.md   # 异常与错误码（如适用）
├── api-conventions.md         # API 规范（如适用）
└── dev-checklist.md           # 开发检查清单
```

## 工作机制

### Claude Code

- 启动时自动加载本目录下所有 `.md` 文件
- frontmatter 的 `globs` 字段控制规则的适用范围
- `alwaysApply: true` 表示所有任务都加载该规则

### Qoder

- 启动时自动加载本目录下所有 `.md` 文件
- frontmatter 的 `trigger: always_on` 表示始终生效
- 也支持 `trigger: glob` + `glob: <pattern>` 限定范围

## 相关文档

- 命令文档：`/bailu-project-config` 命令的详细说明

## 注意事项

- 规则文件改造**不支持自动回滚**，因为用户可能手动更新过规则内容
- "重新生成"操作会备份旧文件到 `.bailu-backup-rules-{时间戳}/`
- 如需回滚，请手动从备份目录恢复
