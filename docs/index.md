---
layout: home

hero:
  name: 白鹿
  text: 工作流
  tagline: 林深见鹿。在复杂的规则森林中，发现优雅的解决方案。一个交互式向导、一份状态文件、一套工作流，让 AI 协同开发回归本质。
  actions:
    - theme: brand
      text: 快速开始 →
      link: /guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/vickzhang/bailu-cli

features:
  - icon: 🦌
    title: 极简哲学
    details: 5 个命令、1 个状态文件、1 套工作流。从安装到上手只需 3 分钟，不再陷入 35 命令的瑞士军刀
  - icon: 📐
    title: SDD 七阶段
    details: 从需求到上线的完整研发链路。三级规模路由自动适配小/中/大需求，Skills 驱动 AI 全程协同
  - icon: 🤖
    title: Goal 无人值守
    details: 让 AI 该跑时跑、该停时停，停下后知道为什么停，恢复后知道从哪继续。launchd 守护 + 状态机收敛
  - icon: 🛠️
    title: 多工具支持
    details: 一份配置打通 Claude Code 与 Qoder。每个工具都遵守相同的 Skills / Commands / Agents 契约
  - icon: 🔒
    title: 项目级隔离
    details: 配置写在项目 .bailu.yaml，不污染全局环境。多项目并存、不同版本互不干扰
  - icon: 📦
    title: npm 一键分发
    details: 跟随 @vickzhang/bailu-cli 走 npm 标准分发。安装体积 < 5MB、依赖 < 50 个、代码 < 3000 行
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
.VPFeatures { padding: 32px 0 48px !important; }
.VPFeatures .container { max-width: 860px !important; }
.VPFeatures .items {
  display: grid !important;
  grid-template-columns: repeat(3, 1fr) !important;
  gap: 16px !important;
  margin: 0 !important;
}
.VPFeatures .item { width: auto !important; padding: 0 !important; }
@media (max-width: 768px) { .VPFeatures .items { grid-template-columns: repeat(2, 1fr) !important; } }
@media (max-width: 480px) { .VPFeatures .items { grid-template-columns: 1fr !important; } }

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

/* 首页底部内容区 */
.VPHome .container { max-width: 860px !important; margin: 0 auto !important; }

.home-section {
  background: var(--vp-c-bg-alt) !important;
  border: 1px solid var(--vp-c-border) !important;
  border-radius: 12px !important;
  padding: 24px !important;
  margin-bottom: 24px !important;
}
.home-section h2 {
  font-family: "Charter", "Iowan Old Style", Georgia, "Times New Roman", serif !important;
  font-size: 20px !important;
  font-weight: 500 !important;
  color: var(--vp-c-text-1) !important;
  margin: 0 0 16px !important;
  padding-bottom: 0 !important;
  border-bottom: none !important;
}
.home-section table { border-collapse: collapse !important; font-size: 14px !important; width: 100% !important; }
.home-section th {
  color: var(--vp-c-text-4) !important;
  font-weight: 500 !important;
  font-family: ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace !important;
  font-size: 10px !important;
  letter-spacing: 0.08em !important;
  text-transform: uppercase !important;
  padding: 8px 12px !important;
  border-bottom: 1px solid var(--vp-c-border) !important;
  text-align: left !important;
}
.home-section td {
  padding: 8px 12px !important;
  border-bottom: 1px solid var(--vp-c-border) !important;
  color: var(--vp-c-text-2) !important;
}
.home-section code {
  font-family: ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace !important;
  font-size: 13px !important;
  color: var(--vp-c-brand-1) !important;
  background: var(--vp-c-bg-elv) !important;
  padding: 2px 6px !important;
  border-radius: 4px !important;
}
.home-section tbody tr:hover { background: var(--vp-c-bg-elv) !important; }

.home-tip {
  background: var(--vp-c-bg-alt) !important;
  border: 1px solid var(--vp-c-border) !important;
  border-radius: 12px !important;
  padding: 20px !important;
  box-shadow: inset 3px 0 0 var(--vp-c-brand-1) !important;
  margin-bottom: 24px !important;
}
.home-tip strong { color: var(--vp-c-text-1) !important; }
</style>

<div style="max-width: 860px; margin: 0 auto; padding: 0 24px;">

<div class="home-section">

## 30 秒上手

```bash
# 1. 全局安装
npm install -g @vickzhang/bailu-cli

# 2. 进入项目，交互式初始化
cd your-project
bailu init

# 3. 查看状态
bailu status
```

</div>

<div class="home-section">

## 5 个核心命令

| 命令 | 说明 |
|------|------|
| `bailu init` | 交互式向导：选择 AI 工具、语言、范围，自动安装 Skills/Commands/Agent/MCP |
| `bailu status` | 查看当前项目的安装状态和下一步指引 |
| `bailu update` | 更新工作流到最新版本（重新部署 Skills） |
| `bailu doctor` | 环境诊断：检查 Node.js、平台、Git 仓库 |
| `bailu reset` | 重置：清除已安装的配置，回到初始状态 |

</div>

<div class="home-section">

## Goal 无人值守（v2 新增）

```bash
# 在项目中初始化 Goal 协议
bailu goal init

# 手动跑一轮
bailu goal run

# 安装 launchd 进入无人值守
bailu goal install-launchd --interval 1800
```

通过 `.goal/` 文件系统作为唯一事实源，让 Claude / Codex 都能按同一套契约独立执行，形成可恢复、可审计、可暂停、可验收的开发模式。

</div>

<div class="home-tip">

**新版本要点（v2.0.0）**

- 从 35 命令瑞士军刀精简为 **5 + 7 个命令**
- 移除 WebUI / TUI，专注 CLI 体验
- 配置从全局 <code>~/.bailu/</code> 迁移到项目级 <code>.bailu.yaml</code>
- 新增 <strong>Goal 无人值守模式</strong>，托管 AI 长期目标
- 安装体积 < 5MB、依赖 < 50 个、代码 < 3000 行

</div>

</div>
