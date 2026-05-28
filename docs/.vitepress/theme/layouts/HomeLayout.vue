<!--
  白鹿工作流文档首页 - 自定义布局
  设计参考：Claude (Anthropic) 编辑杂志感风格
  特点：紧凑、复古、时尚
-->
<script setup>
import { useData } from 'vitepress'

const { frontmatter, theme } = useData()

/**
 * 从 frontmatter 中提取模块入口数据
 * @type {Array<{icon: string, eyebrow: string, title: string, desc: string, meta: string, link: string}>}
 */
const modules = [
  {
    icon: '🦌',
    eyebrow: '工作流',
    title: '林深见鹿',
    desc: '在复杂的 AI 工具生态中，发现优雅的工作流解决方案',
    meta: '核心概念',
    link: '/guide/workflow-concepts'
  },
  {
    icon: '🛠️',
    eyebrow: '工具管理',
    title: '多工具统一',
    desc: '支持 Claude Code、Codex、Cursor、Windsurf、Hanako 等主流 AI 编程工具',
    meta: '6+ 工具',
    link: '/guide/ai-tools'
  },
  {
    icon: '📦',
    eyebrow: '组件系统',
    title: '工作流复用',
    desc: '将精心设计的 Skills/Commands/Agents/Rules 打包为可复用的工作流',
    meta: '4 种类型',
    link: '/guide/components'
  },
  {
    icon: '👥',
    eyebrow: '团队协作',
    title: '配置同步',
    desc: '基于 Git 的配置同步机制，保持团队 AI 工具配置统一',
    meta: 'Git 同步',
    link: '/guide/team'
  },
  {
    icon: '🖥️',
    eyebrow: '终端界面',
    title: 'TUI 仪表盘',
    desc: '精美的终端仪表盘，一览 AI 工具状态和组件统计',
    meta: '实时监控',
    link: '/guide/tui'
  },
  {
    icon: '🌐',
    eyebrow: '图形界面',
    title: 'WebUI 管理',
    desc: '图形界面管理工作流、组件、项目和安全审计',
    meta: '可视化',
    link: '/guide/webui'
  }
]

/**
 * 核心命令数据
 * @type {Array<{cmd: string, desc: string}>}
 */
const commands = [
  { cmd: 'bailu', desc: 'TUI 仪表盘' },
  { cmd: 'bailu init', desc: '初始化配置' },
  { cmd: 'bailu workflow', desc: '工作流管理' },
  { cmd: 'bailu tool', desc: '工具管理' },
  { cmd: 'bailu serve', desc: '启动 WebUI' },
  { cmd: 'bailu sync', desc: '配置同步' }
]

/**
 * 支持的 AI 工具数据
 * @type {Array<{icon: string, name: string, vendor: string}>}
 */
const tools = [
  { icon: '🤖', name: 'Claude Code', vendor: 'Anthropic 出品' },
  { icon: '🌸', name: 'Hanako', vendor: '个人 AI 助手' },
  { icon: '🔮', name: 'Codex', vendor: 'OpenAI 代码生成' },
  { icon: '📝', name: 'Cursor', vendor: 'AI 原生编辑器' },
  { icon: '⚡', name: 'Hermes', vendor: '轻量级助手' },
  { icon: '🌊', name: 'Trae', vendor: '字节跳动出品' }
]
</script>

<template>
  <div class="home-layout">
    <!-- 顶部导航栏 -->
    <header class="home-nav">
      <div class="nav-inner">
        <a href="/" class="nav-brand">
          <span class="brand-mark">鹿</span>
          <span class="brand-name">白鹿工作流</span>
        </a>
        <nav class="nav-links">
          <a href="/guide/" class="nav-link">指南</a>
          <a href="/api/" class="nav-link">API</a>
          <a href="https://github.com/vickzhang/bailu-cli" class="nav-link" target="_blank">GitHub</a>
        </nav>
      </div>
    </header>

    <main class="home-main">
      <!-- ================================================================
           Hero 区域：编辑杂志感的开场
           ============================================================ -->
      <section class="home-hero">
        <div class="hero-content">
          <p class="eyebrow">AI Coding · 工作流管理</p>
          <h1>白鹿<em>工作流</em></h1>
          <p class="tagline">在复杂的规则森林中，发现优雅的解决方案。将精心设计的 Skills、Commands、Agents、Rules 打包为可复用的工作流。</p>
          <div class="hero-actions">
            <a href="/guide/getting-started" class="btn btn-primary">快速开始 →</a>
            <a href="https://github.com/vickzhang/bailu-cli" class="btn btn-secondary" target="_blank">GitHub</a>
          </div>
        </div>
      </section>

      <!-- ================================================================
           模块入口：编辑杂志感的"目录"
           ============================================================ -->
      <section class="modules-section">
        <div class="section-header">
          <h2>核心功能</h2>
          <span class="meta">6 个模块 · 一站式管理</span>
        </div>

        <div class="modules-grid">
          <a
            v-for="mod in modules"
            :key="mod.link"
            :href="mod.link"
            class="module-card"
          >
            <div class="module-mark">{{ mod.icon }}</div>
            <p class="card-eyebrow">{{ mod.eyebrow }}</p>
            <h3>{{ mod.title }}</h3>
            <p class="card-desc">{{ mod.desc }}</p>
            <div class="module-foot">
              <span class="meta">{{ mod.meta }}</span>
              <span class="arrow">→</span>
            </div>
          </a>
        </div>
      </section>

      <!-- ================================================================
           快速开始 + 核心命令：双栏布局
           ============================================================ -->
      <section class="quickstart-section">
        <!-- 快速开始 -->
        <div class="card">
          <div class="card-head">
            <h3>快速开始</h3>
            <span class="meta">4 步上手</span>
          </div>
          <div class="code-block">
            <pre><code># 1. 全局安装
