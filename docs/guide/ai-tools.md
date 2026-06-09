# 支持的 AI 工具

白鹿 v2 当前支持两个目标 AI 工具，未来扩展更多工具时遵守相同的安装契约。

## 支持矩阵

| 工具 | 项目级目录 | 全局目录 | 状态 |
|------|------------|----------|------|
| **Claude Code** | `.claude/` | `~/.claude/` | ✅ 完整支持（推荐） |
| **Qoder** | `.qoder/` | `~/.qoder/` | ✅ 完整支持 |
| **Codex** | `.codex/` | `~/.codex/` | 🟡 实验性（仅检测） |

未来计划支持：Cursor、Windsurf、Trae（待社区贡献或官方提供 Skills 协议）。

## Claude Code

### 安装

```bash
# 1. 装 Claude Code（如未安装）
# 见 https://claude.ai/code

# 2. 装白鹿
npm install -g @vickzhang/bailu-cli

# 3. 项目初始化
cd your-project
bailu init   # 默认选 Claude Code
```

### 安装结果

```
your-project/
├── .claude/
│   ├── skills/bailu-*/       # 12 个 Skill
│   ├── commands/bailu-*.md   # 4 个命令
│   └── agents/bailu-*.md     # 1 个 agent
└── .bailu.yaml
```

同时尝试写入 `~/.claude.json` 添加 2 个 MCP（context7 + playwright）。

### 使用

打开 Claude Code，在对话框输入：

```
/bailu-sdd-start      # 启动 SDD 流程
/bailu-dev            # 进入开发模式
/bailu-goal           # Goal 无人值守入口
/bailu-init           # 生成 CLAUDE.md
```

## Qoder

### 安装

```bash
cd your-project
bailu init
# 向导中选择 Qoder
```

### 安装结果

```
your-project/
├── .qoder/
│   ├── skills/bailu-*/
│   ├── commands/bailu-*.md
│   └── agents/bailu-*.md
└── .bailu.yaml
```

Qoder 暂不集成 MCP（Qoder 的 MCP 模型尚未与 Claude 对齐）。

### 使用

Qoder 中输入：

```
/bailu-sdd-start
/bailu-dev
```

## Codex

Codex 当前只能被 `bailu doctor` 检测到，**bailu init 暂不支持选择 Codex 作为安装目标**。原因：

- Codex 的 Skills 协议与 Claude 不一致
- Codex 的命令机制尚在演进
- 项目级 `.codex/` 约定尚未稳定

如果你只用 Codex，可以：

1. 手动把 `packages/cli/assets/skills-zh/bailu-*/SKILL.md` 复制到 Codex 的对应目录
2. 或等待 Codex 适配（issue #N 跟踪中）

## 多工具并存

完全支持。一个项目可以同时装 Claude Code 和 Qoder：

```bash
bailu init                  # 第一轮：选 Claude Code
bailu init                  # 第二轮：选 Qoder（不会覆盖 .claude/）
```

`.bailu.yaml` 会记录所有已安装平台。

## 工具切换

### 在 Goal 模式下切换执行器

Goal 无人值守支持 Claude 和 Codex 之间切换执行器，共享 `.goal/` 协议：

```text
.goal/state.json
  "agent": "claude"   ← 改为 "codex" 即可切换
```

切换前必须先：

1. 让当前执行器把状态写入 `.goal/state.json` 和 `.goal/progress.md`
2. 编辑 `state.json` 改 agent 字段
3. 在 `.goal/progress.md` 追加切换记录

详细参见 [Goal → 多执行器策略](/goal/multi-agent)。

## 关于 Hanako

Hanako 是个人 AI 助手（不是编程工具），它的 `~/.hanako/` 目录管理 agent 会话历史和 skill。**白鹿不会动 `~/.hanako/`**——这是 Hanako agent 本体配置，与白鹿无关。

## 关于 Trae

Trae 在 v1 时代曾有支持，v2 暂时移除（manifest 未声明）。如需，可以手动从 `.claude/` 复制到 `~/.trae/`。

## 下一步

- [Skills 与 Commands 完整清单](./skills-commands)
- [bailu init 命令](/commands/init)
- [Goal 多执行器策略](/goal/multi-agent)
