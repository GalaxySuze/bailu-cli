# 更新日志

## v2.0.0 (2026-06-09)

### 🎉 重大重构：精简哲学

白鹿迎来一次彻底重构。从 v1 的"35 命令 + 3 套界面 + 7 种组件"瑞士军刀，精简为"5 命令 + 1 状态文件 + 1 套工作流"的极简形态。

### 🆕 新增

- **5 个核心命令**：`init` / `status` / `update` / `doctor` / `reset`
- **Goal 无人值守模式**：完整产品化的 AI 长跑能力
  - `bailu goal init` / `status` / `run`
  - `bailu goal install-launchd` / `uninstall-launchd`
  - `bailu goal stop` / `logs`
  - `.goal/` 目录契约（current.md / state.json / progress.md / blockers.md / verification.log）
  - 10 状态枚举的状态机
  - macOS launchd 集成
  - 多执行器协议（Claude / Codex 共享 `.goal/`）
- **项目级 .bailu.yaml**：配置不再全局污染
- **bailu-goal Skill**：引导 AI 按 Goal 协议执行
- **MCP 自动配置**：init 时自动写入 context7 和 playwright
- **冲突三级策略**：跳过 / 覆盖 / 备份后覆盖

### 🔥 移除

- **WebUI**：`bailu serve` 命令移除，回归 CLI
- **TUI 仪表盘**：移除
- **`bailu workflow / tool / mcp / sync / recommend / audit`**：全部移除
- **packages/shared / webui / plugin-* / workflow-base / workflow-ops**：9 个 v1 包删除
- **ops 工作流**：v2 仅保留 dev / SDD

### 🔧 变化

- **Node 版本**：要求 ≥ 18.0.0（v1 是 14.0.0）
- **安装位置**：从 `~/.bailu/` 改为项目级 `.bailu.yaml`
- **支持的 AI 工具**：Claude Code + Qoder（v1 支持 6 个）
- **代码量**：从 8000+ 行精简到 < 3000 行
- **依赖数**：从 80+ 降到 < 50
- **安装体积**：< 5MB

### 📚 文档站

- 完整重写，新增 Goal 章节
- base 路径双模式（本地 `/` + 内部 `/ai_doc/`）

### 🔒 安全

- 完全删除内网 GitLab host / SupEntra / QYHT / Teambition 等敏感词
- 公开发布到 npmjs.org（@vickzhang/bailu-cli）

### ⚠️ 不兼容变更

- v1 命令不再可用（`bailu workflow install`、`bailu serve` 等）
- v1 配置目录 `~/.bailu/` 不再读取，需重新 `bailu init`
- 详细迁移参见 [安装与配置 → 从 v1 迁移](/guide/installation#从-v1-迁移)

### 📦 归档

v1 完整代码永久保留在 `archive/v1.5-full` 分支，但**不再维护**。

---

## v1.5.0 (内部最后版本)

v1 系列最后一个内部版本，包含完整的 WebUI / TUI / 6 工具支持。已归档为 `archive/v1.5-full` 分支。

---

## 早期版本

v1 早期的功能演进（workflow / tool / mcp / sync / serve / recommend / audit 等命令）不再单独列出。如需查阅 v1 时代的更新记录，请切换到 `archive/v1.5-full` 分支查看历史 changelog。
