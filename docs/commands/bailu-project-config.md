# /bailu-project-config

> **v2.2.0+** · AI 工具侧的 Slash 命令，用于扫描项目并生成符合**方案 E** 规范的项目规则文件。

## 与 `bailu init` 的关系

| 命令 | 在哪里运行 | 职责 |
|------|-----------|------|
| `bailu init` | 终端（CLI） | 创建空的 `.claude/rules/` 与 `.qoder/rules/` 目录 + README 模板 |
| `/bailu-project-config` | Claude Code / Qoder | 扫描项目结构、识别技术栈、生成符合方案 E 的规则**内容** |

两者职责分离：CLI 不负责执行，只负责安装配置；实际执行（包括规则内容生成）由 AI 工具完成。

## 用法

在 Claude Code 或 Qoder 中输入：

```
/bailu-project-config
```

或带参数：

```
/bailu-project-config --dry-run   # 只检查不修改
/bailu-project-config --yes       # 跳过交互，全部使用默认选项
```

## 执行流程

命令在 AI 工具中按以下流程推进：

### Step 1：环境检测

1. 确认当前目录是项目根（package.json / composer.json / pom.xml / 等）
2. 检测已安装的 AI 工具目录（`.claude/` / `.qoder/`）
3. 至少一个 AI 工具目录存在才继续；否则提示先运行 `bailu init`

### Step 2：项目分析

扫描项目，提取：

- **技术栈识别**：PHP/Laravel、Node.js、Python、Java、Go
- **目录结构**：`app/` / `src/` / `lib/` 等
- **现有规范**：从 README.md、CONTRIBUTING.md 提取
- **关键配置**：错误码定义、缓存键命名、配置文件位置

### Step 3：扫描现有规则

- 扫描 `.claude/rules/*.md` 与 `.qoder/rules/*.md`
- 解析每个文件的 frontmatter 和 `:::` 标记
- 判断是否符合方案 E 规范

### Step 4：判断与执行

| 现状 | 处理 |
|------|------|
| 目录不存在 | 提示先运行 `bailu init` 创建骨架 |
| 目录存在，无规则文件 | 直接生成规则文件 |
| 目录存在，有规则文件 | 对每个文件提供选择：跳过 / 整理 / 重新生成 |

**重新生成**会先备份旧文件到 `.bailu-backup-rules-{时间戳}/`。

### Step 5：生成规则文件

根据项目类型生成（举例）：

**PHP/Laravel 项目：**

- `coding-standards.md` — PHP 编码规范（PSR-12、严格类型、SOLID）
- `database-conventions.md` — Eloquent ORM、事务、N+1 防范
- `exception-error-codes.md` — 异常体系与错误码
- `api-response-logging.md` — API 响应格式与日志
- `dev-checklist.md` — 开发检查清单

**Node.js 项目：**

- `coding-standards.md` — JavaScript/TypeScript 规范
- `api-conventions.md` — API 设计规范
- `error-handling.md` — 错误处理
- `dev-checklist.md` — 开发检查清单

**通用规则：**

- `git-conventions.md` — Git 提交规范
- `commit-message.md` — Commit Message 规范

### Step 6：同步主配置

更新 `CLAUDE.md`（如存在），添加规则索引和方案 E 说明。

如果 `AGENTS.md` 存在，插入规则文件格式说明。

### Step 7：验证与汇总

- 验证所有 frontmatter 格式正确
- 验证 `:::` 标记成对出现
- 输出汇总报告

## 方案 E 规则文件规范

每个规则文件由 **YAML frontmatter** + **Markdown 正文** 组成。

### Frontmatter 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 规则名称 |
| `category` | string | 分类（如代码风格、数据层、安全） |
| `priority` | `high` \| `medium` \| `low` | 优先级 |
| `globs` | string | 适用文件 glob 模式（Claude 用） |
| `trigger` | `always_on` \| `glob` \| `manual` | 触发模式（Qoder 用） |
| `alwaysApply` | boolean | 是否始终生效 |
| `description` | string | 一句话描述 |

### 正文模块标记

| 标记 | 用途 |
|------|------|
| `::: constraints [MUST]` | 强制要求，违反时必须阻止 |
| `::: constraints [SHOULD]` | 强烈建议，违反时给出警告 |
| `::: constraints [MAY]` | 可选参考 |
| `::: anti_patterns` | 反模式清单 |
| `::: examples` | 示例代码 |
| `::: guidelines` | 指导建议 |
| `::: references` | 相关引用 |

### 完整示例

```markdown
---
name: PHP 编码规范
category: 代码风格
priority: high
globs: "**/*.php"
alwaysApply: true
description: PHP 项目的编码标准，包含严格类型声明、PSR-12 风格、SOLID 原则
---

# PHP 编码规范

> **优先级**：high | **适用**：`**/*.php` | **分类**：代码风格

---

::: constraints [MUST]
- 每个 PHP 文件顶部必须 declare(strict_types=1)
- 使用 4 空格缩进，禁止 Tab
- 类名 PascalCase，方法名 camelCase
:::

::: anti_patterns
- ❌ 在 Controller 中编写复杂业务逻辑
- ❌ 硬编码队列名、缓存键、错误码
:::

::: examples
（示例代码）
:::
```

## 三重兼容

| 工具 | 行为 |
|------|------|
| **Claude Code** | 识别 `:::` 作为语义边界，自动加载 `globs` 匹配的规则 |
| **Qoder** | 识别 `:::`，按 `trigger` 字段决定加载策略 |
| **Obsidian** | `:::` 兼容 callout 语法，知识库可直接预览 |
| **不识别 `:::` 的工具** | 把 `:::` 当作普通文本，正文仍是合法 Markdown |

## 备份与回滚

> ⚠️ 改造**不支持自动回滚**，因为用户可能在安装后手动更新过规则内容，自动回滚会导致这些更新丢失。

选择"重新生成"时，旧文件自动备份到 `.bailu-backup-rules-{YYYYMMDD-HHMMSS}/`，保留完整目录结构。

手动恢复：

```bash
# 查看备份
ls -la .bailu-backup-rules-*/

# 恢复某个文件
cp .bailu-backup-rules-20260611-001234/.claude/rules/coding-standards.md .claude/rules/

# 恢复全部
cp -r .bailu-backup-rules-20260611-001234/.claude/rules/* .claude/rules/
```

## 与其他命令的关系

- 安装前先用 [`bailu init`](./init) 创建 rules 目录骨架
- 重新生成时旧文件自动备份，无需手动 `bailu reset`
- 安装新版本后，AI 工具中会自动加载最新的命令定义

## 故障排查

### "找不到 rules 目录"

先运行 `bailu init`，会创建 `.claude/rules/` 与 `.qoder/rules/`。如果只想要其中一个，可以手动删除另一个。

### "规则文件没生效"

- Claude Code：检查 frontmatter 的 `globs` 字段是否匹配当前文件
- Qoder：检查 frontmatter 的 `trigger` 字段（`always_on` 或 `glob`）
- 重启 AI 工具会话，让它重新加载 rules 目录

### "想自己手写规则文件"

直接在 `.claude/rules/` 或 `.qoder/rules/` 下创建 `.md` 文件即可，遵循方案 E 规范。`/bailu-project-config` 下次运行时会识别它们，提供"跳过/整理/重新生成"选项，不会粗暴覆盖。