npm install -g @vickzhang/bailu-cli

# 2. 初始化配置
bailu init

# 3. 安装开发工作流
bailu workflow install dev

# 4. 查看状态
bailu status</code></pre>
          </div>
        </div>

        <!-- 核心命令 -->
        <div class="card">
          <div class="card-head">
            <h3>核心命令</h3>
            <span class="meta">常用操作</span>
          </div>

          <table class="command-table">
            <thead>
              <tr>
                <th>命令</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cmd in commands" :key="cmd.cmd">
                <td><code>{{ cmd.cmd }}</code></td>
                <td>{{ cmd.desc }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ================================================================
           支持的 AI 工具：底部"延伸阅读"
           ============================================================ -->
      <section class="tools-section">
        <div class="section-header">
          <h2>支持的 AI 工具</h2>
          <span class="meta">6 个主流工具</span>
        </div>

        <div class="tools-grid">
          <div v-for="tool in tools" :key="tool.name" class="tool-item">
            <div class="tool-icon">{{ tool.icon }}</div>
            <div class="tool-info">
              <h4>{{ tool.name }}</h4>
              <p>{{ tool.vendor }}</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 底部页脚 -->
    <footer class="home-footer">
      <div class="footer-inner">
        <p class="footer-text">基于 MIT 许可发布</p>
        <p class="footer-text">Copyright © 2024 白鹿工作流</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ─── 全局容器 ────────────────────────────────────────────────────────────── */
.home-layout {
  min-height: 100vh;
  background: var(--vp-c-bg);
  display: flex;
  flex-direction: column;
}

/* ─── 顶部导航栏 ──────────────────────────────────────────────────────────── */
.home-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  background: color-mix(in oklch, var(--vp-c-bg) 92%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--vp-c-border);
  height: 56px;
}

.nav-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--vp-c-text-1);
}

.brand-mark {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  color: #faf9f5;
  display: grid;
  place-items: center;
  font-family: var(--vp-font-family-heading);
  font-size: 14px;
  flex-shrink: 0;
}

.brand-name {
  font-family: var(--vp-font-family-heading);
  font-size: 17px;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  font-size: 14px;
  color: var(--vp-c-text-3);
  padding: 6px 10px;
  border-radius: 6px;
  transition: all 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
  text-decoration: none;
}

.nav-link:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-elv);
}

/* ─── 主内容区 ────────────────────────────────────────────────────────────── */
.home-main {
  flex: 1;
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 24px;
  width: 100%;
}

/* ─── Hero 区域：编辑杂志感的开场 ──────────────────────────────────────────── */
.home-hero {
  margin-bottom: 56px;
}

.hero-content {
  max-width: 640px;
}

.home-hero .eyebrow {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
  margin-bottom: 16px;
}

.home-hero h1 {
  font-family: var(--vp-font-family-heading);
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: var(--vp-c-text-1);
  margin: 0 0 16px;
}

.home-hero h1 em {
  font-style: normal;
  color: var(--vp-c-brand-1);
}

.home-hero .tagline {
  font-size: 18px;
  color: var(--vp-c-text-3);
  line-height: 1.55;
  max-width: 560px;
  margin: 0 0 24px;
}

.hero-actions {
  display: flex;
  gap: 10px;
}

