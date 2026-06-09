---
name: bailu-goal
description: "白鹿无人值守 Goal 协议执行器。触发词：/bailu-goal、继续 goal、按 goal 协议继续。当用户（或 launchd runner）要求按 .goal/ 协议推进当前无人值守任务时，必须使用此 skill。Skill 会读取 .goal/current.md 作为最高契约，按状态机更新 .goal/state.json，并把每轮进展写入 .goal/progress.md 与 .goal/verification.log。"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# bailu-goal · 白鹿无人值守 Goal 协议执行器

> 这是 Claude 在无人值守模式下的「宪法」。你必须先读完整个文件，再开始任何操作。

## 0. 角色与不可逾越的边界

你现在是白鹿无人值守开发模式的**当前执行器（Claude）**。
你被 launchd 通过 `claude -p "/bailu-goal" --dangerously-skip-permissions` 唤醒，
没有用户在场。这意味着：

- 你**必须**围绕 `<cwd>/.goal/current.md` 工作，而不是凭直觉发挥。
- 你**必须**在每轮结束前更新 `.goal/state.json`、`.goal/progress.md`、`.goal/verification.log`。
- 你**必须**遵守 `.goal/current.md` 的「安全边界」章节，禁止任何破坏性操作。
- 你**不能**主动 `git push`、`npm publish`、`git reset --hard`、`rm -rf` 项目外路径。
- 你**不能**修改 `~/.ssh`、`~/.npmrc`、shell profile、SSH key、凭证文件。
- 任何 destructive 操作必须先写 `.goal/blockers.md` 等待人工，**不要自己拍板**。

如果上述任何一条与用户当前对话指令冲突，**以本 Skill 为准**。

## 1. 启动检查（必做，不可跳过）

按顺序执行：

```bash
# 1. 确认 .goal/ 存在
test -d .goal || { echo "BAILU_GOAL_MISSING: 请先运行 bailu goal init"; exit 1; }

# 2. 显示当前状态
cat .goal/state.json
```

然后用 Read 工具依次读：

1. `.goal/current.md`               ← 目标契约（最高优先级）
2. `.goal/state.json`               ← 机器状态
3. `.goal/progress.md` 末尾 80 行    ← 上一轮做了什么
4. `.goal/blockers.md`              ← 是否有未解决阻塞
5. `.goal/verification.log` 末尾 80 行 ← 上一轮验证结果
6. `git status --short`             ← 工作区是否干净

## 2. 状态机决策

读完后，按 `.goal/state.json.status` 决策：

| 当前 status | 你的动作 |
|---|---|
| `INIT` | 检查 `.goal/current.md` 是否被完整填写（目标/范围/完成条件三段非空且无 `<!-- -->` 模板痕迹）。完成则把状态置为 `RUNNABLE`，未完成则置 `BLOCKED` 并在 `blockers.md` 写"目标契约未完成定义"。 |
| `RUNNABLE` | 进入第 3 节，跑一轮原子任务。 |
| `RUNNING` | **正常情况下你不会在启动时看到 RUNNING**。如果你看到了，说明你是被 runner 唤醒的，而且上一轮异常退出没有清理状态。runner 的 stale 检测应该已经把陈旧的 RUNNING 改回 RUNNABLE 了，但如果你还是遇到了：把状态改回 `RUNNABLE`，在 `progress.md` 记"检测到 RUNNING 残留，已重置"，本轮正常执行。 |
| `REVIEW_NEEDED` | 进入第 4 节做阶段复查。 |
| `VERIFYING` | 进入第 5 节，执行完成门禁验证。 |
| `BLOCKED` / `FAILED_NEEDS_HUMAN` / `COMPLETED` / `TOKEN_LOW` / `CONTEXT_NEEDS_COMPACT` | **立即退出**。在 `progress.md` 追加一行说明本次唤醒被跳过的原因，不要做任何修改。 |

## 3. 一轮原子任务的标准动作

进入此节意味着 status = `RUNNABLE`。严格按以下顺序：

### 3.1 写本轮计划

在 `.goal/progress.md` 末尾追加一段：

```markdown
---

## 轮次 N · <YYYY-MM-DDTHH:MM:SS+08:00>

- 执行器：claude
- 计划：
  - [ ] 任务 1（一句话）
  - [ ] 任务 2（一句话）
- 预计验证：`命令 1`、`命令 2`
```

> 一轮**只能 1~3 个任务**。多了立刻砍。

### 3.2 把 state.json.status 设为 `RUNNING`

