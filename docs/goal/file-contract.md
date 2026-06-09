# .goal/ 目录契约

`.goal/` 是无人值守的唯一事实源。这一页详解每个文件的用途、模板、读写规则。

## 目录结构

```
.goal/
├── current.md         ← 目标契约（最高依据）
├── state.json         ← 机器可读状态
├── progress.md        ← 人类可读进度
├── blockers.md        ← 阻塞清单
├── verification.log   ← 验证记录
├── handoff.md         ← 交接摘要
├── runner.log         ← runner 日志（项目级）
└── snapshots/         ← 关键 diff / 截图 / 验收快照
```

## current.md

**作用**：固化目标、范围、完成条件、中止条件、每轮规则。AI 每次唤醒都必须先读。

### 完整模板

```markdown
# Goal: <一句话目标标题>

## 目标

<2-3 句话说明要做什么，为什么做>

## 范围

- 允许修改 <具体路径>
- 允许修改 <具体路径>
- 允许补充测试、文档、CHANGELOG
- 不允许修改 <具体路径>
- 不允许修改发布凭证
- 不允许修改用户全局配置
- 不允许跳过失败测试直接标记完成

## 完成条件

- <客观、可验证的条件 1>
- <客观、可验证的条件 2>
- npm test 通过
- npm run build 通过
- <冒烟测试通过>
- 当前执行器完成自检，或用户手动确认无 P0/P1 问题

## 每轮执行规则

- 每轮只选择 1-3 个最小原子任务
- 修改代码前，先在 .goal/progress.md 记录本轮计划
- 每完成一个原子任务，运行相关最小验证
- 验证失败时，不允许把任务标记为完成
- 本轮结束必须更新 .goal/state.json、.goal/progress.md 和 .goal/verification.log

## 中止条件

- 遇到需要用户决策的产品取舍
- 连续 3 次同一测试失败
- Git 工作区出现非本目标变更冲突
- Token 或 quota 不足
- 上下文无法可靠恢复
- 当前选定的 AI CLI 不可用

## 最终声明

只有完成条件全部满足，且当前执行器完成自检或用户手动确认无 P0/P1 问题时，才允许写入：

`GOAL_COMPLETED`
```

### 写好 current.md 的关键

| 要素 | 好示例 | 坏示例 |
|------|--------|--------|
| 目标 | "为 reset 命令补单元测试，覆盖率 ≥ 80%" | "把代码搞好" |
| 范围 | "允许改 src/reset.js 和 test/reset.test.js" | "允许改代码" |
| 完成条件 | "npm test 通过 + 覆盖率 ≥ 80%" | "感觉差不多就行" |
| 中止条件 | "连续 3 次同一测试失败" | "出问题就停" |

**核心原则**：完成条件必须**客观、可验证、可重复**。

## state.json

**作用**：机器可读状态，runner 决策依据。**唯一可被脚本快速读写的文件**。

### 完整字段

```json
{
  "status": "RUNNABLE",
  "agent": "claude",
  "round": 4,
  "lastStartedAt": "2026-06-09T10:30:00+08:00",
  "lastFinishedAt": "2026-06-09T10:42:00+08:00",
  "consecutiveFailures": 0,
  "lastVerification": "PASS",
  "nextAction": "continue_goal",
  "updatedAt": "2026-06-09T10:42:00+08:00"
}
```

字段详细解释参见 [状态机详解](./state-machine)。

### 读写规则

- **runner 读**：决策是否调用 AI
- **AI 写**：每轮结束必须更新 status / round / lastFinishedAt / consecutiveFailures / lastVerification
- **人写**：人工介入时直接编辑（如把 BLOCKED 改回 RUNNABLE）

## progress.md

**作用**：人类可读进度。让你醒来打开就能看懂"昨晚 AI 做了什么"。

### 每轮模板

```markdown
## 2026-06-09 10:30 · Round 4

本轮计划：
- <计划 1>
- <计划 2>
- <计划 3>

完成情况：
- ✓ <结果 1>
- ✓ <结果 2>
- ✗ <失败的事项及原因>

状态切换：RUNNABLE → RUNNING → RUNNABLE
```

