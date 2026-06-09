# bailu goal run

手动跑一轮 Goal 协议。**完整复用 launchd 路径的执行逻辑**，让 runner 走完整决策链：检查锁文件 → 检查 Claude CLI → 读 state.json → 决策 → 调用 Claude → 写回状态。

## 用法

```bash
bailu goal run [options]
```

## 选项

| 选项 | 说明 | 默认 |
|------|------|------|
| `--dry-run` | 只走决策不真正调用 Claude，便于调试 | `false` |
| `--timeout <seconds>` | 单次执行超时（秒） | `1500` |

## 什么时候用

- **首次试运行**：装 launchd 之前验证 `.goal/current.md` 写得对不对
- **手动推进**：不想等 launchd 唤醒，立刻跑一轮
- **调试**：用 `--dry-run` 看 runner 的决策逻辑

## 输出示例

### 正常执行

```
🎯 启动 Goal Runner（手动模式）

  项目根:        /Users/kangkang/Code/AIAgent/bailu-cli
  当前状态:      RUNNABLE
  当前执行器:    claude
  锁文件:        ~/.bailu-goal/goal-runner.lock

  [10:42:18] 检查 Claude CLI ... ✓
  [10:42:18] 读取 .goal/state.json ... status=RUNNABLE
  [10:42:18] 决策: 继续执行
  [10:42:19] 调用 Claude（最长 1500s）...

  ──────────────────────────────────────
  本轮 Claude 输出（实时）
  ──────────────────────────────────────
  [Claude] 读取 .goal/current.md ...
  [Claude] 读取 .goal/state.json (status=RUNNABLE, round=3)
  [Claude] 本轮计划：补全 reset 命令的 MCP 清理逻辑
  ... ...
  ──────────────────────────────────────

  [10:48:32] Claude 执行完毕，耗时 6m14s
  [10:48:32] 读取最新 state.json ... status=RUNNABLE
  [10:48:32] 最近验证: PASS
  [10:48:32] 连续失败: 0

  ✅ 本轮完成。下一步：
     - 查看进度：bailu goal status
     - 继续推进：bailu goal run（或等 launchd 自动唤醒）
```

### Dry Run

```bash
bailu goal run --dry-run
```

```
🎯 启动 Goal Runner（DRY RUN 模式）

  当前状态:      RUNNABLE
  会做的决策:    调用 Claude
  Claude CLI:    ✓ 2.1.0
  超时:          1500s

  （未真正调用 Claude）

  如要真正执行，去掉 --dry-run。
```

### 锁冲突

```
🎯 启动 Goal Runner（手动模式）

  ⚠ 锁文件已存在：~/.bailu-goal/goal-runner.lock
  ⚠ 进程 PID 12345 仍在运行

  当前已有 runner 在执行，跳过本次。
  如需强制：
    rm ~/.bailu-goal/goal-runner.lock
    bailu goal run
```

### 状态不可执行

```
🎯 启动 Goal Runner（手动模式）

  当前状态: COMPLETED
  ✓ 目标已完成，runner 不会执行。

  如需重新开始：
    1. 编辑 .goal/state.json 把 status 改回 RUNNABLE
    2. 或 bailu goal init --force 重新初始化
```

## 工作原理

`bailu goal run` 实质是：

1. 把 `packages/cli/assets/goal/goal-runner.sh` 复制到 `~/.bailu-goal/goal-runner.sh`
2. 同步前台执行该脚本
3. 等待完成或超时

这样做的好处是：**手动跑和 launchd 自动跑用同一份代码**，不会出现"手动能跑、自动跑出问题"的漂移。

## 与其他命令的关系

- 准备 `.goal/` → [`bailu goal init`](./goal-init)
- 查看结果 → [`bailu goal status`](./goal-status)
- 进入无人值守 → [`bailu goal install-launchd`](./goal-install-launchd)
- 查看日志 → [`bailu goal logs`](./goal-logs)
