# 五层架构

Goal 无人值守由五层组成，每一层职责单一、可独立替换。

## 总体结构

```
┌────────────────────────────────────────────────────────────┐
│  1. Goal Spec          .goal/current.md                    │
│     目标、范围、完成条件、中止条件                          │
├────────────────────────────────────────────────────────────┤
│  2. State Store        .goal/state.json + progress.md      │
│     机器可读状态 + 人类可读进度                             │
├────────────────────────────────────────────────────────────┤
│  3. Runner             ~/.bailu-goal/goal-runner.sh        │
│     launchd 定时唤醒，决定是否调用 AI                       │
├────────────────────────────────────────────────────────────┤
│  4. Agent Runtime      Claude                              │
│     按 bailu-goal Skill 执行 1-3 个原子任务（未来支持 Codex 等）│
├────────────────────────────────────────────────────────────┤
│  5. Verification Gate  npm test / build / 自检             │
│     通过测试、审查、验收决定是否完成                       │
└────────────────────────────────────────────────────────────┘
```

## 数据流

```
人写目标
  ↓
.goal/current.md          ← 固化目标与验收条件
  ↓
launchd 定时唤醒（30 分钟一次）
  ↓
goal-runner.sh            ← 读 state.json 决策
  ├─ COMPLETED → 通知，退出
  ├─ BLOCKED → 通知，退出
  ├─ RUNNING → 跳过本次
  └─ RUNNABLE → 调用 Claude
        ↓
Claude 按 bailu-goal Skill 执行 1-3 个原子任务
  ↓
写回 progress / state / verification
  ↓
通过则 COMPLETED；失败则 BLOCKED 或 FAILED_NEEDS_HUMAN
```

## 各层详解

### 1. Goal Spec（目标契约）

文件：`.goal/current.md`

**职责**：固化目标、范围、完成条件、中止条件、每轮规则。

这是 AI 执行的最高依据。每次唤醒时 AI 都要先读 `current.md`，避免 prompt 漂移。

完整模板和写法参见 [.goal/ 目录契约](./file-contract)。

### 2. State Store（状态存储）

文件：`.goal/state.json` + `.goal/progress.md`

**职责**：
- `state.json`：机器可读，runner 决策依据
- `progress.md`：人类可读，便于醒来后快速看懂

#### state.json 示例

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

#### progress.md 示例

```markdown
## 2026-06-09 10:30 · Round 4

本轮计划：
- 修复 reset 命令的 MCP 清理逻辑
- 跑 npm test 验证

完成情况：
- ✓ 修复完成
- ✓ npm test 通过

状态切换：RUNNABLE → RUNNING → RUNNABLE
```

### 3. Runner（守护脚本）

文件：`~/.bailu-goal/goal-runner.sh`（由 `bailu goal install-launchd` 自动复制）

**职责**：
- 检查锁文件（避免并发）
- 检查 Claude CLI 可用性
- 检查网络 / 磁盘 / 电量
- 读取 `state.json` 决策
- 控制单次执行超时（默认 1500s）
- 写入 `~/.bailu-goal/goal-runner.log`
- 调用 macOS 通知

**不负责**：
- 直接理解业务需求
- 直接修改业务代码
- 替 AI 判断复杂产品取舍

### 4. Agent Runtime（AI 执行器）

当前仅支持 **Claude**（由 `CLAUDE_BIN` 环境变量指定）。
多执行器切换（Codex 等）规划在阶段 3，未实现。

**职责**：
- 读 `.goal/current.md`、`.goal/state.json`、`.goal/progress.md`、`.goal/blockers.md`
- 本轮只选 1-3 个最小原子任务
- 修改代码前记录计划到 `progress.md`
- 每完成一个原子任务运行最小验证
- 不允许跳过失败验证标记完成
- 本轮结束更新 `state.json`、`progress.md`、`verification.log`

这一层的具体行为由 **`bailu-goal` Skill** 定义（`bailu init` 安装到 `.claude/skills/bailu-goal/`）。

### 5. Verification Gate（验证门禁）

**每轮最小验证**：

- 改 CLI 命令 → 运行对应 CLI 测试
- 改 WebUI 组件 → 运行对应前端测试
- 改构建配置 → 运行 build
- 改服务启动逻辑 → 运行 bailu serve 冒烟

**最终完成门禁**（写 `GOAL_COMPLETED` 的条件）：

- `current.md` 中的完成条件全部满足
- 必要测试通过
- 构建通过
- 启动冒烟通过
- 当前执行器完成自检 或 用户手动确认无 P0/P1
- `verification.log` 有最终验收记录
- `state.json.status = COMPLETED`

## 设计原则

| 原则 | 体现 |
|------|------|
| 文件即真相 | 所有状态写在 `.goal/`，AI 重启后能恢复 |
| 机器可读优先 | runner 只认 `state.json`，不猜测自然语言 |
| 客观完成条件 | 必须可验证、可重复，不允许"差不多了" |
| 明确失败状态 | 任何失败都要落到明确状态，不留灰色地带 |
| 安全边界收窄 | 危险命令、自动 push、自动 publish 全禁 |

## 下一步

- [快速上手](./quick-start)
- [状态机详解](./state-machine)
- [.goal/ 目录契约](./file-contract)
