# 多执行器策略

::: warning 当前状态
**Goal 当前仅支持 Claude 作为执行器。** 多执行器切换（Codex 等其他 AI 工具）规划在阶段 3 路线图，**未实现**。

本页描述的是未来设计意图。如果你需要在多个 AI 工具之间协作，请直接交互使用，**不要**依赖 Goal 调度。
:::

## 当前能力

```
✅ Claude 作为唯一执行器，完整跑完 Goal
❌ Codex / 其他 AI 工具切换
❌ 多执行器接力
❌ .goal/state.json 的 agent 字段切换
```

`.goal/state.json` 里的 `agent` 字段当前固定为 `"claude"`，runner 也只会用 `CLAUDE_BIN` 唤醒 Claude。

## 为什么不并发

即使未来支持多执行器，**同一时刻也只让一个跑**。理由：

- 两个 AI 同时改同一个仓库，冲突几乎必然
- `state.json` 不是并发安全的，两端都改会丢更新
- 锁文件机制只对 runner 有效，对人工调用的 AI 没有保护

如果你真的需要并发协作，建议为每个 AI 准备**独立的 `.goal/` 目录**（比如 `.goal-frontend/` 和 `.goal-backend/`），并对应不同的子任务范围。

## 阶段 3 路线图（未实现）

未来计划支持的能力：

| 能力 | 设计意图 |
|---|---|
| `agent` 字段可切换 | 编辑 `.goal/state.json` 把 `"claude"` 改为 `"codex"` 后，runner 自动用对应执行器唤醒 |
| 交接协议 | `.goal/handoff.md` 记录切换原因，新执行器读取后接管 |
| 多执行器 runner | 根据 `agent` 字段选择 `CLAUDE_BIN` / `CODEX_BIN` / 等 |
| 共享 Skill 协议 | `bailu-goal` Skill 安装到所有支持的 AI 工具，行为一致 |

落地条件：

1. Claude 单执行器线已经稳定跑过 2~3 个真实 Goal 任务
2. Codex 或其他 AI 工具的 headless 模式（类似 `claude -p`）足够稳定
3. 对外的 launchd 调度协议在多 AI 场景下经过压测

如果你在用 Goal 过程中**有强烈的多执行器需求**，欢迎反馈具体场景，会作为推进阶段 3 的输入。

## 下一步

- [安全边界](./safety)
- [常见问题](./faq)
