# bailu reset

重置配置，清除已安装的工作流组件，回到初始状态。

## 用法

```bash
bailu reset [options]
```

## 选项

| 选项 | 说明 |
|------|------|
| `--confirm` | 跳过确认提示，直接执行 |

## 行为说明

`bailu reset` 会清除以下内容：

| 清除项 | 说明 |
|--------|------|
| `.bailu.yaml` | 删除项目状态文件 |
| `.claude/skills/bailu-*/` | 删除所有白鹿 Skills（保留非白鹿的） |
| `.claude/commands/bailu-*.md` | 删除所有白鹿 Commands |
| `.claude/agents/bailu-*.md` | 删除所有白鹿 Agents |
| `~/.claude.json` 中的 MCP | 移除白鹿添加的 MCP 条目 |

**不会删除**：
- `.claude/skills/` 下非 `bailu-*` 开头的 Skills
- `.claude/commands/` 下非 `bailu-*.md` 的命令
- `.sdd/`（SDD 运行时产物）
- `.goal/`（Goal 运行时产物）
- `.bailu-backup/`（历史备份）

## 交互确认

默认会要求确认：

```
⚠️  即将清除当前项目的白鹿工作流配置：

  - .bailu.yaml
  - .claude/skills/bailu-* (12 个)
  - .claude/commands/bailu-*.md (4 个)
  - .claude/agents/bailu-*.md (1 个)
  - MCP 配置 (2 个)

? 确认重置？ (y/N)
```

输入 `y` 执行，其他任何输入取消。

## 示例

### 交互式重置

```bash
bailu reset
```

### 直接重置（脚本友好）

```bash
bailu reset --confirm
```

### 重置后重新初始化

```bash
bailu reset --confirm
bailu init --yes
```

## 注意事项

- 重置是**不可逆的**（除非你之前有 `.bailu-backup/` 备份）
- 如果你手动修改过白鹿的 Skills，重置后这些修改会丢失
- 重置后需要重新 `bailu init` 才能继续使用白鹿

## 与其他命令的关系

- 重置前 → [`bailu status`](./status) 确认要删什么
- 重置后 → [`bailu init`](./init) 重新安装
- 不想删只想更新 → [`bailu update`](./update)