### 写入规则

- **AI 写**：每轮开始追加"本轮计划"，每轮结束追加"完成情况"和"状态切换"
- **追加不覆盖**：永远不删历史记录
- **`GOAL_COMPLETED` 标记**：完成时追加一行 `GOAL_COMPLETED`

## blockers.md

**作用**：阻塞原因、人工介入事项、决策请求。

### 模板

```markdown
## 2026-06-09 11:20

发现 reset 命令需要决定：
- 选项 A：保留 .sdd/ 目录（保守）
- 选项 B：清理 .sdd/ 目录（彻底）

涉及产品取舍，需要用户决策后才能继续。
```

### 写入规则

- **AI 写**：遇到需要人工决策时追加
- **人写**：决策后追加"决策记录"，然后改 `state.json` 回 RUNNABLE
- **`bailu goal stop --reason "xxx"`** 会自动追加

## verification.log

**作用**：测试、构建、启动验证的输出摘要。让完成判断可追溯。

### 模板

```
[2026-06-09 10:42] Round 4 verification
─────────────────────────────────────────
Command: npm test -- --testPathPattern=reset
Exit code: 0
Pass: 14/14 (覆盖率 82%)

[2026-06-09 11:15] Round 5 verification
─────────────────────────────────────────
Command: npm run build
Exit code: 0
Build time: 12.3s
```

### 写入规则

- **AI 写**：每轮验证后追加
- **追加不覆盖**

## handoff.md

**作用**：上下文压缩或切换执行器时的交接摘要。

### 模板

```markdown
## 2026-06-09 11:30 · Claude → Codex

切换原因：Claude token 紧张

当前进度：
- Round 5 已完成
- 已通过 14/14 测试
- 待办：补 reset 对 .sdd/ 的清理逻辑（见 progress.md Round 6 计划）

关键文件：
- packages/cli/src/v2/commands/reset.js
- packages/cli/test/v2/commands/reset.test.js

约束提醒：
- 不要改其他命令
- 不要修改 package.json 依赖
```

### 写入规则

- **AI 写**：切换执行器或上下文压缩前
- **人写**：可选

## runner.log

**作用**：runner 层面的项目级日志。和 `~/.bailu-goal/goal-runner.log` 不同——后者是全局日志，前者是该项目专属。

### 内容

```
[2026-06-09 10:00:00] Wakeup, status=RUNNABLE, decision=invoke claude
[2026-06-09 10:42:18] Claude exit code 0, new status=RUNNABLE
[2026-06-09 10:42:18] Round 4 → 5
```

### 写入规则

- **runner 写**：每次唤醒追加

## snapshots/

**作用**：关键计划、diff、截图、验收记录的快照。便于事后审计。

### 推荐内容

```
snapshots/
├── round-1-plan.md       ← Round 1 的完整计划
├── round-3-diff.patch    ← Round 3 的 git diff
├── round-7-screenshot.png ← UI 改动截图
└── final-verification.md  ← 最终验收报告
```

### 写入规则

- **AI 写**：每轮可选追加关键产物
- **人写**：可手动放评审材料

## 文件权限

`bailu goal init` 创建的所有文件都是普通文本，权限 `0644`。**不要**对它们设特殊权限，runner 和 AI 都需要读写。

## 是否应该提交 .goal/ 到 git？

**建议提交**。理由：

- 失败时方便回滚到之前的"目标契约"
- 团队成员能看到当前正在推进的目标
- AI 历史决策可追溯，便于审计

但**注意排除大型 snapshots**：

```text
# .gitignore
.goal/snapshots/*.png
.goal/snapshots/*.patch
.goal/runner.log
```

或者干脆都不提交（添加 `.goal/` 到 `.gitignore`），全部当临时产物。

## 下一步

- [状态机详解](./state-machine)
- [launchd 集成](./launchd)
- [多执行器策略](./multi-agent)
