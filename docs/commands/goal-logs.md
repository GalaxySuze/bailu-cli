# bailu goal logs

查看 `goal-runner` 的运行日志。日志记录每次唤醒的决策、Claude 调用、状态变化。

## 用法

```bash
bailu goal logs [options]
```

## 选项

| 选项 | 说明 | 默认 |
|------|------|------|
| `-f, --follow` | 实时跟随（`tail -f`） | `false` |
| `-n, --lines <n>` | 末尾行数 | `80` |

## 日志位置

```
~/.bailu-goal/goal-runner.log
```

每次 launchd 唤醒或 `bailu goal run` 都会追加日志。

## 输出示例

### 末尾 80 行

```bash
bailu goal logs
```

```
========== [2026-06-09 11:30:00] Wakeup ==========
[11:30:00] PROJECT_DIR=/Users/kangkang/Code/AIAgent/bailu-cli
[11:30:00] Check lock ... no lock, proceed
[11:30:00] Check claude CLI ... OK (2.1.0)
[11:30:01] Read state.json ... status=RUNNABLE, round=5
[11:30:01] Decision: invoke claude
[11:30:01] Acquire lock ~/.bailu-goal/goal-runner.lock (pid=23456)
[11:30:01] Spawn claude with prompt from bailu-goal Skill
... ...
[11:38:42] claude exit code: 0
[11:38:42] Read state.json after run ... status=RUNNABLE, round=6
[11:38:42] Release lock
========== [2026-06-09 11:38:42] Done ==========

========== [2026-06-09 12:00:00] Wakeup ==========
[12:00:00] Check lock ... no lock, proceed
[12:00:00] Read state.json ... status=COMPLETED
[12:00:00] Decision: completed, notify and exit
[12:00:00] osascript notify: 白鹿 Goal 已完成 🎉
========== [2026-06-09 12:00:01] Done ==========
```

### 实时跟随

```bash
bailu goal logs -f
```

适合：
- 装 launchd 之后想看下一次唤醒发生了什么
- 调试 runner 决策逻辑
- 看 Claude 实际输出

按 `Ctrl+C` 退出跟随。

### 只看最近 20 行

```bash
bailu goal logs -n 20
```

## 日志解读

| 日志关键字 | 含义 |
|------------|------|
| `========== Wakeup ==========` | 一次 runner 启动 |
| `Check lock` | 检查锁文件 |
| `Check claude CLI` | 检查 Claude 可用性 |
| `Decision: <action>` | runner 决策（continue / skip / completed / blocked） |
| `Spawn claude` | 真正调用 Claude |
| `claude exit code` | Claude 退出码 |
| `Release lock` | 释放锁 |
| `========== Done ==========` | 一次 runner 结束 |

## 常见决策

| Decision | 含义 |
|----------|------|
| `invoke claude` | 调用 Claude 推进 |
| `skip: lock held` | 已有 runner 在执行，跳过 |
| `skip: completed` | 目标已完成，跳过 |
| `skip: blocked` | 状态是 BLOCKED，跳过 |
| `skip: claude unavailable` | Claude CLI 不可用，跳过 |
| `notify: completed` | 通知用户完成 |
| `notify: failed` | 通知用户失败 |

## 与其他命令的关系

- 看状态汇总 → [`bailu goal status`](./goal-status)
- 跑一轮看实时输出 → [`bailu goal run`](./goal-run)
- 看 `.goal/runner.log`（项目级日志） → 直接 `cat .goal/runner.log`