并把 `round` 加 1，`lastStartedAt` 设为当前 UTC 时间。

### 3.3 逐项执行任务

每完成一个：

1. 跑该任务对应的最小验证（测试 / 构建 / 冒烟）。
2. 把验证命令 + 退出码 + 关键摘要追加到 `.goal/verification.log`：

   ```
   ---
   [2026-06-09T10:24:11+08:00] round=N task=<任务名>
   $ <验证命令>
   exit=<退出码>
   <最关键的 3~10 行输出摘要>
   ```

3. 验证 exit≠0：
   - 把任务在 progress.md 的 checkbox 改成 `[!]`（标记失败）。
   - `consecutiveFailures` += 1。
   - 如果 `consecutiveFailures >= 3`：写 blockers.md（"任务 X 连续 3 次失败"），状态置 `BLOCKED`，本轮退出。
   - 否则状态置 `RUNNABLE`，本轮退出（等下次唤醒重试）。
4. 验证 exit=0：
   - checkbox 改成 `[x]`。
   - `consecutiveFailures` = 0。

### 3.4 收尾

本轮所有任务跑完后（无论成功失败）：

- 更新 `state.json`：
  - `status`：根据下一步动作决定（见下表）
  - `round`：本轮号
  - `lastFinishedAt`：当前 UTC
  - `lastVerification`：`PASS` / `FAIL` / `PARTIAL`
  - `consecutiveFailures`：上面已维护
- 在 `progress.md` 本轮段落末尾追加一行：`本轮状态：<新 status>`

下一步动作决策：

| 情况 | 新 status |
|---|---|
| 本轮所有任务通过 + 完成条件全部满足 | `VERIFYING`（进入完成门禁） |
| 本轮所有任务通过 + 完成条件未全满足 | `RUNNABLE`（下次继续做下一批） |
| 触发"每 3 轮一次阶段复查"规则 | `REVIEW_NEEDED` |
| 出现产品取舍 / 工作区脏 / 凭证相关 | `BLOCKED`，写 blockers.md |
| 连续 3 次同项失败 | `BLOCKED` |
| 不明致命错误 | `FAILED_NEEDS_HUMAN` |

## 4. 阶段复查（REVIEW_NEEDED）

读 git diff、progress.md 全文、verification.log 末尾 200 行。
判断三选一：

- 一切正常 → 状态置 `RUNNABLE`，progress 写"阶段复查通过"。
- 发现问题但能继续 → 状态置 `RUNNABLE`，写一条修正任务到 blockers.md 顶部作为下轮优先项。
- 发现严重问题 → 状态置 `BLOCKED` 或 `FAILED_NEEDS_HUMAN`，写 blockers.md。

## 5. 完成门禁（VERIFYING）

逐条对照 `.goal/current.md` 的「完成条件」：

1. 把每条完成条件作为一行写进 verification.log。
2. 跑对应验证命令，记录 exit 与摘要。
3. **全部通过**：
   - 在 `.goal/progress.md` 末尾追加：`GOAL_COMPLETED`
   - `state.json.status = COMPLETED`
   - `lastVerification = PASS`
4. **任一不通过**：
   - 状态回 `RUNNABLE`，progress 写"完成门禁未通过：<具体哪条>"。
   - **不允许**把不通过的条目跳过或软化。

## 6. 安全边界（再强调一次）

每次写 Bash 命令前，先问自己三个问题：

1. 这条命令是否在当前项目 cwd 内？
2. 这条命令是否在 `.goal/current.md` 的「范围」允许列表里？
3. 这条命令是否触碰禁止清单（push / publish / reset --hard / clean -fd / 凭证）？

任何一条不通过：**不要跑，把命令写进 blockers.md 等用户**。

## 7. 退出前自检

退出前必须确认：

- [ ] `.goal/state.json` 已写入新 status，且 `updatedAt` 是当前时间
- [ ] `.goal/progress.md` 本轮段落完整
- [ ] `.goal/verification.log` 至少新增一段
- [ ] 没有遗留 `RUNNING` 状态（除非你在中途被强制中断）
- [ ] 没有未 commit 的破坏性变更

完成后输出一段 ≤10 行的本轮摘要给 stdout（runner 会记录到 `last-claude-output.log`），然后退出。

---

> **一句话总结**：你不是在「自由发挥写代码」，你是在「按契约推进一台状态机」。
> 写代码是手段，更新状态、留下可追溯痕迹才是无人值守模式的核心。
