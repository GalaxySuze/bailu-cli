# AI 工具管理

白鹿工作流支持多种 AI 编程工具，可以统一管理它们的配置。

## 支持的工具

| 工具 | 配置目录 | 说明 |
|------|----------|------|
| Claude Code | `~/.claude/` | Anthropic 出品的 AI 编程助手 |
| Hanako | `~/.hanako/` | 个人 AI 助手 |
| Codex | `~/.codex/` | OpenAI 的代码生成模型 |
| Cursor | `~/.cursor/` | AI 原生的代码编辑器 |
| Hermes | `~/.hermes/` | 轻量级 AI 编程助手 |
| Trae | `~/.trae/` | 字节跳动出品的 AI 编程工具 |

## 查看工具状态

```bash
# 查看所有工具状态
bailu tool status

# 查看特定工具
bailu tool status claude
```

## 安装工具配置

```bash
# 安装 Claude Code 配置
bailu tool install claude

# 安装 Hanako 配置
bailu tool install hanako
```

## 卸载工具配置

```bash
# 卸载 Claude Code 配置
bailu tool uninstall claude
```

## 工具组件

每个工具可以包含以下组件：

| 组件 | 目录 | 说明 |
|------|------|------|
| Skills | `skills/` | AI 技能 |
| Commands | `commands/` | 命令 |
| Agents | `agents/` | 代理 |
| Rules | `rules/` | 规则 |
| Hooks | `hooks/` | 钩子 |

## 多工具同步

使用 `sync` 命令可以将配置同步到多个工具：

```bash
# 同步到所有已配置的工具
bailu sync push
```
