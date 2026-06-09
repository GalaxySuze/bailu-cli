# 状态机详解

`.goal/state.json` 的 `status` 字段只允许使用 10 种状态。runner 根据 status 决策，AI 必须在每轮结束时更新 status。

## 状态枚举

| 状态 | 含义 | runner 行为 |
|------|------|-------------|
| `INIT` | 目标刚初始化 | 检查文件完整性后转为 `RUNNABLE` |
| `RUNNABLE` | 可以继续执行 | 调用当前选定执行器 |
| `RUNNING` | 当前已有任务在执行 | 跳过本次唤醒 |
| `TOKEN_LOW` | token/quota 不足 | 等待后续唤醒 |
| `CONTEXT_NEEDS_COMPACT` | 上下文需要压缩 | 尝试自动交接或提醒人工 |
| `BLOCKED` | 需要用户介入 | 通知用户并暂停 |
| `VERIFYING` | 等待审查或验证 | 调用执行器验证或等待用户确认 |
| `REVIEW_NEEDED` | 需要阶段复查 | 调用执行器复查或等待用户确认 |
| `COMPLETED` | 目标完成 ✅ | 通知用户并停止 |
| `FAILED_NEEDS_HUMAN` | 自动化失败 ❌ | 通知用户并停止 |

## 状态转换图

```
INIT
  │
  ▼
RUNNABLE ◄──────────────────────────────────────┐
  │                                              │
  ├──→ RUNNING                                   │
  │      │                                       │
  │      ├──→ RUNNABLE          （执行成功）     │
  │      ├──→ TOKEN_LOW        （配额不足）     │
  │      ├──→ CONTEXT_NEEDS_COMPACT（上下文过大）│
  │      ├──→ BLOCKED          （需人工介入）    │
  │      ├──→ REVIEW_NEEDED    （需阶段复查）    │
  │      └──→ FAILED_NEEDS_HUMAN（自动化失败）   │
  │                                              │
  ├──→ TOKEN_LOW               （启动前检测）    │
  ├──→ BLOCKED                 （启动前检测）    │
  ├──→ REVIEW_NEEDED           （启动前检测）    │
  └──→ COMPLETED               （验收通过）──────┘
                                     │
                                     │ 终态
                                     ▼
                                  COMPLETED

REVIEW_NEEDED
  ├──→ VERIFYING       （开始复查）
  ├──→ RUNNABLE        （复查通过）
  ├──→ COMPLETED       （复查确认完成）
  └──→ FAILED_NEEDS_HUMAN（复查失败）

VERIFYING
  ├──→ RUNNABLE        （验证未全过，需继续）
  ├──→ COMPLETED       （验证全过）
  └──→ FAILED_NEEDS_HUMAN（验证严重失败）

BLOCKED ──→ 需要人工处理 ──→ RUNNABLE

FAILED_NEEDS_HUMAN ──→ 需要人工处理 ──→ RUNNABLE 或 INIT
```

## 关键转换规则

### RUNNABLE → RUNNING

当 runner 唤醒时发现 `status = RUNNABLE`，会：
1. 检查锁文件（避免并发）
2. 检查 Claude CLI 可用性
3. 获取锁
4. 调用 Claude
5. **不立即改 status**，等 Claude 自己在执行过程中更新

### RUNNING → RUNNABLE

Claude 执行完一轮后：
1. 更新 `progress.md`
2. 更新 `verification.log`
3. 把 `state.json.status` 改回 `RUNNABLE`
4. 递增 `round`

### RUNNABLE → BLOCKED

出现以下情况之一：
- 遇到需要用户决策的产品取舍
- 连续 3 次同一测试失败
- Git 工作区出现非本目标变更冲突
- Token 或 quota 不足
- 上下文无法可靠恢复
- 当前选定的 AI CLI 不可用

### 任何状态 → COMPLETED

只有满足最终完成门禁：
- `current.md` 完成条件全部满足
- 必要测试通过
- 构建通过
- 执行器完成自检 或 用户手动确认
- `verification.log` 有最终验收

### 任何状态 → FAILED_NEEDS_HUMAN

自动化彻底失败，需要人工介入：
- 执行器连续崩溃
- 工作区严重冲突
- 无法恢复的上下文丢失

## state.json 完整字段

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

| 字段 | 类型 | 说明 |
|------|------|------|
| `status` | string | 10 种状态之一 |
| `agent` | string | 当前执行器：仅 `claude`（多执行器在阶段 3） |
| `round` | number | 已执行轮次 |
| `lastStartedAt` | string\|null | 最近一次启动时间 |
| `lastFinishedAt` | string\|null | 最近一次完成时间 |
| `consecutiveFailures` | number | 连续失败次数（≥3 触发 BLOCKED） |
| `lastVerification` | string | 最近验证结果：`PASS` / `FAIL` / `UNKNOWN` |
| `nextAction` | string | 下一步提示 |
| `updatedAt` | string | 最后更新时间 |

## 手动操作 state.json

你可以直接编辑 `.goal/state.json`：

### 暂停

```bash
# 方法一：用命令（推荐，会自动写 blockers.md）
bailu goal stop --reason "下班了"

# 方法二：手动改
# 把 "status" 改为 "BLOCKED"
```

### 恢复

```bash
# 把 "status" 改回 "RUNNABLE"
# 清空 consecutiveFailures 为 0
# 然后跑一轮
bailu goal run
```

### 重置轮次

```bash
# 把 "round" 改回 0
# 注意：progress.md 里的历史记录不需要删
```

## 下一步

- [.goal/ 目录契约](./file-contract)
- [安全边界](./safety)
