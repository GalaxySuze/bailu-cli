---
layout: home

hero:
  name: 白鹿工作流
  text: AI Coding 环境管理工具
  tagline: 在复杂的规则森林中，发现优雅的解决方案
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 在 GitHub 上查看
      link: https://github.com/vickzhang/bailu-cli

features:
  - icon: 🦌
    title: 林深见鹿
    details: 在复杂的 AI 工具生态中，发现优雅的工作流解决方案
  - icon: 🛠️
    title: 多工具统一
    details: 支持 Claude Code、Codex、Cursor、Windsurf、Hanako 等主流 AI 编程工具
  - icon: 📦
    title: 工作流复用
    details: 将精心设计的 Skills/Commands/Agents/Rules 打包为可复用的工作流
  - icon: 👥
    title: 团队协作
    details: 基于 Git 的配置同步机制，保持团队 AI 工具配置统一
  - icon: 🖥️
    title: TUI 仪表盘
    details: 精美的终端仪表盘，一览 AI 工具状态和组件统计
  - icon: 🌐
    title: WebUI 管理
    details: 图形界面管理工作流、组件、项目和安全审计
---

## 快速安装

```bash
# 全局安装
npm install -g @vickzhang/bailu-cli

# 初始化配置
bailu init

# 安装开发工作流
bailu workflow install dev

# 查看状态
bailu status
```

## 核心命令

| 命令 | 说明 |
|------|------|
| `bailu` | 显示 TUI 仪表盘 |
| `bailu init` | 初始化配置 |
| `bailu workflow install <name>` | 安装工作流 |
| `bailu tool install <name>` | 安装 AI 工具配置 |
| `bailu serve` | 启动 WebUI |
| `bailu sync push` | 推送配置到 Git |
| `bailu sync pull` | 拉取团队配置 |

## 支持的 AI 工具

<div class="tip custom-block" style="padding-top: 8px;">

白鹿工作流支持以下 AI 编程工具：

- **Claude Code** - Anthropic 出品的 AI 编程助手
- **Hanako** - 个人 AI 助手
- **Codex** - OpenAI 的代码生成模型
- **Cursor** - AI 原生的代码编辑器
- **Hermes** - 轻量级 AI 编程助手
- **Trae** - 字节跳动出品的 AI 编程工具

</div>
