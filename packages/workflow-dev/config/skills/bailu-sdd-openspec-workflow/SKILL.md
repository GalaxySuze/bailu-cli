---
name: bailu-sdd-openspec-workflow
description: 白鹿SDD辅助：OpenSpec 工作流引擎。触发词：OpenSpec、openspec propose、openspec apply、openspec archive、创建变更、实现变更、归档变更。当用户需要使用 OpenSpec 管理技术方案变更生命周期时使用此 skill。支持 CLI 模式和 AI 模式，两种模式产出完全一致。
allowed-tools:
  - Read
  - Write
  - Bash
---

# OpenSpec 工作流

使用此 skill 引导项目完成基于 OpenSpec 的变更工作流。它是团队通用的：假设当前工作目录为项目目录，不绑定任何特定仓库路径、业务规则或部署细节。

## 第一步：检测 OpenSpec CLI

运行：

```bash
command -v openspec &>/dev/null && echo "cli_available" || echo "cli_missing"
```

- **cli_available** → 使用 CLI 模式（以下所有步骤使用 `openspec` 命令）
- **cli_missing** → 使用 AI 模式（以下所有步骤由 AI 直接处理，不调用任何 CLI 命令）

不停止或警告用户。两种模式产出完全一致的 artifacts。静默使用当前适用的模式。

## 意图路由

根据用户请求选择一个模式：

| 用户意图 | 模式 |
|---------|------|
| 想理清模糊想法、比较方案、或决定是否创建变更 | Explore |
| 想创建或提出新的 OpenSpec 变更 | Propose |
| 想实现、继续或推进已有的 OpenSpec 变更 | Apply |
| 想完成、关闭或归档已完成的 OpenSpec 变更 | Archive |

当意图不明确时，问一个简洁的澄清问题。不要在 apply 和 archive 之间猜测。

## Explore 模式

当需求不清晰或用户想在创建变更前先思考时使用 Explore 模式。

工作流：

1. 运行 `openspec list --json` 检查活跃变更
2. 如果用户提到特定变更，读取已有 artifacts：
   - `openspec/changes/<name>/proposal.md`
   - `openspec/changes/<name>/design.md`
   - `openspec/changes/<name>/tasks.md`
   - `openspec/changes/<name>/specs/` 下的任何 spec
3. 仅以只读方式调查代码库
4. 讨论选项、风险、约束和权衡。使用 ASCII 图表来澄清讨论
5. 不在 Explore 模式下实现代码
6. 当想法清晰后，询问用户是否要创建 OpenSpec 提案

好的 Explore 输出是基于事实且对话式的。它应该帮助用户做决定，而不是强制推进工作流。

## Propose 模式

当用户想要新的 OpenSpec 变更时使用 Propose 模式。

工作流：

1. 如果用户提供了变更名，使用它。否则从请求中派生一个简短的 kebab-case 名称
2. 如果请求太模糊无法创建有意义的 artifacts，在创建文件前问一个澄清问题

**CLI 模式：**

```bash
openspec new change "<name>"
openspec status --change "<name>" --json
```

然后对每个 artifact，运行 `openspec instructions <artifact-id> --change "<name>" --json` 并使用返回的模板创建 artifact。每个 artifact 完成后重新运行 status 直到所有必需 artifacts 完成。

**AI 模式：**

```bash
mkdir -p openspec/changes/<name>
```

然后使用下方标准 OpenSpec 模板直接创建 artifacts，顺序：proposal.md → design.md → tasks.md。

**proposal.md 模板：**
```markdown
# Proposal: <name>

## 背景与目标
<需求背景、要解决的问题、预期目标>

## 范围
<本次变更涉及的模块和边界>

## 不在范围内
<明确排除的内容>

## 成功标准
<可验证的完成条件>
```

**design.md 模板：**
```markdown
# Design: <name>

## 1. 方案概述
<整体技术思路>

## 2. 系统架构
<架构图或模块关系说明>

## 3. 数据库变更
<新增/修改的表结构，无则填"无">

## 4. 接口设计
<新增/修改的 API，包含入参出参>

## 5. 核心逻辑
<关键业务逻辑和处理流程>

## 6. 性能考量
<并发、缓存、大数据量处理方案>

## 7. 安全考量
<权限控制、数据脱敏、注入防护>

## 8. 异常处理
<边界条件和异常场景处理>

## 9. 测试要点
<主要验收场景>

## 10. 部署说明
<配置变更、迁移脚本、上线顺序>

## 11. 风险与待确认项
<不确定项、依赖外部确认的内容（不能为空）>
```

