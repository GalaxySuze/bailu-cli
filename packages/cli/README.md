# @vickzhang/bailu-cli

白鹿工作流 CLI — 林深见鹿，优雅前行

一个命令初始化 AI 辅助研发工作流，让 Claude Code / Qoder 拥有完整的 SDD（Specification-Driven Development）能力；另附 Goal 无人值守模式，让 Claude 能按契约长跑、自主推进开发任务。

## 快速开始

```bash
# 全局安装
npm install -g @vickzhang/bailu-cli

# 在项目目录初始化（唯一需要记住的命令）
cd your-project
bailu init
```

`bailu init` 会自动检测环境、选择平台、部署 Skills，全程交互式引导。

## 命令

### 核心命令

| 命令 | 说明 |
|------|------|
| `bailu init` | 交互式初始化白鹿工作流 |
| `bailu status` | 查看当前状态和下一步指引 |
| `bailu update` | 更新工作流到最新版本 |
| `bailu doctor` | 环境诊断，检查依赖和配置 |
| `bailu reset` | 重置配置，清除已安装的工作流 |

### Goal 无人值守子命令组

| 命令 | 说明 |
|------|------|
| `bailu goal init` | 创建项目 `.goal/` 骨架 |
| `bailu goal status` | 查看状态机 / Claude / launchd 环境 |
| `bailu goal run` | 手动跑一轮（支持 `--dry-run`）|
| `bailu goal install-launchd` | 安装 launchd 定时任务（macOS）|
| `bailu goal uninstall-launchd` | 卸载 launchd 定时任务 |
| `bailu goal stop` | 紧急停手 |
| `bailu goal logs` | 查看 runner 日志 |

常用参数：

- `--yes`：跳过交互确认，使用默认值
- `--json`：以 JSON 格式输出（CI/CD 友好）
- `--scope project|global`：安装范围（默认 project）

## 初始化后

在 Claude Code 或 Qoder 中使用 Slash 命令启动 SDD 研发流程：

```
/bailu-sdd-start
```

SDD 流程包含 7 个阶段：需求规划 → 技术设计 → 技术评审 → 编码实现 → 代码审查 → 测试收尾 → 发布部署。

### 项目规则生成（v2.2.0+）

要为项目生成/整理规则文件（`.claude/rules/` 与 `.qoder/rules/`），在 AI 工具中运行：

```
/bailu-project-config
```

会扫描项目技术栈，生成符合**方案 E（轻量标记分隔符）** 规范的规则文件：constraints / anti_patterns / examples 各模块清晰、与 Obsidian callout 兼容。

`bailu init` 本身只创建空的 rules 骨架和 README，实际规则内容由 AI 工具生成（与 v2.0 所确立的"CLI 管安装、AI 管执行"原则一致）。

### Goal 无人值守（可选）

需要让 AI **长跑型地推进某个目标**（不是一次性聊天）时，用 Goal 模式：

```bash
bailu goal init                    # 创建 .goal/ 契约
# 编辑 .goal/current.md，填「目标」「范围」「完成条件」
bailu goal run --dry-run           # 看状态机决策
bailu goal run                     # 手动跑一轮
bailu goal install-launchd         # 进入无人值守（默认 30 分钟唤醒一次）
```

Goal 模式以 `.goal/` 目录作为唯一事实源：current.md 定义目标、state.json 保存 10 状态状态机、progress.md 累加进展。Runner 定时唤醒 Claude，按状态机决策是否推进、是否停手。

当前仅支持 Claude 作为执行器，仅 macOS 支持 launchd 定时（Linux 可手动用 cron/systemd）。

## 支持的平台

| 平台 | 状态 |
|------|------|
| Claude Code | ✅ 完整支持 |
| Qoder | 🚧 规划中 |
| Codex | 🚧 规划中 |

## 系统要求

- Node.js >= 18.0.0
- Git（建议，用于版本追溯）

## 跨平台支持

- ✅ macOS
- ✅ Windows
- ✅ Linux

## 许可证

MIT
