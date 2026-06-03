# 更新日志

## v1.4.0

### 🚀 workflow-dev v2.0.0 — SDD 七阶段研发管理

- 引入 SDD 引擎作为默认流程：D1 任务评估 → D2 技术方案 → D3 评审 → D4 编码 → D5 代码评审 → D6 测试闭环 → D7 发版
- 三级规模路由：小需求（快速模式 1-2 轮）、中等需求（标准模式 3-5 轮）、大需求（完整模式）
- 新增 11 个 SDD Skills（bailu-sdd-start, d1-d7, d4-git-branch, openspec-workflow）
- sdd-context.md 状态持久化：支持断点恢复、多需求并行管理
- OpenSpec 使用时机自动判断
- 6 个 Agent 新增 SDD 阶段职责定义
- D7 发版支持通用 Git 平台（GitHub / GitLab / Gitee CLI）
- 新增 SDD 研发管理文档页面

## v1.3.0

- 安装器多平台支持完善（Claude Code / Qoder / Trae / Cursor / Codex）
- `bailu install` 智能路由：自动识别工作流名和工具名
- 安装器 `--dry-run` 预览模式
- WebUI 安装链路修复

## v1.2.0

- WebUI 全面升级：新增项目管理、安全审计、设置页面
- 自定义弹框组件，替代浏览器原生 alert/confirm
- 工作流安装支持选择目标 AI 工具
- 组件统计扩展至 6 种类型（Skills、Commands、Agents、Hooks、Rules、MCP）
- 新增 Git 远程仓库配置功能
- 发布配置可视化管理

## v1.1.0

- 新增交互式 TUI 仪表盘（`bailu` 无参数运行）
- 全面美化终端界面（figlet + gradient-string + boxen + ora）
- 新增 WebUI 管理平台（`bailu serve`）
- MCP 服务管理命令
- Git Hooks 管理命令
- 团队配置同步命令
- 安全审计功能

## v1.0.0

- 🎉 首次发布
- 工作流安装/卸载
- AI 工具管理
