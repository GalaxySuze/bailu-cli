# bailu goal · 无人值守 Goal 协议

> 不要追求"让 AI 一直跑"，而是让 AI **该跑时跑、该停时停、停下后知道为什么停、恢复后知道从哪里继续**。

本目录介绍白鹿 CLI 内置的 `goal` 子命令组，它把"无人值守开发"产品化为一组可控、可恢复、可审计的命令。

## 一句话理解

```
人写目标
  ↓
.goal/current.md     固化目标与验收条件
  ↓
.goal/state.json     机器可读状态
  ↓
launchd 定时唤醒 goal-runner
  ↓
goal-runner 读状态 → 决定是否调用 Claude
  ↓
Claude 按 bailu-goal Skill 执行 1~3 个原子任务
  ↓
写回 progress / state / verification
  ↓
通过则 COMPLETED；失败则 BLOCKED 或 FAILED_NEEDS_HUMAN
```

## 命令速查

| 命令 | 作用 |
|---|---|
| `bailu goal init` | 在项目根创建 `.goal/` 骨架 |
| `bailu goal status` | 查看当前状态 / 环境 / 最近进度 |
| `bailu goal run` | 手动跑一轮（走完整 runner 链路）|
| `bailu goal install-launchd` | 安装 launchd 任务，进入无人值守 |
| `bailu goal uninstall-launchd` | 卸载 launchd |
| `bailu goal stop` | 软暂停：把 status 写为 BLOCKED |
| `bailu goal logs [-f]` | 查看 runner 日志 |

## 完整使用流程

### 1. 初始化

```bash
cd /path/to/your/project
bailu goal init
```

这会创建：

```
.goal/
├── current.md         ← 目标契约（你必须手工填）
├── state.json         ← 机器状态
├── progress.md        ← 人类可读进度
├── blockers.md        ← 阻塞清单
├── verification.log   ← 验证记录
├── handoff.md         ← 交接摘要
└── snapshots/         ← 关键 diff / 截图等快照
```

### 2. 填写目标契约

编辑 `.goal/current.md`，把模板里 `<!-- 提示 -->` 的部分替换成真实内容。重点：

- **目标**：1~3 句话客观描述
- **范围**：允许 / 禁止触碰的目录与命令
- **完成条件**：每一条都可用命令验证（`npm test` 通过、`bailu serve` 能启动……）
- **安全边界**：模板已写好默认禁止清单，按需追加

> 完成条件越客观越好。AI 只会按这里写的东西判定"是否完成"。

### 3. 手动跑一轮，验证协议

```bash
bailu goal status         # 看一眼
bailu goal run --dry-run  # 只走决策，不调用 Claude（强烈推荐第一次跑）
bailu goal run            # 真正调用 Claude 一次
```

### 4. 进入无人值守

```bash
bailu goal install-launchd
```

默认每 30 分钟唤醒一次。修改间隔：

```bash
bailu goal install-launchd --interval 900     # 改成 15 分钟
```

安装完成后 launchd 会立即跑一次（`RunAtLoad=true`）。

### 5. 期间监控

```bash
bailu goal status              # 最快看一眼当前状态
bailu goal logs                # tail 末尾 80 行 runner 日志
bailu goal logs -f             # 实时跟随
bailu goal logs -n 200         # 末尾 200 行
```

### 6. 暂停 / 恢复 / 卸载

```bash
bailu goal stop --reason "今晚发布前先停一下"   # 软暂停（不卸载 launchd）
# 手动把 .goal/state.json.status 改回 RUNNABLE 即可恢复

bailu goal uninstall-launchd                  # 彻底卸载 launchd
```

## 状态机

| 状态 | runner 行为 |
|---|---|
| `INIT` | Claude 首次检查契约是否完整，完整则置 `RUNNABLE` |
| `RUNNABLE` | 调用 Claude 执行一轮 |
| `RUNNING` | 跳过本次唤醒（防并发）|
| `TOKEN_LOW` | 跳过本次唤醒 |
| `CONTEXT_NEEDS_COMPACT` | 通知人工 |
| `BLOCKED` | 通知人工 |
| `VERIFYING` | 调用 Claude 跑完成门禁 |
| `REVIEW_NEEDED` | 调用 Claude 做阶段复查 |
| `COMPLETED` | 通知完成，不再执行 |
| `FAILED_NEEDS_HUMAN` | 通知失败，不再执行 |