**tasks.md 模板：**
```markdown
# Tasks: <name>

## 开发任务

- [ ] <任务1描述>（执行人：<name>，SP：<n>）
- [ ] <任务2描述>（执行人：<name>，SP：<n>）
- [ ] <任务3描述>（执行人：<name>，SP：<n>）

## 验收标准

- [ ] <验收条件1>
- [ ] <验收条件2>
```

创建所有三个 artifacts 后，汇总创建的变更，列出 artifact 路径，并建议下一步 apply 变更。

## Apply 模式

当用户想要实现或继续已有的变更时使用 Apply 模式。

工作流：

1. 选择变更：
   - 如果用户指定了变更名，使用它
   - 如果未指定变更名：
     - **CLI 模式：** 运行 `openspec list --json`
     - **AI 模式：** 运行 `ls openspec/changes/` 列出活跃（未归档）目录
   - 如果只有一个活跃变更，宣布使用它
   - 如果有多个活跃变更，让用户选择

2. 读取变更 artifacts：
   - **CLI 模式：** 运行 `openspec instructions apply --change "<name>" --json` 并读取返回的每个上下文文件
   - **AI 模式：** 直接读取 `openspec/changes/<name>/proposal.md`、`design.md` 和 `tasks.md`

3. 如果必需 artifacts 缺失，停止并告知用户缺少哪些文件
4. 显示当前进度（tasks.md 中已完成 vs 剩余任务）
5. 逐个实现待完成任务，使用最小化、范围受限的变更
6. 每个任务完成后，立即将 `tasks.md` 中的 checkbox 从 `- [ ]` 改为 `- [x]`
7. 在以下情况暂停并寻求指导：任务不清晰、实现发现设计问题、测试失败超出任务范围、或缺少必需依赖
8. 所有任务完成后，建议归档变更

## Archive 模式

当用户想要关闭已完成的变更时使用 Archive 模式。

工作流：

1. 选择变更。如果有多个活跃变更且用户未指定，让用户选择

2. 检查状态：
   - **CLI 模式：** 运行 `openspec status --change "<name>" --json`
   - **AI 模式：** 直接读取 `tasks.md`，计数 `- [ ]` vs `- [x]`

3. 如果 artifacts 或 tasks 未完成，警告用户并询问是否仍要归档

4. 将变更移动到归档目录：

   ```bash
   mkdir -p openspec/changes/archive
   mv openspec/changes/<name> openspec/changes/archive/YYYY-MM-DD-<name>
   ```

5. 汇总归档位置和任务完成状态

不要静默归档未完成的工作。

## 守卫规则

- 在入口处检测一次 CLI 可用性；在整个会话中使用相同模式
- 不安装 OpenSpec CLI
- 不假设固定的项目路径
- 不在生成的 artifacts 中嵌入仓库特定的业务规则，除非当前项目文件声明了它们
- 保持 Explore 模式只读
- 保持 Apply 模式范围限定在所选变更的 artifacts 和 tasks 内
- 不在多个活跃变更之间猜测
- 归档未完成变更前先询问
- 偏好简洁的进度更新

## 输出模式

Propose 完成时：

```markdown
## OpenSpec 变更已创建

**变更**：<name>
**位置**：`openspec/changes/<name>/`

**Artifacts**：
- `proposal.md` — <简要用途>
- `design.md` — <简要用途>
- `tasks.md` — <简要用途>

准备好实现。说"apply <name>"或让我继续此变更即可开始。
```

Apply 暂停时：

```markdown
## 实现已暂停

**变更**：<name>
**进度**：<已完成>/<总计> 任务完成

**阻塞**：<具体问题>

请选择如何继续。
```

Archive 完成时：

```markdown
## 归档完成

**变更**：<name>
**归档至**：`openspec/changes/archive/YYYY-MM-DD-<name>/`
**任务**：<已完成>/<总计> 完成
**Specs**：<已同步 | 已跳过 | 无增量 specs>
```
