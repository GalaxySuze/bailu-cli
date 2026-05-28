---
layout: home

hero:
  name: 白鹿
  text: 工作流
  tagline: 在复杂的规则森林中，发现优雅的解决方案。将精心设计的 Skills、Commands、Agents、Rules 打包为可复用的工作流。
  actions:
    - theme: brand
      text: 快速开始 →
      link: /guide/getting-started
    - theme: alt
      text: GitHub
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

<style>
/* ─── 首页深度定制：编辑杂志感风格 ────────────────────────────────────────── */

/* Hero 区域 */
.VPHero {
  padding: 48px 0 32px !important;
}

.VPHero .name {
  font-family: "Charter", "Iowan Old Style", Georgia, "Times New Roman", serif !important;
  font-size: clamp(40px, 6vw, 64px) !important;
  font-weight: 500 !important;
  letter-spacing: -0.02em !important;
  line-height: 1.05 !important;
  color: var(--vp-c-text-1) !important;
}

.VPHero .text {
  font-family: "Charter", "Iowan Old Style", Georgia, "Times New Roman", serif !important;
  font-size: clamp(40px, 6vw, 64px) !important;
  font-weight: 500 !important;
  letter-spacing: -0.02em !important;
  line-height: 1.05 !important;
  color: var(--vp-c-brand-1) !important;
  display: block !important;
}

.VPHero .tagline {
  font-size: 17px !important;
  color: var(--vp-c-text-3) !important;
  max-width: 520px !important;
  line-height: 1.55 !important;
  margin: 16px 0 24px !important;
}

/* Feature 卡片：模块入口风格 */
.VPFeatures {
  padding: 32px 0 48px !important;
}

.VPFeatures .container {
  max-width: 860px !important;
}

.VPFeatures .items {
  display: grid !important;
  grid-template-columns: repeat(3, 1fr) !important;
  gap: 16px !important;
  margin: 0 !important;
}

.VPFeatures .item {
  width: auto !important;
  padding: 0 !important;
}

