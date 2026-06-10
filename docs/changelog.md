# 更新日志

## v2.2.0 (2026-06-11)

### 🎉 主题：项目规则系统（Rules）落地

本次发版围绕**项目级规则文件（Rules）** 落地一整套机制。
白鹿不再只是把 Skills 装进去就完事，而是把"项目应该遵守的规则"作为一等公民管起来：
CLI 负责骨架，Claude/Qoder 负责按规范生成内容，两者职责清晰分离。

### 🆕 新增

- **`bailu init` 新增 Phase 3：Rules 骨架自动创建**
  - 安装流程从 3 阶段扩展为 **4 阶段**
  - 项目级安装时自动创建 `.claude/rules/` 与 `.qoder/rules/` 目录
  - 放置 README.md 模板，介绍方案 E 规范和推荐结构
  - **安全策略**：用户已有的 README 不会被覆盖，目录已存在不报错
  - global 范围跳过（规则是项目级的，不进全局）

- **`/bailu-project-config` 命令（AI 工具侧）**
  - 项目规则生成与整理的 slash 命令
  - 扫描项目结构、识别技术栈、生成符合**方案 E（轻量标记分隔符）** 规范的规则文件
  - 智能处理策略：跳过 / 整理 / 重新生成（备份旧文件到 `.bailu-backup-rules-{时间戳}/`）
  - 跨平台一致：同一套规则文件同时支持 Claude Code 与 Qoder

- **方案 E 规则文件规范（轻量标记分隔符）**
  - 在标准 Markdown 上添加 `:::` 语义标记，渐进式增强
  - 模块标记：`::: constraints [MUST/SHOULD/MAY]` / `::: anti_patterns` / `::: examples` / `::: guidelines` / `::: references`
  - Obsidian 兼容：`:::` 语法可被 Obsidian callout 渲染，知识库可直接预览
  - 降级兼容：AI 工具不识别 `:::` 时仍是合法 Markdown

- **agent 重构：bailu-fullstack**
  - 补齐 frontmatter（name/description/tools/model），适配 Claude Code agent 标准格式
  - 明确"默认走 SDD 七阶段"的工作原则，不再凭直觉一上来就写代码
  - 新增"不做什么"清单（不自动 push、不修改全局配置、不绕过 CI 等）
  - 跨技术栈判断表格，按项目已有技术栈走，不为现代化硬推新技术

### 🔧 职责重构：CLI 与 AI 工具分工

| 层 | 角色 | 在 Rules 中的职责 |
|----|------|-------------------|
| **`bailu` CLI** | 安装与编排 | 创建空的 `rules/` 目录骨架 + README 模板 |
| **`/bailu-project-config`** | AI 工具命令 | 扫描项目 → 生成符合方案 E 的规则**内容** |

这与 v2.0 已确立的原则一致：CLI 不负责执行，只负责安装配置；实际执行（包括规则内容生成）由 AI 工具完成。

### 🐛 修复

- **`init.js` 中两个潜在崩溃 bug**（旧版迁移检测）
  - 缺失 `const os = require('os')`：legacy 检测代码使用了 `os.homedir()` 但未在文件顶部导入
  - `platformDirs` 对象不完整：循环里的 `platform` 只有 `id/dir` 字段，缺少 `globalSkillsDir`，访问时 throw `Cannot read properties of undefined`
  - 影响范围：用户存在 `.claude/` 或 `.qoder/` 但无旧版残留时，`bailu init` 会崩溃

### 📦 兼容性

- ✅ **完全向前兼容**：老用户重跑 `bailu init` 不会丢失任何已有规则
- ✅ **不覆盖用户内容**：手写的 `rules/README.md` 不会被替换
- ✅ **manifest 自动注册**：新命令 `bailu-project-config` 已加入 manifest，下次 `bailu update` 会自动部署

### 🔮 后续规划

- `/bailu-project-config` 的智能项目扫描能力深化（识别更多技术栈、抽取已有规范）
- 规则模板库扩展（Python、Go、Java 项目的开箱即用规则集）
- 与 SDD D5 代码审查阶段联动，让 AI 审查时主动引用 rules 中的约束

---

## v2.1.x

### v2.1.1 (2026-06-09)

- `fix(agent)`: agents 始终装到全局 `~/.claude/agents/`，解决 `/agents` 命令看不到白鹿 agent 的问题
- `fix(docs)`: config.js 默认 base 改回 `/ai_doc/`，配套 nginx location 剥掉规则
- `fix(docs)`: 恢复 `build:oss` 脚本，CI 管道依赖此名称

### v2.1.0 (2026-06-08)

- 文档站发布脚本与 nginx 部署链路打通
- Goal 状态机细节调优

---

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
  - 为多执行器预留接口（当前仅 Claude；Codex 等在阶段 3路线图）
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
