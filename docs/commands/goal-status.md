# bailu goal status

查看 `.goal/` 当前状态、Claude CLI 可用性、最近进度。这是无人值守模式下**最常用**的检查命令。

## 用法

```bash
bailu goal status
```

## 输出内容

`bailu goal status` 会展示：

1. **状态字段**：`.goal/state.json` 的关键字段（status / agent / round / consecutiveFailures 等）
2. **环境检测**：Claude CLI 是否可用、launchd 是否安装
3. **最近进度**：`.goal/progress.md` 末尾若干行
4. **阻塞**：`.goal/blockers.md` 是否非空

## 输出示例

### 运行中

```
🎯 白鹿 Goal 状态

  状态:           RUNNABLE（可继续执行）
  当前执行器:     claude
  当前轮次:       4
  连续失败:       0
  最近验证:       PASS
  上次完成:       2026-06-09 10:42:18

  环境:
    Claude CLI:   ✓ 2.1.0
    launchd:      ✓ 已安装 (1800s 间隔)

  最近进度 (.goal/progress.md 末尾 20 行)：
  ──────────────────────────────────────
  ## 2026-06-09 10:42 · Round 4

  本轮计划：
  - 修复 reset 命令对 MCP 的清理逻辑
  - 补全 reset 单元测试
  - 跑 npm test 验证

  完成情况：
  - ✓ 修复完成，MCP 清理已加 .bak 备份保护
  - ✓ 新增 3 个测试用例
  - ✓ npm test 通过 (14/14)

  状态切换：RUNNABLE → RUNNING → RUNNABLE
  ──────────────────────────────────────

  无阻塞。
```

### 已完成

```
🎯 白鹿 Goal 状态

  状态:           COMPLETED（目标已完成）✅
  当前执行器:     claude
  当前轮次:       12
  最近验证:       PASS
  完成时间:       2026-06-09 14:30:00

  目标达成，runner 已自动停止。可以运行：
    bailu goal uninstall-launchd  # 卸载守护
    rm -rf .goal                  # 清理状态文件（可选）
```

### 被阻塞

```
🎯 白鹿 Goal 状态

  状态:           BLOCKED（已暂停，需人工介入）⚠️
  当前执行器:     claude
  当前轮次:       3
  连续失败:       2

  阻塞原因 (.goal/blockers.md)：
  ──────────────────────────────────────
  ## 2026-06-09 11:20

  发现 reset 命令需要决定：
  - 选项 A：保留 .sdd/ 目录（保守）
  - 选项 B：清理 .sdd/ 目录（彻底）

  这涉及产品取舍，需要用户决策后才能继续。
  ──────────────────────────────────────

  下一步：
    → 编辑 .goal/current.md 给出决策
    → 把 .goal/state.json 的 status 改回 RUNNABLE
    → 或运行 bailu goal stop --reason "暂时搁置"
```

## 状态枚举

| 状态 | 含义 |
|------|------|
| `INIT` | 刚初始化 |
| `RUNNABLE` | 可继续执行 |
| `RUNNING` | 正在执行 |
| `TOKEN_LOW` | token/quota 不足 |
| `CONTEXT_NEEDS_COMPACT` | 上下文需压缩 |
| `BLOCKED` | 需人工介入 |
| `VERIFYING` | 等待验证 |
| `REVIEW_NEEDED` | 需阶段复查 |
| `COMPLETED` | 目标完成 ✅ |
| `FAILED_NEEDS_HUMAN` | 自动化失败 ❌ |

详细解读参见 [状态机详解](/goal/state-machine)。

## 与其他命令的关系

- 查看 runner 日志 → [`bailu goal logs`](./goal-logs)
- 手动跑一轮 → [`bailu goal run`](./goal-run)
- 软暂停 → [`bailu goal stop`](./goal-stop)