## 安全边界

无人值守必然以 `--dangerously-skip-permissions` 调用 Claude，安全边界完全靠以下几道：

1. **`.goal/current.md` 的「安全边界」章节**：禁止 `git push`、`npm publish`、`git reset --hard`、`git clean -fd`、修改 `~/.ssh` 等。
2. **`bailu-goal` Skill 的「角色与不可逾越的边界」**：再强调一次禁止清单。
3. **runner 单次执行 timeout**：默认 1500 秒，超时强杀。
4. **runner 锁文件**：同一项目同一时间只有一个 Claude 进程。
5. **runner cwd**：plist 显式注入 `WorkingDirectory`，Claude 默认只在项目目录工作。

如果你需要更激进的隔离（如沙箱），下一阶段可以考虑加 macOS Sandbox profile，但当前阶段以"协议层兜底 + 人工审 progress"为主。

## 文件是否要提交 git？

`bailu goal init` **不会**自动改 `.gitignore`。建议：

- 建议提交：`.goal/current.md`、`.goal/progress.md`（任务上下文与历史）
- 由你决定：`.goal/state.json`、`.goal/blockers.md`、`.goal/verification.log`、`.goal/snapshots/`
- 建议忽略：`.goal/runner.log`（这个 runner 实际上写在 `~/.bailu-goal/`，本就不在项目里）

参考 `.gitignore` 片段：

```gitignore
# 白鹿 Goal · 按需保留
.goal/state.json
.goal/blockers.md
.goal/verification.log
.goal/snapshots/
```

## 关键文件位置

```
项目内
  .goal/                                                  无人值守任务事实源
  
全局
  ~/.bailu-goal/goal-runner.sh                           runner 脚本
  ~/.bailu-goal/goal-runner.log                          runner 日志
  ~/.bailu-goal/last-claude-output.log                   Claude 最近一次输出
  ~/.bailu-goal/launchd.out.log / launchd.err.log        launchd stdout/stderr
  ~/.bailu-goal/goal-runner.lock/                        进程锁
  ~/Library/LaunchAgents/com.bailu.goal-runner.<hash>.plist   launchd 服务
```

## 与现有功能的关系

| 功能 | 关系 |
|---|---|
| `/bailu-sdd-start` 七阶段 | 正交。Goal 是"如何让任务自己走"，SDD 是"任务如何被规划"；可以让 Goal 推进的 ↪ 就是一个 SDD 阶段任务。 |
| `bailu init` 安装的 Skills | `bailu-goal` Skill 也在 manifest 里，正常走 `bailu init` 安装到 `.claude/skills/`。 |
| `/loop`、`/ralph-loop` | 不冲突。Goal 是开发主流程；loop 适合监控类任务（CI 检查、日志巡逻）。 |

## 已知边界（本版本不做）

- ❌ Codex 等其他执行器接入（阶段 3）
- ❌ `bailu goal review` 子命令（属于多执行器范畴）
- ❌ 自动 git commit / push（需要用户显式拍板）
- ❌ token / quota 自动检测（runner 目前只信任 Claude 退出码）

## 调试技巧

```bash
# 1. 看 runner 决策但不调 Claude
BAILU_GOAL_DRY_RUN=1 bailu goal run

# 2. 临时换 claude 二进制
CLAUDE_BIN=/opt/homebrew/bin/claude bailu goal run

# 3. launchd 是否真在跑
launchctl list | grep bailu.goal

# 4. 看 launchd stdout / stderr
tail -f ~/.bailu-goal/launchd.out.log
tail -f ~/.bailu-goal/launchd.err.log

# 5. 手动卸载某项目的 launchd
bailu goal uninstall-launchd
```
