# 🦌 白鹿工作流 CLI

> **林深见鹿** — 在复杂的规则森林中，发现优雅的解决方案

[![npm version](https://img.shields.io/npm/v/@vickzhang/bailu-cli)](https://www.npmjs.com/package/@vickzhang/bailu-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**白鹿工作流 CLI**（`bailu`）是面向 AI 辅助开发场景的命令行工具，一个命令初始化完整的 SDD（Specification-Driven Development）研发工作流，让 Claude Code / Qoder 拥有从需求规划到发布部署的全流程能力。

---

## ✨ 核心特性

- 🚀 **一键初始化** — `bailu init` 自动检测环境、选择平台、部署 Skills，全程交互式引导
- 📋 **SDD 七阶段** — 需求规划 → 技术设计 → 技术评审 → 编码实现 → 代码审查 → 测试收尾 → 发布部署
- 🔍 **状态驱动** — `.bailu.yaml` 记录安装状态，随时查看进度和下一步指引
- 🛠️ **清单驱动** — 新增/删除 Skill 只改清单，不改安装逻辑
- 🤖 **MCP 集成** — 可选配置 GitHub + Playwright MCP 服务

---

## 📦 安装

```bash
npm install -g @vickzhang/bailu-cli
```

---

## 🚀 快速开始

```bash
# 在项目目录初始化（唯一需要记住的命令）
cd your-project
bailu init

# 查看状态和下一步指引
bailu status

# 在 Claude Code 或 Qoder 中启动 SDD 流程
/bailu-sdd-start
```

---

## 📖 命令

| 命令 | 说明 |
|------|------|
| `bailu init` | 交互式初始化白鹿工作流 |
| `bailu status` | 查看当前状态和下一步指引 |
| `bailu update` | 更新工作流到最新版本 |
| `bailu doctor` | 环境诊断，检查依赖和配置 |
| `bailu reset` | 重置配置，清除已安装的工作流 |

常用参数：

- `--yes`：跳过交互确认，使用默认值
- `--json`：以 JSON 格式输出（CI/CD 友好）
- `--scope project|global`：安装范围（默认 project）

---

## 🤖 支持的平台

| 平台 | 状态 |
|------|------|
| Claude Code | ✅ 完整支持 |
| Qoder | 🚧 规划中 |
| Codex | 🚧 规划中 |

---

## 📋 SDD 研发流程

初始化后，在 Claude Code 或 Qoder 中使用 `/bailu-sdd-start` 启动 SDD 流程：

| 阶段 | 说明 |
|------|------|
| **D1 - 需求规划** | 理解需求，拆解任务，估算工作量 |
| **D2 - 技术设计** | 架构设计，接口定义，技术方案评审 |
| **D3 - 技术评审** | 方案评审，风险评估，确认可行性 |
| **D4 - 编码实现** | 代码实现，单元测试，分支管理 |
| **D5 - 代码审查** | 代码审查，安全检查，质量保证 |
| **D6 - 测试收尾** | 集成测试，性能测试，Bug 修复 |
| **D7 - 发布部署** | 部署准备，上线发布，监控验证 |

---

## 🛠️ 系统要求

- Node.js >= 18.0.0
- Git（建议，用于版本追溯）

---

## 📁 项目结构

```
bailu-cli/
├── packages/
│   └── cli/                          # 核心 CLI（发布到 npm）
│       ├── bin/
│       │   └── bailu-v2.js            # CLI 入口
│       ├── src/v2/
│       │   ├── commands/              # 5 个命令实现
│       │   ├── installer.js           # 清单驱动安装器
│       │   ├── platforms.js           # 平台数据化定义
│       │   ├── state.js               # 状态文件管理
│       │   └── index.js               # 主程序
│       └── assets/
│           ├── manifest.json          # 清单文件
│           ├── skills-zh/             # 中文 Skills（11 个 SDD）
│           ├── skills/                # 英文 Skills
│           ├── commands/              # Slash Commands
│           └── agents/                # Agents
├── docs/                              # 文档（不随包发布）
├── README.md                          # 本文件
└── package.json                       # monorepo 配置
```

> v1 完整代码已归档到 `archive/v1.5-full` 分支，主分支仅保留 v2。

---

## 🔄 更新机制

```bash
# 检查是否有新版本
bailu update --check

# 更新到最新版本
bailu update

# 自动重新部署 Skills（跳过确认）
bailu update --yes
```

---

## 📄 许可证

[MIT](./LICENSE)
