# 多执行器策略

Goal 协议设计为**文件级共享**。Claude 和 Codex 都可以独立读取 `.goal/` 并继续任务，但不要求两者固定分工。

## 基本原则

```
Claude 可以独立跑完整 Goal
Codex 可以独立跑完整 Goal
两者共享 .goal/ 协议，但不要求互相接力
```

为什么不强制双工具协作：

- 当前 token 消耗有限，强行引入双工具会增加额外上下文成本
- Claude 与 Codex 的能力边界会随版本变化，过早固化分工容易让流程变重
- 对无人值守来说，最重要的是共享状态协议，而不是指定哪个工具负责哪一步
- 任何一个工具只要遵守 `.goal/current.md` + `.goal/state.json` + `.goal/progress.md`，就可以独立完成执行 + 验证 + 收尾

## 工具选择策略

| 场景 | 推荐方式 |
|------|----------|
| Claude 当前可用且 `/goal` 稳定 | 用 Claude 执行完整 Goal |
| Claude token/quota 紧张 | 暂停 Claude，改用 Codex 接着 `.goal/` 继续 |
| Codex 当前上下文更完整 | 用 Codex 执行完整 Goal |
| 某个工具连续失败 | 切换另一个工具，但必须先读取 `.goal/` |
| 两个工具都可用 | 仍然只选一个当前执行器，避免并发改同一仓库 |

## 切换执行器

### 切换步骤

```bash
# 1. 让当前执行器把状态写干净
bailu goal stop --reason "切换到 Codex"

# 2. 编辑 .goal/state.json，把 agent 字段改了
#   "agent": "claude"  →  "agent": "codex"

# 3. 在 .goal/handoff.md 追加交接记录
cat >> .goal/handoff.md <<EOF
## $(date +"%Y-%m-%d %H:%M") · Claude → Codex

切换原因：<原因>
当前进度：<参见 progress.md Round N>
关键文件：<列出>
约束提醒：<列出>
EOF

# 4. 把 state.json 的 status 改回 RUNNABLE

# 5. 跑一轮验证
bailu goal run
```

### 交接前必读清单

切换执行器前，新执行器必须先：

```text
1. 读取 .goal/current.md          ← 理解目标
2. 读取 .goal/state.json          ← 当前状态
3. 读取 .goal/progress.md 末尾 80 行   ← 最近进展
4. 读取 .goal/blockers.md         ← 是否有阻塞
5. 读取 .goal/verification.log 末尾 80 行 ← 最近验证
6. 查看 git status --short        ← 工作区
7. 在 .goal/progress.md 记录"切换执行器"的时间、原因和新执行器
```

`bailu-goal` Skill 已经内置了这套流程，新执行器自动会读这些文件。

## 当前执行器唤醒模板

无论是 Claude 还是 Codex，唤醒时都用同一套自然语言指令：

```text
读取 <项目根>/.goal/current.md，并按其中目标继续推进。

每轮必须执行：
1. 读取 .goal/state.json、.goal/progress.md、.goal/blockers.md。
2. 判断当前状态：
   - COMPLETED：退出。
   - BLOCKED / FAILED_NEEDS_HUMAN：退出并通知。
   - RUNNABLE / TOKEN_LOW 已恢复：继续。
3. 本轮只选择 1-3 个最小原子任务。
4. 修改代码前记录计划到 progress.md。
5. 每完成一个原子任务，运行相关最小验证。
6. 不允许跳过失败验证标记完成。
7. 如果遇到产品决策、权限问题、连续失败、上下文不足，写 blockers.md 并设置状态。
8. 本轮结束必须更新 state.json、progress.md、verification.log。

完成条件以 .goal/current.md 为准。
```

如果当前执行器是 Claude 并且 `/goal` 可用，可以包进 `/goal`：

```text
/goal "读取 .goal/current.md，并按 Goal 协议继续推进。每轮只做 1-3 个原子任务，结束前更新 .goal/state.json、.goal/progress.md 和 .goal/verification.log。"
```

如果当前执行器是 Codex，直接使用同一套自然语言指令。

## 不要并发

即使两个工具都可用，**同一时刻只让一个跑**。理由：

- 两个 AI 同时改同一个仓库 → 冲突几乎必然
- state.json 不是并发安全的 → 两端都改会丢更新
- 锁文件机制只对 runner 有效，对人工调用的 AI 没有保护

如果非要并发，必须为每个 AI 准备**独立的 .goal/ 目录**（比如 `.goal-frontend/` 和 `.goal-backend/`），且对应不同的子任务范围。

## 验证：切换是否成功

```bash
# 1. 看新执行器是否更新了 state.json
cat .goal/state.json
# 检查 "agent" 字段已切换、"updatedAt" 是最新时间

# 2. 看 progress.md 是否记录了切换
tail -30 .goal/progress.md
# 应该看到 "## YYYY-MM-DD HH:MM · Round N（切换到 codex）"

# 3. 看新执行器的产出
git diff --stat
```

## 下一步

- [安全边界](./safety)
- [常见问题](./faq)
