# 命令概览

白鹿 v2 保留 **5 个核心命令** + **7 个 Goal 子命令**，覆盖从安装到无人值守的完整链路。
v2.2.0 起另外在 AI 工具侧提供 **5 个 Slash 命令**（由 `bailu init` 部署）。

## 核心命令（CLI）

| 命令 | 说明 | 何时使用 |
|------|------|----------|
| [`bailu init`](./init) | 交互式向导，一键安装 Skills/Commands/Agent/Rules/MCP | 新项目首次使用 |
| [`bailu status`](./status) | 查看当前安装状态和下一步指引 | 想确认装了什么 |
| [`bailu update`](./update) | 更新工作流到最新版本 | npm 升级后重装 Skills |
| [`bailu doctor`](./doctor) | 环境诊断 | 排查安装/运行问题 |
| [`bailu reset`](./reset) | 清除已安装配置，回到初始状态 | 想重新开始 |

## Goal 子命令（CLI）

| 命令 | 说明 | 何时使用 |
|------|------|----------|
| [`bailu goal init`](./goal-init) | 在项目中创建 `.goal/` 骨架 | 准备无人值守任务 |
| [`bailu goal status`](./goal-status) | 查看 `.goal/` 当前状态 | 检查 AI 执行进度 |
| [`bailu goal run`](./goal-run) | 手动跑一轮 Goal 协议 | 试运行或调试 |
| [`bailu goal install-launchd`](./goal-install-launchd) | 安装 launchd 守护任务 | 进入无人值守 |
| [`bailu goal stop`](./goal-stop) | 软暂停：写 BLOCKED 状态 | 临时暂停 AI 执行 |
| [`bailu goal logs`](./goal-logs) | 查看 runner 日志 | 排查无人值守问题 |

## Slash 命令（AI 工具侧）

以下命令由 `bailu init` 部署到 `.claude/commands/` 与 `.qoder/commands/`，在 Claude Code / Qoder 中输入 `/xxx` 触发：

| 命令 | 说明 | 何时使用 |
|------|------|----------|
| `/bailu-sdd-start` | SDD 七阶段研发流程入口 | 启动研发任务 |
| `/bailu-dev` | 白鹿开发模式（SDD 开启时路由到 SDD） | 日常开发 |
| `/bailu-goal` | Goal 无人值守入口 | 进入长跑模式 |
| `/bailu-init` | 引导 AI 生成 CLAUDE.md / QODER.md | 项目初始说明文件 |
| [`/bailu-project-config`](./bailu-project-config) | 扫描项目生成/整理 rules 文件 | 项目规则沉淀 |

## 全局选项

以下选项适用于所有 CLI 命令：

| 选项 | 说明 |
|------|------|
| `--yes` | 跳过所有交互确认，使用默认值 |
| `--overwrite` | 覆盖已存在的文件 |
| `--skip-existing` | 跳过已存在的文件 |
| `--scope <scope>` | 安装范围：`project`（默认）或 `global` |
| `--lang <lang>` | 语言：`zh`（默认）或 `en` |
| `--json` | 以 JSON 格式输出（CI/CD 友好） |
| `-v, --version` | 显示版本号 |

## 典型工作流

```
新项目起步：
  npm install -g @vickzhang/bailu-cli
  cd my-project
  bailu init
  # 在 Claude Code 中 /bailu-sdd-start

项目规则沉淀（v2.2.0+）：
  # 在 Claude/Qoder 中
  /bailu-project-config        # 生成 .claude/rules/ 下的规则文件

日常开发：
  /bailu-sdd-start → 选择需求 → SDD 七阶段推进

升级白鹿：
  npm update -g @vickzhang/bailu-cli
  bailu update

长链路无人值守：
  bailu goal init
  # 编辑 .goal/current.md
  bailu goal run            # 先试一轮
  bailu goal install-launchd # 正式无人值守
  bailu goal status          # 随时查看进度

遇到问题：
  bailu doctor
```
