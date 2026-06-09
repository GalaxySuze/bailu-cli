# bailu goal install-launchd

安装 Mac launchd 守护任务，让 `goal-runner` 按固定间隔自动唤醒，进入真正的无人值守模式。

## 用法

```bash
bailu goal install-launchd [options]
```

## 选项

| 选项 | 说明 | 默认 |
|------|------|------|
| `--interval <seconds>` | 唤醒间隔（秒） | `1800`（30 分钟） |
| `--yes` | 跳过风险确认 | `false` |
| `--dangerous` | 等同于 `--yes`，显式承认风险 | `false` |

## 推荐间隔

| 间隔 | 适用场景 |
|------|----------|
| `900` (15 分钟) | 任务紧急、token 充足、风险低 |
| `1800` (30 分钟) | **默认推荐**，平衡反应速度与配额 |
| `3600` (60 分钟) | 架构重构、发布流程、权限敏感任务 |

## 安装内容

执行后会生成：

```
~/Library/LaunchAgents/com.bailu.goal-runner.plist  ← launchd 配置
~/.bailu-goal/
├── goal-runner.sh                                  ← 主守护脚本
├── goal-runner.log                                 ← runner 日志
└── goal-runner.lock                                ← 运行锁（可能不存在）
```

然后会自动 `launchctl load` 启用任务。

## 风险确认

由于无人值守模式涉及**自动调用 Claude CLI 写代码**，默认会要求确认：

```
⚠️  风险提示

  即将安装 launchd 守护任务，它会：

  - 每 1800 秒（30 分钟）自动唤醒
  - 自动检查 .goal/state.json 决定是否调用 Claude
  - 自动允许 Claude 修改当前项目代码
  - 修改的范围由 .goal/current.md 的"范围"和"中止条件"约束

  请确保你已经：
  ✓ 仔细填写 .goal/current.md
  ✓ 跑过 bailu goal run 试运行
  ✓ 当前项目已 git 提交（便于回滚）

? 确认安装？ (y/N)
```

输入 `y` 安装，其他取消。脚本场景下用 `--yes` 跳过。

## 输出示例

```
🦌 安装 Goal Runner launchd 守护

  唤醒间隔:        1800 秒（30 分钟）
  runner 脚本:     ~/.bailu-goal/goal-runner.sh
  plist 文件:      ~/Library/LaunchAgents/com.bailu.goal-runner.plist
  日志:           ~/.bailu-goal/goal-runner.log

✓ 复制 goal-runner.sh 到 ~/.bailu-goal/
✓ 生成 launchd plist
✓ launchctl load 成功

🎯 已进入无人值守模式。

  - 下次唤醒：30 分钟内
  - 查看状态：bailu goal status
  - 查看日志：bailu goal logs -f
  - 软暂停：bailu goal stop
  - 卸载守护：bailu goal uninstall-launchd
```

## 卸载

```bash
bailu goal uninstall-launchd
```

这会：

1. `launchctl unload` 停止任务
2. 删除 `~/Library/LaunchAgents/com.bailu.goal-runner.plist`
3. **保留** `~/.bailu-goal/` 下的日志和锁文件（便于排查历史问题）

## 多项目并存

launchd 任务是**全局的**，但 runner 通过当前工作目录定位 `.goal/`。所以：

- 同一时刻只有**一个项目**的 `.goal/` 在被推进
- 切换项目时需要先 `cd` 到目标项目再 install-launchd
- 如果你需要并发推进多个项目，需要为每个项目改不同的 plist Label（不推荐，复杂且容易冲突）

## 注意事项

### 关于自动 git push

**runner 默认不会自动 git push**。这是有意的安全策略。即使 Goal 完成，也只是写 `COMPLETED` 状态，等你人工 review 后再 push。

### 关于自动 npm publish

**永远不会自动执行**。这类高风险命令在 [安全边界](/goal/safety) 文档中明确禁止。

### Mac 睡眠

launchd 在 Mac 睡眠时不会触发。如果你希望长时间运行，可以：

- 用 `caffeinate` 命令防止睡眠
- 或接电源 + 设置"接电源时不自动睡眠"

## 与其他命令的关系

- 试运行 → [`bailu goal run`](./goal-run)
- 查看状态 → [`bailu goal status`](./goal-status)
- 看日志 → [`bailu goal logs`](./goal-logs)
- 软暂停 → [`bailu goal stop`](./goal-stop)
