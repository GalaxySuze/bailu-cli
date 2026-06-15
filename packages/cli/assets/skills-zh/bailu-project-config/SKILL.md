---
name: bailu-project-config
description: "白鹿项目规则配置生成器。触发词：生成项目规则、整理项目规则、项目配置、/bailu-project-config、白鹿项目配置。扫描项目结构、识别技术栈、生成符合白鹿规则规范的项目级规则文件。"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# Bailu Project Config - 白鹿项目规则配置生成器

## 品牌信息

- **名称**：白鹿（Bailu）
- **前缀**：bailu:
- **寓意**：林深见鹿——在复杂的代码森林中，发现优雅的解决方案
- **理念**：在原生能力基础上叠加工作流规则

## 命令定位

> 与 CLI 的 `bailu init`（安装白鹿框架）**职责分离**：
> - `bailu init`：CLI 命令，负责安装 Skills、Agents、Commands、MCP，以及创建空的规则目录骨架
> - `/bailu-project-config`：AI 工具命令，负责扫描当前项目并生成符合**白鹿规则规范**的项目级规则文件

## 核心职责

1. 扫描项目结构，识别技术栈
2. 检测 `.claude/rules/` 和 `.qoder/rules/` 目录的现有规则
3. 按**白鹿规则规范**（基于 `:::` 标记的模块化结构）生成或整理规则文件
4. 同步更新 `CLAUDE.md` 中的规则索引
5. 适配 `AGENTS.md`（如果存在），添加白鹿规则规范说明

## 白鹿规则规范

### 文件结构

每个规则文件由 **YAML frontmatter** + **Markdown 正文** 组成。

**Frontmatter 字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 规则名称 |
| `category` | string | 分类（如代码风格、数据层、安全） |
| `priority` | `high` \| `medium` \| `low` | 优先级 |
| `globs` | string | 适用文件 glob 模式（Claude 用） |
| `trigger` | `always_on` \| `glob` \| `manual` | 触发模式（Qoder 用） |
| `alwaysApply` | boolean | 是否始终生效 |
| `description` | string | 一句话描述 |

**正文模块标记：**

| 标记 | 用途 |
|------|------|
| `::: constraints [MUST]` | 强制要求，违反时必须阻止 |
| `::: constraints [SHOULD]` | 强烈建议，违反时给出警告 |
| `::: constraints [MAY]` | 可选参考 |
| `::: anti_patterns` | 反模式清单 |
| `::: examples` | 示例代码 |
| `::: guidelines` | 指导建议 |
| `::: references` | 相关引用 |

### 标准模板

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

> **优先级**：high | **适用**：`globs` | **分类**：category

---

::: constraints [MUST]
- 强制要求 1
- 强制要求 2
:::

::: constraints [SHOULD]
- 建议 1
- 建议 2
:::

::: anti_patterns
- ❌ 反模式 1
- ❌ 反模式 2
:::

---

## 详细说明

（详细内容...）

::: examples
（示例代码...）
:::
```

## 执行流程

### 步骤 1：环境检测

1. 检测当前目录是否为有效项目（存在 `package.json`、`composer.json`、`pom.xml` 等）
2. 检测已安装的 AI 工具：
   - `.claude/` 目录 → Claude Code
   - `.qoder/` 目录 → Qoder
3. 至少有一个 AI 工具目录存在才继续；否则提示先运行 `bailu init`

### 步骤 2：项目分析

扫描项目结构，提取以下信息：

- **技术栈识别**：
  - PHP/Laravel：`composer.json` + `artisan`
  - Node.js：`package.json`
  - Python：`requirements.txt` / `pyproject.toml`
  - Java：`pom.xml` / `build.gradle`
  - Go：`go.mod`
- **目录结构**：分析 `app/`、`src/`、`lib/` 等目录
- **现有规范**：扫描 README.md、CONTRIBUTING.md 中的规范信息
- **关键配置**：识别配置文件位置、缓存键命名、错误码定义等

### 步骤 3：扫描现有规则

按平台分别扫描：

**Claude 平台：**
- 扫描 `.claude/rules/*.md`
- 解析每个文件的 frontmatter 和 `:::` 标记
- 判断是否符合白鹿规则规范

**Qoder 平台：**
- 扫描 `.qoder/rules/*.md`
- 同上判断

### 步骤 4：判断与执行

> [!note] 目录不存在
> → 提示用户先运行 `bailu init` 创建目录骨架

> [!tip] 目录存在，无规则文件
> → 直接生成规则文件（基于项目分析结果）

> [!warning] 目录存在，有规则文件
> → 扫描每个文件，判断是否符合白鹿规则规范
> → 对每个不符合规范的文件，提供用户选择：
>   - **跳过**：保留现有内容，不做任何修改
>   - **整理**：保留原有内容，仅添加 `:::` 标记和 frontmatter
>   - **重新生成**：备份旧文件到 `.bailu-backup-rules-{时间戳}/`，按项目分析结果生成新规则

### 步骤 5：生成规则文件

根据项目类型和分析结果，生成以下推荐规则文件：

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

**通用规则（所有项目）：**
- `git-conventions.md` — Git 提交规范
- `commit-message.md` — Commit Message 规范

### 步骤 6：同步主配置

更新 `CLAUDE.md`：

1. 添加或更新"模块化规则索引"章节
2. 列出所有规则文件及其职责
3. 说明 `:::` 标记的含义

如果 `AGENTS.md` 存在：

1. 在合适位置插入"规则文件格式说明"
2. 列出 `:::` 标记表

### 步骤 7：验证与汇总

1. 验证所有生成的文件 frontmatter 格式正确
2. 验证 `:::` 标记成对出现
3. 输出汇总报告：
   - 生成的文件列表
   - 跳过的文件列表
   - 备份目录位置（如有）
   - 下一步建议

## 备份策略

> [!important] 改造**不支持自动回滚**
> 因为用户可能在安装后手动更新过规则内容，自动回滚会导致这些更新丢失。

**备份机制：**

- 选择"重新生成"时，旧文件备份到 `.bailu-backup-rules-{YYYYMMDD-HHMMSS}/` 目录
- 备份目录会保留完整的目录结构
- 用户可手动从备份目录恢复

**回滚操作（手动）：**

```bash
# 查看备份
ls -la .bailu-backup-rules-*/

# 恢复某个文件
cp .bailu-backup-rules-20260610-235234/.claude/rules/coding-standards.md .claude/rules/

# 恢复全部
cp -r .bailu-backup-rules-20260610-235234/.claude/rules/* .claude/rules/
```

## 使用方式

```bash
# 标准用法：扫描项目并生成/整理规则
/bailu-project-config

# 只检查不修改
/bailu-project-config --dry-run

# 跳过交互，全部使用默认选项（整理而非重新生成）
/bailu-project-config --yes
```

## 触发词

- 生成项目规则
- 整理项目规则
- 项目配置
- bailu-project-config
- 白鹿项目配置

## 注意事项

1. **执行前确认**：对于"重新生成"操作，必须显式确认（除非使用 `--yes`）
2. **保留用户内容**："整理"操作必须保留原有内容，只添加标记
3. **跨平台同步**：如果 `.claude/rules/` 和 `.qoder/rules/` 同时存在，规则文件保持一致
4. **frontmatter 兼容**：Claude 用 `globs`，Qoder 用 `trigger`，需根据目标平台调整
5. **失败处理**：任何步骤失败都要清晰报错，并确保已生成的文件可用
