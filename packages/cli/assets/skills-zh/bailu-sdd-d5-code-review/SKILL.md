---
name: bailu-sdd-d5-code-review
description: "白鹿SDD研发阶段D5代码评审助手。触发词：Code Review、代码审核、代码评审、CR、审代码、D5。"
---

# SDD D5 - 代码评审

## 概述

D5 是代码实现后的质量闸门，和 D3 技术方案评审不同。D5 关注的是**实际提交的代码**，必须完成两类审核：

1. **AI 代码审核**：由 Claude 根据代码变更和语言规范做静态审查
2. **人工代码审核**：由评审人阅读 AI 审核摘要和代码 diff，在当前会话中给出结论

两类审核都通过，D5 才完成并推进至 D6。

## 白鹿 Agent 路由

D5 代码评审阶段可路由到白鹿 `code-reviewer` Agent 进行自动化的代码审查。Agent 会基于项目语言规范文件进行多维度检查，输出结构化审核报告。

路由方式：
- 自动检测到 D5 阶段时，提示用户是否启用 `code-reviewer` Agent
- 用户也可主动说"用 code-reviewer 审查"来触发 Agent 路由

## 阶段入口契约

### 前置条件

进入 D5 代码评审阶段前，必须满足以下条件：

1. 当前阶段 = `D5`（读取 `.sdd/sdd-context.md` 确认）
2. D4 编码任务已全部完成（`tasks.md` 中所有任务已勾选）

### 输入产物

- `.sdd/sdd-context.md` — SDD 上下文
- `openspec/changes/<change-name>/tasks.md` — 任务清单（确认全部完成）
- `openspec/changes/<change-name>/design.md` — 技术设计方案（作为实现对照）
- `openspec/changes/<change-name>/review.md` — D3 评审记录及待跟踪项
- 当前 git diff / 已提交变更

## Step 1：读取上下文与变更信息

读取 `.sdd/sdd-context.md`，确认当前阶段应为 D5。

读取：
- `openspec/changes/<change-name>/review.md`
- `openspec/changes/<change-name>/tasks.md`
- 当前 git diff / 已提交变更

若 tasks.md 仍有未完成任务，提示先完成 D4。

若 `.sdd/sdd-context.md` 当前阶段不是 D5，停止并提示先完成前置阶段。

## Step 2：识别语言/技术栈并加载规范

自动识别项目语言/栈，优先加载对应规则文件：

- `references/java-cr-rules.md`
- `references/php-cr-rules.md`
- `references/python-cr-rules.md`
- `references/react-cr-rules.md`

识别方式可基于文件特征：
- Java：`pom.xml` / `build.gradle` / `src/main/java`
- PHP：`composer.json` / `app/` / `artisan`
- Python：`pyproject.toml` / `requirements.txt` / `.py`
- React/Vue：`package.json` / `src/` / `.tsx` / `.jsx` / `.vue`
- ABAP：`.abap` 文件 / `src/` 下含 `*.prog.abap` / `*.clas.abap`

**ABAP 项目处理**：无对应本地规则文件，改为基于以下维度做 AI 审核：
- 代码是否符合 ABAP Clean Code 原则（单一职责、方法短小、命名规范）
- 是否存在性能风险（SELECT * / 未加 WHERE 条件 / 循环内 SELECT）
- 异常处理是否完整（TRY/CATCH/CLEANUP）
- 是否有硬编码（Magic Number / 写死的系统参数）
- 安全：权限对象检查是否覆盖

若项目同时存在多种栈，加载全部相关规范。

## Step 3：AI 代码审核

按以下维度审查变更代码：

1. 代码规范
2. 安全漏洞
3. 性能问题
4. 业务逻辑正确性
5. 异常处理
6. 可维护性

审查方式：
- 对照 `design.md` / `tasks.md` 检查实现是否偏离方案
- 检查 diff 中新增/修改的关键逻辑
- 重点检查规则文件中定义的语言栈规范

输出 AI 审核结论分为三类：
- **通过**：无明显问题
- **有问题但可接受**：存在低风险问题，建议后续优化
- **阻塞**：存在必须修改的问题

输出格式：

```markdown
## AI Code Review

**结论**：通过 / 有问题但可接受 / 阻塞

### 发现的问题
- [严重级别] 问题描述
  - 文件：path/to/file
  - 原因：...
  - 建议：...
```

若为"阻塞"，停止并要求修复后重新审核，不进入人工审核。

## Step 4：人工代码审核

人工审核针对**代码 diff 本身**，不涉及 MR/PR 创建（MR 由 D7 上线/发版阶段负责）。

输出给人工评审人的审核摘要：

- 变更目的
- 核心修改文件清单
- AI 审核结论
- 需要人工重点关注的问题
- D3 有条件通过时的待跟踪项落实情况

人工评审人阅读摘要后，在当前会话中给出结论：

```
人工审核结论：通过 / 需修改
评审人：{姓名}
意见：{可选}
```

若结论为"需修改"，停止并要求修复后重新进行 D5；不推进 D6。

## Step 5：记录审核结果

在 `openspec/changes/<change-name>/review.md` 追加 D5 代码评审记录：

```markdown
### D5 Code Review

**日期**：{日期}
**评审人**：{评审人}
**AI 审核结论**：{通过 / 有问题但可接受 / 阻塞}
**人工审核结论**：{通过 / 需修改}

#### 发现的问题
| 严重级别 | 文件 | 问题 | 状态 |
|----------|------|------|------|
| 高 | ... | ... | 待修复 |

#### 结论
- 两类审核均通过后，D5 完成
- 若任一审核未通过，保持在 D5，修复后重新审核
```

## Step 6：推进 D6

当且仅当以下条件同时满足时推进 D6：
- AI 代码审核通过
- 人工代码审核通过
- D3 有条件通过的待跟踪项已确认落实

更新 `.sdd/sdd-context.md`（只修改以下字段，禁止写入其他内容）：

```text
当前阶段: D6
```

输出进度块（按根 SKILL.md 的进度块规则，D1-D5 标 ✅，D6 标 ▶️），然后输出：

```
✅ D5 代码评审完成

AI 审核：通过
人工审核：通过

直接说"继续"或"开始测试"即可。
```

## 语言规范文件

### references/java-cr-rules.md
- 变量命名、异常处理、事务边界、空值处理、集合遍历、日志规范

### references/php-cr-rules.md
- Laravel/ThinkPHP 常见实践、请求校验、控制器职责、异常输出、SQL 安全

### references/python-cr-rules.md
- 函数职责、类型标注、异常捕获、日志、资源释放、可读性

### references/react-cr-rules.md
- 组件拆分、状态管理、Hooks 依赖、props 校验、异步处理、性能优化

## 边界与注意事项

- D5 审的是代码 diff 本身，不是方案文档，也不涉及 MR/PR 创建
- AI 审核必须先做，阻塞时不进入人工审核
- 人工审核在当前会话中给出结论即可，不需要打开 GitLab/阿里 Code 操作
- D3 的待跟踪项在 D5 必须再核对一次是否真正落地
- 规则文件是语言级规范入口，后续可替换成更细的规范 skill
- MR 创建由 D7 上线/发版阶段统一负责
