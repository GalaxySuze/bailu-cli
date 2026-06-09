# /bailu-goal

> 白鹿无人值守 Goal 协议入口。供 launchd runner 和用户手动触发共用。

## 触发后必须做什么

加载并严格执行 `bailu-goal` Skill 中定义的全部流程，包括：

1. 启动检查（读取 `.goal/current.md`、`.goal/state.json`、`.goal/progress.md`、`.goal/blockers.md`、`.goal/verification.log`、`git status`）。
2. 按状态机做决策。
3. 一轮只做 1~3 个原子任务。
4. 每个任务跑最小验证，并把结果落到 `.goal/verification.log`。
5. 任何失败 → 把任务标 `[!]`，根据 `consecutiveFailures` 决定 `RUNNABLE` 或 `BLOCKED`。
6. 收尾：更新 `state.json`、`progress.md`、`verification.log`，输出 ≤10 行摘要。

## 禁止

- 自由发挥写大段代码而不更新 `.goal/`。
- 跳过失败验证标记完成。
- 任何 destructive 操作（git push / npm publish / git reset --hard / git clean -fd）。
- 修改 `.goal/current.md` 的「目标」「完成条件」「安全边界」三节（这是用户契约，不是你能改的）。

## 使用方式

```text
/bailu-goal
```

无参数。后台 runner 通过 `claude -p "/bailu-goal" --dangerously-skip-permissions` 自动调用，
用户也可以在 Claude Code 交互窗口手动输入 `/bailu-goal` 触发一次。

## 触发词

也可以直接说：
- 继续 goal
- 按 goal 协议继续
- 推一轮无人值守
