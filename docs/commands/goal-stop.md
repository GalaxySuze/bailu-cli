# bailu goal stop

软暂停：把 `.goal/state.json` 的 status 写为 `BLOCKED`，runner 下次唤醒时会跳过执行。

## 用法

```bash
bailu goal stop [options]
```

## 选项

| 选项 | 说明 |
|------|------|
| `--reason <text>` | 暂停原因，追加到 `.goal/blockers.md` |

## 行为说明

1. 将 `.goal/state.json` 的 `status` 改为 `BLOCKED`
2. 如果指定了 `--reason`，追加到 `.goal/blockers.md`：
   ```
   ## 2026-06-09 11:20（人工暂停）

   <你写的原因>
   ```
3. **不会**卸载 launchd 任务（下次唤醒时 runner 看到 BLOCKED 会跳过）
4. **不会**杀死正在运行的 Claude 进程

## 什么时候用

- 下班了、要离开电脑，不想 AI 继续改代码
- 看了 progress 发现方向不对，需要停下来想想
- 需要先处理其他更紧急的事情
- 等待外部条件（CI 通过、code review 等）

## 示例

### 简单暂停

```bash
bailu goal stop
```

### 带原因

```bash
bailu goal stop --reason "需要先和产品对齐需求范围，明天再继续"
```

### 恢复执行

手动把状态改回来：

```bash
# 方法一：直接编辑 state.json
# 把 "status": "BLOCKED" 改为 "status": "RUNNABLE"

# 方法二：直接再跑一轮（手动覆盖状态）
bailu goal run
```

## stop vs uninstall-launchd

| 操作 | stop | uninstall-launchd |
|------|------|-------------------|
| launchd 任务 | 保留（下次唤醒跳过） | 卸载（不再唤醒） |
| state.json | 改为 BLOCKED | 不改 |
| 临时暂停 | ✅ | 不需要 |
| 长期停止 | 可以但不推荐 | ✅ |

**建议**：短期暂停用 `stop`，长期不用了用 `uninstall-launchd`。

## 与其他命令的关系

- 查看当前状态 → [`bailu goal status`](./goal-status)
- 恢复执行 → [`bailu goal run`](./goal-run) 或手动改 `state.json`
- 彻底停止 → [`bailu goal uninstall-launchd`](./goal-install-launchd)