@media (max-width: 768px) {
  .VPFeatures .items {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 480px) {
  .VPFeatures .items {
    grid-template-columns: 1fr !important;
  }
}

.VPFeature {
  background: var(--vp-c-bg-alt) !important;
  border: 1px solid var(--vp-c-border) !important;
  border-radius: 12px !important;
  padding: 24px !important;
  transition: all 200ms cubic-bezier(0.25, 0.1, 0.25, 1) !important;
  cursor: pointer !important;
  text-decoration: none !important;
}

.VPFeature:hover {
  transform: translateY(-2px) !important;
  border-color: var(--vp-c-text-4) !important;
  box-shadow: 0 1px 2px rgba(20, 20, 19, 0.04), 0 4px 16px rgba(20, 20, 19, 0.04) !important;
}

.VPFeature .VPFeature-icon {
  width: 40px !important;
  height: 40px !important;
  border-radius: 8px !important;
  background: var(--vp-c-bg-elv) !important;
  display: grid !important;
  place-items: center !important;
  font-size: 20px !important;
  margin-bottom: 16px !important;
}

.VPFeature .title {
  font-family: "Charter", "Iowan Old Style", Georgia, "Times New Roman", serif !important;
  font-size: 18px !important;
  font-weight: 500 !important;
  color: var(--vp-c-text-1) !important;
  margin-bottom: 8px !important;
  line-height: 1.3 !important;
}

.VPFeature .details {
  font-size: 13px !important;
  color: var(--vp-c-text-3) !important;
  line-height: 1.55 !important;
}

/* 首页底部内容区域 */
.VPHome .container {
  max-width: 860px !important;
  margin: 0 auto !important;
}

/* 快速开始代码块 */
.VPHome .container > div:not(.VPFeatures):not(.VPHero) {
  background: var(--vp-c-bg-alt) !important;
  border: 1px solid var(--vp-c-border) !important;
  border-radius: 12px !important;
  padding: 24px !important;
  margin-bottom: 24px !important;
}

.VPHome .container > div:not(.VPFeatures):not(.VPHero) h2 {
  font-family: "Charter", "Iowan Old Style", Georgia, "Times New Roman", serif !important;
  font-size: 20px !important;
  font-weight: 500 !important;
  color: var(--vp-c-text-1) !important;
  margin: 0 0 16px !important;
  padding-bottom: 0 !important;
  border-bottom: none !important;
}

.VPHome .container > div:not(.VPFeatures):not(.VPHero) table {
  border-collapse: collapse !important;
  font-size: 14px !important;
}

.VPHome .container > div:not(.VPFeatures):not(.VPHero) th {
  color: var(--vp-c-text-4) !important;
  font-weight: 500 !important;
  font-family: ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace !important;
  font-size: 10px !important;
  letter-spacing: 0.08em !important;
  text-transform: uppercase !important;
  padding: 8px 12px !important;
  border-bottom: 1px solid var(--vp-c-border) !important;
}

.VPHome .container > div:not(.VPFeatures):not(.VPHero) td {
  padding: 8px 12px !important;
  border-bottom: 1px solid var(--vp-c-border) !important;
  color: var(--vp-c-text-2) !important;
}

.VPHome .container > div:not(.VPFeatures):not(.VPHero) code {
  font-family: ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace !important;
  font-size: 13px !important;
  color: var(--vp-c-brand-1) !important;
  background: var(--vp-c-bg-elv) !important;
  padding: 2px 6px !important;
  border-radius: 4px !important;
}

.VPHome .container > div:not(.VPFeatures):not(.VPHero) tbody tr:hover {
  background: var(--vp-c-bg-elv) !important;
}

/* 提示框样式 */
.VPHome .custom-block {
  background: var(--vp-c-bg-alt) !important;
  border: 1px solid var(--vp-c-border) !important;
  border-radius: 12px !important;
  padding: 20px !important;
  box-shadow: inset 3px 0 0 var(--vp-c-brand-1) !important;
}

.VPHome .custom-block .custom-block-title {
  font-family: "Charter", "Iowan Old Style", Georgia, "Times New Roman", serif !important;
  color: var(--vp-c-brand-1) !important;
  font-weight: 600 !important;
  font-size: 15px !important;
  margin-bottom: 8px !important;
}

.VPHome .custom-block ul {
  margin: 8px 0 0 !important;
  padding-left: 20px !important;
}

.VPHome .custom-block li {
  font-size: 14px !important;
  color: var(--vp-c-text-2) !important;
  margin-bottom: 6px !important;
  line-height: 1.5 !important;
}

.VPHome .custom-block li strong {
  color: var(--vp-c-text-1) !important;
  font-weight: 600 !important;
}
</style>

<div style="max-width: 860px; margin: 0 auto; padding: 0 24px;">

## 快速开始

<div style="background: var(--vp-c-bg-alt); border: 1px solid var(--vp-c-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">

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

</div>

## 核心命令

<div style="background: var(--vp-c-bg-alt); border: 1px solid var(--vp-c-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">

| 命令 | 说明 |
|------|------|
| `bailu` | 显示 TUI 仪表盘 |
| `bailu init` | 初始化配置 |
| `bailu workflow install <name>` | 安装工作流 |
| `bailu tool install <name>` | 安装 AI 工具配置 |
| `bailu serve` | 启动 WebUI |
| `bailu sync push` | 推送配置到 Git |
| `bailu sync pull` | 拉取团队配置 |

</div>

## 支持的 AI 工具

<div style="background: var(--vp-c-bg-alt); border: 1px solid var(--vp-c-border); border-radius: 12px; padding: 20px; box-shadow: inset 3px 0 0 var(--vp-c-brand-1);">

白鹿工作流支持以下 AI 编程工具：

- **Claude Code** - Anthropic 出品的 AI 编程助手
- **Hanako** - 个人 AI 助手
- **Codex** - OpenAI 的代码生成模型
- **Cursor** - AI 原生的代码编辑器
- **Hermes** - 轻量级 AI 编程助手
- **Trae** - 字节跳动出品的 AI 编程工具

</div>

</div>
