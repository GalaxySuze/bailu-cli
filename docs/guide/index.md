# 项目简介

## 什么是白鹿工作流？

**白鹿工作流 CLI**（`bailu`）是一款面向 **AI 辅助开发**的工作流管理工具。它把"如何让 AI 帮你写代码"这件事产品化为可复用、可分发、可追溯的 Skills 与 Commands。

> **林深见鹿** —— 在复杂的规则森林中，发现优雅的解决方案

## v2 的极简哲学

白鹿 v2 是一次彻底重构。从 v1 时代的"35 命令 + 3 套界面 + 7 种组件"瑞士军刀，精简到：

```
1 个交互式向导  ＋  1 个状态文件  ＋  1 套工作流
     bailu init      .bailu.yaml      SDD + Goal
```

这背后的判断是：**AI 协同工作流的核心矛盾不在功能数量，而在心智成本**。你越是把工具堆复杂，越没人愿意学，越成了开发者的另一个 IDE 偏好。

## 它解决什么问题

### 配置碎片化
不同 AI 工具（Claude Code、Qoder）的 Skills、Commands、Agents、MCP 散落在各自的 `.claude/`、`.qoder/` 目录里。手工同步费力，团队成员各装各的。

白鹿用一份 `manifest.json` 描述所有资产，`bailu init` 一键铺设到目标工具。

### SDD 流程缺失
"先写文档再写代码"人人都说好，但从需求评审到上线没有抓手。每次都靠人工 review、靠 IM 群里口头确认。

白鹿提供 SDD（Specification-Driven Development）七阶段流程：D1 任务评估 → D2 技术设计 → D3 技术评审 → D4 编码 → D5 代码评审 → D6 测试闭环 → D7 发版。每个阶段都有对应的 Skill 引导 AI 完成。

### AI 长跑无法托管
让 AI 持续推进一个复杂目标，传统做法是手动喂 prompt、人工接力、丢上下文。

白鹿 v2 引入 **Goal 无人值守模式**：用 `.goal/` 目录作为唯一事实源，用 launchd 做定时唤醒，用状态机让 AI 该跑时跑、该停时停。

## 适用场景

| 场景 | 描述 |
|------|------|
| **个人开发** | 用 SDD 流程让 AI 全程参与从需求到发版，避免上下文丢失 |
| **团队协作** | 通过 git 共享 `.bailu.yaml`，团队成员一键复现相同的 AI 工作流 |
| **长链路任务** | 用 Goal 模式托管"重构整个模块"、"完成 v2 迁移"这种几天到几周的目标 |
| **多工具切换** | Claude 或 Qoder 之间切换执行器，共享同一套契约 |

## 核心特性

- **5 命令 + 1 子命令组**：`init / status / update / doctor / reset` + 7 个 `goal` 子命令
- **SDD 七阶段**：从需求到发版的完整研发链路，三级规模路由（小/中/大）
- **Goal 无人值守**：launchd 守护 + 状态机收敛 + 多执行器共享协议
- **项目级隔离**：配置写在 `.bailu.yaml`，不污染全局环境
- **Claude Code + Qoder 双支持**：未来扩展更多工具，遵守相同契约

## 技术架构

```
┌──────────────────────────────────────────────────────────┐
│                    bailu CLI（5 命令）                    │
├──────────────────────────────────────────────────────────┤
│  CLI 层                                                  │
│  ├── init      交互式向导（选择平台/语言/范围）         │
│  ├── status    查看 .bailu.yaml + 安装清单              │
│  ├── update    重新部署 Skills                          │
│  ├── doctor    环境诊断                                 │
│  ├── reset     清除已安装组件                           │
│  └── goal      Goal 子命令组（init/run/launchd/...）    │
├──────────────────────────────────────────────────────────┤
│  状态层（.bailu.yaml）                                   │
│  ├── platform: claude-code / qoder                      │
│  ├── scope: project / global                            │
│  └── installed: skills / commands / agents / mcp        │
├──────────────────────────────────────────────────────────┤
│  资产层（packages/cli/assets/）                          │
│  ├── skills-zh/    12 个中文 SKILL.md                   │
│  ├── commands/     4 个 slash 命令                      │
│  ├── agents/       1 个 fullstack agent                 │
│  └── manifest.json 资产清单                             │
├──────────────────────────────────────────────────────────┤
│  目标工具                                                │
│  ├── Claude Code   →  .claude/{skills,commands,agents}/ │
│  └── Qoder         →  .qoder/{skills,commands,agents}/  │
└──────────────────────────────────────────────────────────┘
```

## 与 v1 的关系

v1（1.x 系列）已归档到 `archive/v1.5-full` 分支永久保留，但**不再维护**。如果你之前使用过 v1 的 `bailu workflow / tool / mcp / sync / serve / recommend / audit` 等命令，请参考 [安装与配置 → 从 v1 迁移](./installation#从-v1-迁移)。

## 许可协议

白鹿工作流基于 MIT 许可协议开源。
