# 🦌 白鹿工作流 CLI

> **林深见鹿** — 在复杂的规则森林中，发现优雅的解决方案

[![npm version](https://img.shields.io/npm/v/@vickzhang/bailu-cli)](https://www.npmjs.com/package/@vickzhang/bailu-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**白鹿工作流 CLI**（`bailu`）是面向 AI 辅助开发场景的命令行工具，帮助团队和个人管理、分发、同步 AI 工具配置（Skills、Commands、Agents、Rules、Hooks、MCP），同时提供可视化 WebUI、交互式 TUI 仪表盘和团队协作功能。

---

## ✨ 功能特性

- 🖥️ **交互式 TUI 仪表盘** — `bailu` 无参数运行时展示系统信息、AI 工具状态、已安装工作流与快捷命令
- 🎨 **精美终端界面** — figlet Banner + gradient-string 渐变配色 + boxen 框架 + ora 动画
- 📦 **工作流管理** — 一键安装/卸载工作流到 Claude、Hanako、Codex 等主流 AI 工具
- 🌐 **WebUI 管理平台** — 本地 Web 界面，支持工作流管理、组件查看、AI 工具配置、项目管理、安全审计等
- 🔧 **MCP 服务管理** — 统一管理 Model Context Protocol 服务
- 🔗 **Git Hooks 管理** — 团队代码规范自动化
- 🔄 **团队配置同步** — Git 仓库同步，多人协作时保持 AI 工具配置一致
- 🔍 **安全审计** — 检查已安装配置的合规性与安全性
- 📊 **项目管理** — 管理多个项目的 Rules 配置

---

## 📦 安装

### 通过 npm 安装（推荐）

```bash
npm install -g @vickzhang/bailu-cli
```

### 通过源码安装

```bash
git clone git@github.com:liliMozi/bailu-cli.git
cd bailu-cli/packages/cli
npm link
```

### 工作流获取

工作流通过 Git 仓库拉取获取，不通过 npm 分发：

```bash
# 克隆工作流仓库
git clone git@xxx:SupEntra/SupEntra_ai_workflow.git

# 安装工作流
bailu install dev
bailu install ops
```

---

## 🚀 快速开始

### 1. 安装 CLI

```bash
npm install -g @vickzhang/bailu-cli
```

### 2. 初始化配置

```bash
bailu init
```

### 3. 安装工作流

```bash
# 安装开发工作流到 Claude
bailu install dev --agent claude

# 安装到 Hanako
bailu install dev --agent hanako

# 安装到 Codex
bailu install dev --agent codex
```

### 4. 启动 WebUI

```bash
bailu serve
# 访问 http://localhost:7070
```

---

## 🖥️ TUI 仪表盘

不带任何参数运行 `bailu` 时，将启动交互式仪表盘，展示：

- 🦌 **ASCII Banner**（figlet + gradient-string 渐变色）
- 💻 **系统信息** — Node.js 版本、操作系统、工作目录
- 🤖 **AI 工具状态** — 检测本机已安装的 Claude、Hanako、Codex 等工具
- 📦 **已安装工作流** — 列出当前部署的工作流版本
- ⚡ **快捷命令** — 常用操作一览，方便快速查阅

```bash
bailu          # 启动 TUI 仪表盘
```

---

## 🌐 WebUI 管理平台

运行以下命令启动本地 Web 界面：

```bash
bailu serve
# 默认监听 http://localhost:7070
# 自定义端口：bailu serve --port 8080
```

### 功能页面

| 页面 | 功能 |
|------|------|
| **工作区** | 系统概览、工作流快捷安装、AI 工具状态、当前项目 |
| **工作流** | 浏览/安装/卸载工作流，查看组件详情，配置发布状态 |
| **组件** | 查看已安装的 Skills、Commands、Agents、Hooks、Rules、MCP |
| **AI 工具** | 管理 Claude、Hanako、Codex 等工具的组件配置 |
| **项目管理** | 添加/管理项目路径，配置项目 Rules |
| **安全审计** | 检查配置安全性，计算信任分数 |
| **设置** | Git 远程仓库配置、团队同步、系统信息 |

---

## 📖 命令参考

### 核心命令

| 命令 | 说明 |
|------|------|
| `bailu` | 启动交互式 TUI 仪表盘 |
| `bailu init` | 初始化配置 |
| `bailu status` | 查看状态 |
| `bailu serve` | 启动 WebUI（默认 7070 端口） |
| `bailu config` | 打开配置目录 |

### 工作流管理

| 命令 | 说明 |
|------|------|
| `bailu install <workflow>` | 安装工作流到 AI 工具 |
| `bailu uninstall <workflow>` | 卸载工作流 |
| `bailu workflow list` | 列出可用工作流 |

### AI 工具管理

| 命令 | 说明 |
|------|------|
| `bailu tool install [tools...]` | 安装工作流到指定 AI 工具 |
| `bailu tool uninstall [tools...]` | 从 AI 工具卸载工作流 |
| `bailu tool status` | 查看工具安装状态 |

### 团队协作

| 命令 | 说明 |
|------|------|
| `bailu sync init <repo>` | 初始化团队仓库 |
| `bailu sync pull` | 拉取团队最新配置 |
| `bailu sync push [message]` | 推送本地配置 |
| `bailu sync diff` | 对比差异 |
| `bailu sync status` | 查看同步状态 |

### Hooks 管理

| 命令 | 说明 |
|------|------|
| `bailu hooks list` | 列出已安装的 hooks |
| `bailu hooks install <name>` | 安装 hook |
| `bailu hooks uninstall <name>` | 卸载 hook |
| `bailu hooks status` | 查看 hooks 状态 |

### MCP 服务

| 命令 | 说明 |
|------|------|
| `bailu mcp list` | 列出已配置的 MCP Servers |
| `bailu mcp add <name>` | 添加 MCP Server |
| `bailu mcp remove <name>` | 删除 MCP Server |
| `bailu mcp enable <name>` | 启用 MCP Server |
| `bailu mcp disable <name>` | 禁用 MCP Server |
| `bailu mcp templates` | 列出可用模板 |

### 安全审计

| 命令 | 说明 |
|------|------|
| `bailu audit` | 执行完整安全审计 |
| `bailu audit <type> <name>` | 审计指定组件 |

---

## 🔄 更新机制

| 组件 | 更新方式 | 命令 |
|------|---------|------|
| **CLI 工具** | npm 升级 | `npm update -g @vickzhang/bailu-cli` |
| **工作流配置** | Git 拉取 + 重新安装 | `git pull && bailu install dev` |
| **团队共享配置** | Git 同步 | `bailu sync pull` |

---

## 📁 项目结构

```
bailu-cli/
├── packages/
│   ├── cli/                          # 核心 CLI（发布到 npm）
│   │   ├── bin/bailu.js              # CLI 入口（含 TUI 仪表盘）
│   │   └── src/
│   │       ├── commands/             # 用户命令实现
│   │       ├── webui/                # WebUI 管理平台
│   │       │   ├── server/           # Express 服务端 API
│   │       │   └── client/           # 前端单文件应用
│   │       ├── installer/            # 工作流安装器
│   │       ├── hooks/                # Git Hooks 管理
│   │       ├── mcp/                  # MCP 服务管理
│   │       ├── sync/                 # 团队同步
│   │       ├── audit/                # 安全审计
│   │       └── utils/                # 工具函数
│   ├── workflow-dev/                 # 开发工作流（通过仓库获取）
│   ├── workflow-ops/                 # 运营工作流（个人使用）
│   ├── workflow-base/                # 基础工作流
│   ├── plugin-graphify/              # 知识图谱插件
│   ├── plugin-semble/                # 语义搜索插件
│   ├── plugin-agency/                # 代理编排插件
│   ├── plugin-agentmemory/           # Agent 记忆插件
│   └── plugin-ppt-skill/             # PPT 技能插件
├── dev.sh                            # 开发环境脚本
├── PLUGINS.md                        # 插件文档
└── package.json                      # monorepo 配置
```

---

## 🛠️ 开发指南

### 环境要求

- Node.js >= 14.0.0
- npm 或 yarn

### 本地开发

```bash
# 克隆仓库
git clone git@github.com:liliMozi/bailu-cli.git
cd bailu-cli

# 安装依赖
npm install

# 链接 CLI 到全局
cd packages/cli && npm link

# 启动开发模式
./dev.sh serve
```

### 发布

```bash
# 预览发布内容
BAILU_DEV=true ./dev.sh publish --dry-run

# 正式发布
BAILU_DEV=true ./dev.sh publish
```

> **注意**：只有 `@vickzhang/bailu-cli` 会发布到 npm，工作流通过 Git 仓库分发。

---

## 📋 更新日志

### v1.4.0

- 🚀 **workflow-dev v2.0.0 — SDD 七阶段研发管理**
- ✨ 引入 SDD 引擎作为默认流程：D1 任务评估 → D2 技术方案 → D3 评审 → D4 编码 → D5 代码评审 → D6 测试闭环 → D7 发版
- ✨ 三级规模路由：小需求（快速模式 1-2 轮）、中等需求（标准模式 3-5 轮）、大需求（完整模式）
- ✨ 新增 11 个 SDD Skills（bailu-sdd-start, d1-d7, d4-git-branch, openspec-workflow）
- ✨ sdd-context.md 状态持久化：支持断点恢复、多需求并行管理
- ✨ OpenSpec 使用时机自动判断
- ✨ 6 个 Agent 新增 SDD 阶段职责定义
- ✨ D7 发版支持通用 Git 平台（GitHub / GitLab / Gitee CLI）
- 📖 新增 SDD 研发管理文档页面

### v1.3.0

- 🔧 安装器多平台支持完善（Claude Code / Qoder / Trae / Cursor / Codex）
- ✨ `bailu install` 智能路由：自动识别工作流名和工具名
- 🔧 安装器 `--dry-run` 预览模式
- 🐛 WebUI 安装链路修复

### v1.2.0

- ✨ WebUI 全面升级：新增项目管理、安全审计、设置页面
- 🎨 自定义弹框组件，替代浏览器原生 alert/confirm
- 🔧 工作流安装支持选择目标 AI 工具
- 📊 组件统计扩展至 6 种类型（Skills、Commands、Agents、Hooks、Rules、MCP）
- 🔗 新增 Git 远程仓库配置功能
- 📦 发布配置可视化管理

### v1.1.0

- ✨ 新增交互式 TUI 仪表盘（`bailu` 无参数运行）
- 🎨 全面美化终端界面（figlet + gradient-string + boxen + ora）
- 🌐 新增 WebUI 管理平台（`bailu serve`）
- 🔧 MCP 服务管理命令
- 🔗 Git Hooks 管理命令
- 🔄 团队配置同步命令
- 🔍 安全审计功能

### v1.0.0

- 🎉 首次发布
- 📦 工作流安装/卸载
- 🛠️ AI 工具管理

---

## 📄 许可证

[MIT](./LICENSE)
