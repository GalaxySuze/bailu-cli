# launchd 集成

Mac 的 launchd 是 Goal 模式的核心调度层。`bailu goal install-launchd` 会创建一个 LaunchAgent，按固定间隔唤醒 `goal-runner.sh`。

## 安装

```bash
bailu goal install-launchd --interval 1800
```

### 安装过程

1. 把 `packages/cli/assets/goal/goal-runner.sh` 复制到 `~/.bailu-goal/goal-runner.sh` 并设可执行
2. 生成 `~/Library/LaunchAgents/com.bailu.goal-runner.plist`
3. `launchctl load` 启用任务
4. 确认下次唤醒时间

### plist 配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.bailu.goal-runner</string>

  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>/Users/你/.bailu-goal/goal-runner.sh</string>
  </array>

  <key>WorkingDirectory</key>
  <string>/Users/你/Code/你的项目</string>

  <key>StartInterval</key>
  <integer>1800</integer>

  <key>RunAtLoad</key>
  <true/>

  <key>StandardOutPath</key>
  <string>/Users/你/.bailu-goal/goal-runner.log</string>

  <key>StandardErrorPath</key>
  <string>/Users/你/.bailu-goal/goal-runner.log</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
```

关键配置项：

| 项 | 说明 |
|---|---|
| `StartInterval` | 唤醒间隔，秒 |
| `RunAtLoad` | 加载时立即执行一次 |
| `WorkingDirectory` | runner 在哪个项目目录执行 |
| `StandardOutPath` | 日志位置 |

## 推荐间隔

| 间隔 | 适用场景 |
|------|----------|
| `900` (15 分钟) | 任务紧急、token 充足、风险低 |
| `1800` (30 分钟) | **默认推荐**，平衡反应速度与配额 |
| `3600` (60 分钟) | 架构重构、发布流程、权限敏感任务 |

## 卸载

```bash
bailu goal uninstall-launchd
```

会执行：
1. `launchctl unload` 停止任务
2. 删除 `~/Library/LaunchAgents/com.bailu.goal-runner.plist`
3. 保留 `~/.bailu-goal/` 下的日志和脚本

## 查看状态

```bash
# launchd 任务状态
launchctl list | grep bailu.goal

# 手动触发一次（不等间隔）
launchctl start com.bailu.goal-runner

# 看日志
bailu goal logs -f
```

## Mac 睡眠

launchd 在 Mac 睡眠时**不会触发**。这通常是你想要的（合盖就不跑），但如果需要长时间无人值守：

### 方案 A：防止睡眠

```bash
# 接电源时防止睡眠（推荐）
sudo pmset -c sleep 0

# 或用 caffeinate
caffeinate -s &   # -s 防止系统睡眠
```

### 方案 B：利用唤醒补偿

launchd 有一个特性：如果 Mac 在预定的唤醒时间处于睡眠状态，唤醒后 launchd 会**补偿执行**一次。所以你不用额外配置，醒来后它会自动补跑。

## 多项目

launchd 任务是全局的，但 `WorkingDirectory` 决定 runner 在哪个项目执行。

**同一时刻只能有一个项目的 Goal 在跑**。切换项目时：

```bash
# 1. 先卸载当前
bailu goal uninstall-launchd

# 2. 切到新项目
cd another-project

# 3. 安装新的
bailu goal install-launchd --interval 1800
```

**不建议**同时装多个 plist 跑多个项目——容易锁冲突和配额争抢。

## 超时控制

`goal-runner.sh` 默认单次执行超时 **1500 秒**（25 分钟）。如果 Claude 在 25 分钟内没结束，runner 会强制终止。

超时后：
- 进程被 kill
- 锁文件被释放
- `state.json.status` 保持 `RUNNING`（下次唤醒看到 RUNNING + 进程不存在 → 自动恢复为 RUNNABLE）

## 故障排查

### launchd 没有触发

```bash
# 检查任务是否加载
launchctl list | grep bailu

# 检查 plist 文件
ls -la ~/Library/LaunchAgents/com.bailu.goal-runner.plist

# 检查日志有无报错
tail -50 ~/.bailu-goal/goal-runner.log
```

### runner 报 "Claude CLI not found"

launchd 环境的 PATH 和你的 shell 不同。plist 中的 `EnvironmentVariables.PATH` 需要包含 Claude 和 Node 的路径：

```bash
# 找到你的 Claude 路径
which claude
# 例如 /Users/kangkang/.nvm/versions/node/v20.x.x/bin/claude

# 编辑 plist 的 PATH 加入该路径
```

### 日志太大

```bash
# 清空日志（不影响运行）
> ~/.bailu-goal/goal-runner.log

# 或用 logrotate（如果装了）
```

## 下一步

- [安全边界](./safety)：什么不会被自动执行
- [常见问题](./faq)
