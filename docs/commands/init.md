# bailu init

交互式向导，是白鹿 v2 **唯一需要记住的命令**。一条命令完成：选择 AI 工具 → 选择语言 → 选择范围 → 检测冲突 → 安装 Skills/Commands/Agent → 写入 MCP → 落盘 `.bailu.yaml`。

## 用法

```bash
bailu init [options]
```

## 选项

| 选项 | 说明 | 默认 |
|------|------|------|
| `--yes` | 跳过所有交互，使用默认值（Claude Code + zh + project） | `false` |
| `--scope <scope>` | 安装范围：`project` / `global` | `project` |
| `--lang <lang>` | 语言：`zh` / `en` | `zh` |
| `--overwrite` | 冲突时覆盖已有文件 | `false` |
| `--skip-existing` | 冲突时跳过已有文件 | `false` |
| `--workflow <name>` | 工作流类型（当前仅支持 `dev`） | `dev` |

## 交互流程

### 1. 旧版检测

如果检测到项目里有 v1 时代的 `bailu-*` 残留文件，会询问：

```
? 检测到旧版白鹿配置，如何处理？
  ❯ 备份到 .bailu-backup/ 后清理
    直接清理（不可恢复）
    保留（可能与新版冲突）
```

### 2. 选择 AI 工具

```
? 选择目标 AI 工具：
  ❯ Claude Code  (~/.claude/ 或 .claude/)
    Qoder         (~/.qoder/ 或 .qoder/)
```

### 3. 选择语言

```
? Skills 语言版本：
  ❯ 中文 (zh)
    English (en)
```

### 4. 选择安装范围

```
? 安装到哪个范围？
  ❯ 当前项目（推荐）   .claude/skills/
    全局              ~/.claude/skills/
```

**强烈推荐 project**：多项目隔离、不污染全局、git 同步友好。

### 5. 冲突处理

如果目标目录已有同名文件，三级策略：

| 策略 | 说明 |
|------|------|
| 跳过 | 保留现有文件，不覆盖 |
| 覆盖 | 直接覆盖现有文件 |
| 备份后覆盖 | 把现有文件备份到 `.bailu-backup/timestamp/` 再覆盖（**默认**） |

## 安装内容

成功后会安装：

```
.claude/   （或 .qoder/）
├── skills/
│   ├── bailu-sdd-start/
│   ├── bailu-sdd-d1-planning/
│   ├── bailu-sdd-d2-tech-design/
│   ├── bailu-sdd-d3-tech-review/
│   ├── bailu-sdd-d4-coding/
│   ├── bailu-sdd-d4-git-branch/
│   ├── bailu-sdd-d5-code-review/
│   ├── bailu-sdd-d6-test-closure/
│   ├── bailu-sdd-d7-publish/
│   ├── bailu-sdd-openspec-workflow/
│   ├── bailu-dev-workflow/
│   └── bailu-goal/
├── commands/
│   ├── bailu-init.md
│   ├── bailu-dev.md
│   ├── bailu-sdd-start.md
│   └── bailu-goal.md
└── agents/
    └── bailu-fullstack.md
```

同时写入项目根的 `.bailu.yaml` 记录状态。

如果选择 Claude Code，还会尝试写入 `~/.claude.json` 添加 MCP 服务（`context7` 和 `playwright`）。**安全策略**：先备份 `.bak`、不覆盖已有配置、`--yes` 模式跳过交互。

## 示例

### 默认交互式

```bash
cd my-project
bailu init
# 一路 Enter 接受默认值
```

### 一键安装（CI 友好）

```bash
bailu init --yes
# 等同于：Claude Code + zh + project + 备份后覆盖
```

### 装到全局

```bash
bailu init --scope global
```

### 安装英文 Skills

```bash
bailu init --lang en
```

### 强制覆盖

```bash
bailu init --overwrite --yes
```

## 与其他命令的关系

- 运行后 → 用 [`bailu status`](./status) 查看安装清单
- npm 升级后 → 用 [`bailu update`](./update) 重新部署
- 想重新开始 → 用 [`bailu reset`](./reset) 清除再 init

## 故障排查

### "找不到目标 AI 工具"

`bailu doctor` 看一下哪个工具被识别了。如果 Claude Code/Qoder 都标 `optional: missing`，意味着系统里没装。

### "MCP 写入失败"

通常是 `~/.claude.json` 不存在或权限问题。手动检查：

```bash
ls -la ~/.claude.json
```

如果文件不存在，先随便打开一次 Claude Code 让它生成。
