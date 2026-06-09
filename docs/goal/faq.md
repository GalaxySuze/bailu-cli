# 常见问题

## 基础

### Goal 和 SDD 有什么区别？

| | SDD（sdd-workflow） | Goal（goal） |
|---|---|---|
| 角色 | 研发流程引擎 | 目标推进内核 |
| 用途 | 从需求到上线，逐阶段推进 | 任何需要多轮 AI 执行的复杂目标 |
| 触发 | 对话中 /bailu-sdd-start | launchd 定时唤醒或手动 |
| 数据位置 | `.sdd/sdd-context.md` | `.goal/` 目录 |
| 无人值守 | ❌ 需要人工逐阶段确认 | ✅ 自动推进 |

**它们的关系**：SDD 是"做什么、怎么做"，Goal 是"持续去做"。你可以把 SDD 的一个阶段包装成 Goal（比如"用 Goal 模式自动推进 D4 编码环节"），但 Goal 不限于 SDD。

### bailu goal 和 bailu init 什么关系？

**没有直接关系**。

- `bailu init`：在白鹿管理的项目里安装 Skills/Commands
- `bailu goal`：在任何 git 项目里创建无人值守 Goal（甚至可以用在没有 `bailu init` 过的项目上）

不过，如果在已 `bailu init` 的项目里用 `bailu goal`，获得的 `bailu-goal` Skill 文件会更完整。

### 一定要 Mac 吗？

launchd 是 macOS 特性，所以 `bailu goal install-launchd` 只在 Mac 上可用。

但 `bailu goal init`、`bailu goal status`、`bailu goal run`、`bailu goal stop`、`bailu goal logs` **都可以在 Linux 上用**。Linux 上你可以用 systemd timer / cron 替代 launchd 作为调度器。

## 无人值守

### 多项目可以同时跑吗？

不推荐。launchd 任务只有一个 `WorkingDirectory`。如果你需要多个项目并发，需要分别管理多个 launchd plist，但锁文件在 `~/.bailu-goal/` 是全局的，会冲突。

### 一个 Goal 可以跑多久？

取决于：
- Claude Code / Qoder 的 token 配额
- 你的 GitHub Copilot / Codex 配额
- Mac 是否睡眠

从经验看，一个中等复杂度的目标（如"补全单元测试，覆盖率 ≥ 80%"）通常需要 2-8 轮，每轮 5-15 分钟，半天内完成。

### AI 跑偏了怎么办？

`bailu goal stop` 暂停，卸载 launchd，回滚 git，重写 `current.md` 把范围写窄。

## 技术

### .goal/ 可以和 .git 共存吗？

完全可以。`.goal/` 是普通目录，建议提交到 git（除了大型 snapshot 和 runner.log）。

### state.json 被写坏了？

手动修复。它只是 JSON 文件，`bailu goal status` 会尝试读取所有字段并给出友好提示。

### Claude 没有 bailu-goal Skill？

你当前的 Claude 工具可能还没装 `bailu-goal` Skill。运行 `bailu init` 选 Claude Code 安装完整组件集，或者手动复制 `packages/cli/assets/skills-zh/bailu-goal/` 到 `.claude/skills/bailu-goal/`。

### runner 在哪找？

`goal-runner.sh` 在 `~/.bailu-goal/goal-runner.sh`，由 `bailu goal init` 或 `bailu goal run` 自动落盘。你也可以直接 shell 运行它来调试。

### launchd 切后台后怎么监控？

```bash
# 查看实时日志
bailu goal logs -f

# 查看最近状态
bailu goal status

# 查看 Mac 通知历史
# 通知中心 → 历史通知
```

## 故障

### 装了 launchd 但是没跑

```bash
# 1. 检查是不是加载了
launchctl list | grep bailu.goal

# 2. 查看日志
tail -100 ~/.bailu-goal/goal-runner.log

# 3. 手动触发一次
launchctl start com.bailu.goal-runner

# 4. 检查锁文件
ls -la ~/.bailu-goal/goal-runner.lock
# 锁文件存在且进程不存在 → 手动删除
rm ~/.bailu-goal/goal-runner.lock
```

### runner 报告 "not a git repository"

`bailu goal install-launchd` 安装时记录了项目路径，但这个路径可能被删除或变成了非 git 目录。解决方案：

```bash
# 卸载重装
bailu goal uninstall-launchd
bailu goal install-launchd
```

### Claude 执行超时

```bash
# 1. 看日志，是不是卡在某个步骤
bailu goal logs -n 50

# 2. 看 state.json 是不是 stuck 在 RUNNING
cat .goal/state.json

# 3. 强制清理
rm ~/.bailu-goal/goal-runner.lock
```

超时后锁文件会被释放，下次 launchd 唤醒或手动 `bailu goal run` 时会继续。

### 跟其他 CLI 工具冲突

锁文件 `~/.bailu-goal/goal-runner.lock` 是全局的。其他也会写这个锁的工具可能会冲突。目前的解决方式是：如果遇到锁冲突，手动用 `rm` 删除锁文件。

## 概念

### 什么场景不适合 Goal？

- **需要实时反馈的**：聊天、问答、单次查询——直接跟 AI 聊就行
- **需要人工主导的**：架构设计会议、产品需求讨论——不要用 AI 替代
- **高风险操作的**：数据库迁移、生产部署——必须人工确认
- **AI 不能理解上下文**：需要多年项目经验的复杂决策

### Goal 和 CI/CD 什么关系？

Goal 是**开发阶段**的自动推进，CI/CD 是**验证和部署**阶段的自动检查。不冲突，反而互补：

```text
Goal（自动推进） → 写代码 + 跑测试
  ↓ 开发完成
CI/CD（自动验证） → 自动构建 + 自动测试 + 自动部署
```

### 每次 AI 调用都重读 current.md，会不会浪费 token？

是，但这是故意的。每次重读确保了 prompt 不漂移。而且 `.goal/current.md` 通常就几十行，token 成本远低于让 AI "猜"之前要做什么。