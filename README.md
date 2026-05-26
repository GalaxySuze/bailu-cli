# 🦌 白鹿工作流 CLI

> **林深见鹿** — 在复杂的规则森林中，发现优雅的解决方案

[![npm version](https://img.shields.io/npm/v/@vickzhang/bailu-cli)](https://www.npmjs.com/package/@vickzhang/bailu-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**白鹿工作流 CLI**（`bailu`）是面向 AI 辅助开发场景的命令行工具，帮助团队和个人管理、分发、同步 AI 工具配置（Skills、Commands、Agents、Rules），同时提供 AI 工具推荐、可视化 WebUI 和交互式 TUI 仪表盘。

---

## ✨ 功能特性

- 🖥️ **交互式 TUI 仪表盘** — `bailu` 无参数运行时展示系统信息、AI 工具状态、已安装工作流与快捷命令
- 🎨 **精美终端界面** — figlet Banner + gradient-string 渐变配色 + boxen 框架 + ora 动画
- 📦 **工作流管理** — 一键安装/卸载工作流到 Cursor、Claude、Windsurf 等主流 AI 工具
- 🌐 **WebUI 可视化** — 本地 Web 界面，一览工具状态与推荐社区
- 🔧 **MCP 服务管理** — 统一管理 Model Context Protocol 服务
- 🔗 **Git Hooks 管理** — 团队代码规范自动化
- 🔄 **团队配置同步** — 多人协作时保持 AI 工具配置一致
- 💡 **AI 工具推荐** — 内置精选 AI 工具数据库，支持社区贡献
- 🔍 **工具审计** — 检查已安装配置的合规性

---

## 📦 安装包列表

| 包名 | 说明 | 安装命令 |
|------|------|----------|
| `@vickzhang/bailu-cli` | 核心 CLI 工具（本包） | `npm install -g @vickzhang/bailu-cli` |
| `@vickzhang/bailu-workflow-dev` | 开发工作流（团队协作） | `npm install -g @vickzhang/bailu-workflow-dev` |
| `@vickzhang/bailu-workflow-ops` | 运营工作流（个人使用） | `npm install -g @vickzhang/bailu-workflow-ops` |
| `@vickzhang/bailu-plugin-graphify` | 知识图谱生成器插件 | `bailu plugin install graphify` |
| `@vickzhang/bailu-plugin-semble` | 语义代码搜索插件 | `bailu plugin install semble` |

---

## 🚀 快速开始

### 场景一：团队开发

```bash
# 安装 CLI 与开发工作流
npm install -g @vickzhang/bailu-cli @vickzhang/bailu-workflow-dev

# 初始化配置
bailu init

# 将工作流安装到 AI 工具
bailu tool install

# 可选：安装知识图谱或语义搜索插件
bailu plugin install graphify
bailu plugin install semble
```

### 场景二：个人使用

```bash
# 安装 CLI 与运营工作流
npm install -g @vickzhang/bailu-cli @vickzhang/bailu-workflow-ops

# 初始化配置
bailu init

# 将工作流安装到 AI 工具
bailu tool install
```

安装完成后，直接运行 `bailu` 打开交互式 TUI 仪表盘：

```bash
bailu
```

---

## 🖥️ TUI 仪表盘

不带任何参数运行 `bailu` 时，将启动交互式仪表盘，展示：

- 🦌 **ASCII Banner**（figlet + gradient-string 渐变色）
- 💻 **系统信息** — Node.js 版本、操作系统、工作目录
- 🤖 **AI 工具状态** — 检测本机已安装的 Cursor、Claude Desktop、Windsurf 等工具
- 📦 **已安装工作流** — 列出当前部署的工作流包版本
- ⚡ **快捷命令** — 常用操作一览，方便快速查阅

```bash
bailu          # 启动 TUI 仪表盘
```

---

## 🌐 WebUI

运行以下命令启动本地 Web 界面，默认监听 `http://localhost:7070`：

```bash
bailu serve
```

WebUI 提供以下页面：

- **工具状态总览** — 可视化展示已安装的 AI 工具与工作流
- **AI 工具推荐** — 浏览社区推荐的 AI 工具，支持用户提交

---

## 💡 AI 工具推荐（`bailu recommend`）

内置精选 AI 工具数据库，帮助发现适合工作流的 AI 工具：

```bash
# 查看推荐工具列表
bailu recommend list

# 查看某工具的详细信息
bailu recommend info <name>

# 提交工具推荐（社区贡献）
bailu recommend add
```

---

## 📖 完整命令参考

### 核心命令

| 命令 | 说明 |
|------|------|
| `bailu` | 启动交互式 TUI 仪表盘 |
| `bailu init` | 初始化配置（首次使用必须执行） |
| `bailu status` | 查看 AI 工具安装状态 |

### 工作流管理

| 命令 | 说明 |
|------|------|
| `bailu install <workflow>` | 安装工作流到当前 AI 工具 |
| `bailu uninstall <workflow>` | 卸载指定工作流 |
| `bailu tool install` | 一键安装 AI 工具配置 |

### 团队协作

| 命令 | 说明 |
|------|------|
| `bailu sync pull` | 拉取团队最新配置 |
| `bailu sync push` | 推送本地配置到团队 |
| `bailu hooks` | 管理 Git Hooks |

### MCP 服务

| 命令 | 说明 |
|------|------|
| `bailu mcp install` | 安装 MCP 服务 |
| `bailu mcp list` | 列出已安装的 MCP 服务 |
| `bailu mcp remove` | 移除 MCP 服务 |

### AI 工具推荐

| 命令 | 说明 |
|------|------|
| `bailu recommend list` | 查看推荐 AI 工具列表 |
| `bailu recommend info <name>` | 查看工具详细信息 |
| `bailu recommend add` | 提交工具推荐 |

### 其他

| 命令 | 说明 |
|------|------|
| `bailu serve` | 启动 WebUI（localhost:7070） |
| `bailu audit` | 审计已安装的工具配置 |

---

## 🔄 更新机制

白鹿工作流采用**双轨更新机制**，CLI 本体与 AI 工具配置的更新方式相互独立：

| 组件 | 更新方式 | 命令 |
|------|---------|------|
| **CLI 工具本体** | npm 升级 | `npm update -g @vickzhang/bailu-cli` |
| **AI 工具配置**（Skills/Commands/Agents/Rules） | 重新安装工作流 | `bailu install <workflow>` |
| **团队共享配置** | 团队同步 | `bailu sync pull` |

```bash
# 升级 CLI
npm update -g @vickzhang/bailu-cli

# 更新工作流配置（拉取新版后重新部署）
bailu install dev --agent claude

# 同步团队配置
bailu sync pull
```

---

## 📁 目录结构

```
bailu-cli/
├── packages/
│   ├── cli/                          # @vickzhang/bailu-cli
│   │   ├── bin/bailu.js              # CLI 入口（含 TUI 仪表盘）
│   │   ├── src/
│   │   │   ├── commands/             # 用户命令
│   │   │   │   └── recommend.js      # AI 工具推荐（v1.1.0 新增）
│   │   │   ├── data/
│   │   │   │   └── recommended-tools.json  # 内置工具数据
│   │   │   ├── webui/
│   │   │   │   ├── server/           # Express 服务端
│   │   │   │   └── client/           # 单文件 WebUI
│   │   │   └── utils/
│   │   └── package.json
│   ├── workflow-dev/                 # @vickzhang/bailu-workflow-dev
│   ├── workflow-ops/                 # @vickzhang/bailu-workflow-ops
│   ├── plugin-graphify/              # @vickzhang/bailu-plugin-graphify
│   └── plugin-semble/                # @vickzhang/bailu-plugin-semble
├── dev.sh                            # 开发环境脚本
├── PLUGINS.md                        # 插件文档
└── package.json                      # monorepo 配置
```

---

## 🛠️ 开发指南

### 环境准备

```bash
# 克隆仓库并安装依赖
git clone <repo-url>
cd bailu-cli
npm install
```

### 本地开发

```bash
# 链接 CLI 到全局
cd packages/cli && npm link

# 链接工作流包
cd packages/workflow-dev && npm link
cd packages/workflow-ops && npm link
```

### 发布

```bash
# 预览发布内容（dry run）
./dev.sh publish --dry-run

# 正式发布所有包
./dev.sh publish
```

---

## 📋 更新日志

### v1.1.0

- ✨ 新增交互式 TUI 仪表盘（`bailu` 无参数运行）
- 🎨 全面美化终端界面（figlet + gradient-string + boxen + ora）
- 💡 新增 `bailu recommend` 命令及子命令（list/info/add）
- 🌐 WebUI 新增 AI 工具推荐页面
- 🗑️ 移除插件系统中的 ppt-skill、agency、agentmemory 插件

### v1.0.0

- 🎉 首次发布

---

## 📄 许可证

[MIT](./LICENSE)