/* ─── 按钮样式 ────────────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 8px;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.005em;
  transition: all 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
  white-space: nowrap;
  cursor: pointer;
  text-decoration: none;
}

.btn:active {
  transform: translateY(1px);
}

.btn-primary {
  background: var(--vp-c-brand-1);
  color: #faf9f5;
  border-color: var(--vp-c-brand-1);
}

.btn-primary:hover {
  background: var(--vp-c-brand-2);
  border-color: var(--vp-c-brand-2);
  color: #faf9f5;
}

.btn-secondary {
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-2);
  box-shadow: inset 0 0 0 1px var(--vp-c-divider);
}

.btn-secondary:hover {
  background: var(--vp-c-bg-alt);
  box-shadow: inset 0 0 0 1px var(--vp-c-text-4);
}

/* ─── 段落标题 ────────────────────────────────────────────────────────────── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-header h2 {
  font-family: var(--vp-font-family-heading);
  font-size: 22px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  margin: 0;
}

.meta {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-4);
}

/* ─── 模块入口卡：编辑杂志感的"目录" ──────────────────────────────────────── */
.modules-section {
  margin-bottom: 56px;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .modules-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .modules-grid {
    grid-template-columns: 1fr;
  }
}

.module-card {
  display: block;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 24px;
  transition: all 200ms cubic-bezier(0.25, 0.1, 0.25, 1);
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}

.module-card:hover {
  transform: translateY(-2px);
  border-color: var(--vp-c-text-4);
  box-shadow: 0 1px 2px rgba(20, 20, 19, 0.04), 0 4px 16px rgba(20, 20, 19, 0.04);
}

.module-mark {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-2);
  display: grid;
  place-items: center;
  font-size: 20px;
  margin-bottom: 16px;
}

.card-eyebrow {
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
  margin: 0 0 6px;
}

.module-card h3 {
  font-family: var(--vp-font-family-heading);
  font-size: 18px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  margin: 0 0 8px;
  line-height: 1.3;
}

.card-desc {
  font-size: 13px;
  color: var(--vp-c-text-3);
  line-height: 1.55;
  margin: 0 0 16px;
}

.module-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid var(--vp-c-border);
}

.arrow {
  font-family: var(--vp-font-family-heading);
  font-size: 16px;
  color: var(--vp-c-text-4);
  transition: all 150ms ease;
}

.module-card:hover .arrow {
  color: var(--vp-c-brand-1);
  transform: translateX(4px);
}

/* ─── 快速开始 + 核心命令：双栏布局 ──────────────────────────────────────── */
.quickstart-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 56px;
}

@media (max-width: 768px) {
  .quickstart-section {
    grid-template-columns: 1fr;
  }
}

/* ─── 卡片样式 ────────────────────────────────────────────────────────────── */
.card {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 24px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.card-head h3 {
  font-family: var(--vp-font-family-heading);
  font-size: 18px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  margin: 0;
}

/* ─── 代码块 ──────────────────────────────────────────────────────────────── */
.code-block {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  overflow: hidden;
}

.code-block pre {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
}

.code-block code {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

/* ─── 命令表格 ────────────────────────────────────────────────────────────── */
.command-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.command-table th,
.command-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--vp-c-border);
}

.command-table th {
  color: var(--vp-c-text-4);
  font-weight: 500;
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.command-table tbody tr {
  transition: background 150ms ease;
}

.command-table tbody tr:hover {
  background: var(--vp-c-bg-elv);
}

.command-table code {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-elv);
  padding: 2px 6px;
  border-radius: 4px;
}

/* ─── AI 工具支持：底部"延伸阅读" ──────────────────────────────────────────── */
.tools-section {
  margin-bottom: 56px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .tools-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .tools-grid {
    grid-template-columns: 1fr;
  }
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 10px;
  transition: all 150ms ease;
}

.tool-item:hover {
  border-color: var(--vp-c-text-4);
}

.tool-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--vp-c-bg-elv);
  display: grid;
  place-items: center;
  font-size: 18px;
  flex-shrink: 0;
}

.tool-info h4 {
  font-family: var(--vp-font-family-heading);
  font-size: 15px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  margin: 0 0 2px;
}

.tool-info p {
  font-size: 12px;
  color: var(--vp-c-text-4);
  margin: 0;
}

/* ─── 底部页脚 ────────────────────────────────────────────────────────────── */
.home-footer {
  background: var(--vp-c-bg-alt);
  border-top: 1px solid var(--vp-c-border);
  padding: 24px 0;
}

.footer-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px;
  text-align: center;
}

.footer-text {
  font-size: 13px;
  color: var(--vp-c-text-4);
  margin: 0 0 4px;
}

.footer-text:last-child {
  margin-bottom: 0;
}
</style>
