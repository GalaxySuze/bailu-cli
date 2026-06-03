# 工作流管理

白鹿工作流将 AI 工具的配置打包为可复用的工作流，方便安装和分享。

## 工作流类型

| 工作流 | 版本 | 说明 |
|--------|------|------|
| `dev` | v2.0.0 | 开发工作流，SDD 七阶段研发管理 + 白鹿原生四阶段 |
| `ops` | v1.0.0 | 运营工作流，包含内容创作相关的组件 |

### dev 工作流 v2.0.0 — SDD 增强版

dev 工作流引入 SDD（Specification-Driven Development）七阶段引擎作为默认流程：

| 阶段 | 名称 | 主导 Agent | 说明 |
|------|------|-----------|------|
| D1 | 任务分配与评估 | planner | 任务拆解、SP 估算、规模推荐 |
| D2 | 技术方案设计 | architect | 代码锚定设计、OpenSpec 文档生成 |
| D3 | 技术方案评审 | code-reviewer | AI 自检 / 正式评审会 |
| D4 | 开发编码 | developer | 逐任务实现代码变更 |
| D5 | 代码评审 | code-reviewer | AI 审核 + 人工审核双重闸门 |
| D6 | 测试与缺陷闭环 | test-engineer | 四环节测试，缺陷必须闭环 |
| D7 | 上线/发版 | code-reviewer | 上线前检查 + MR 创建（可选） |

**三级规模路由**：

| 规模 | 流程 | 预计 |
|------|------|------|
| 小需求 | D1 → D4 → D5 → D6 | 1-2 轮对话 |
| 中等需求 | D1 → D2 → D3(AI自检) → D4 → D5 → D6 | 3-5 轮对话 |
| 大需求 | D1 → D2 → D3(正式评审会) → D4 → D5 → D6 → D7 | 多天多轮对话 |

**入口命令**：`/bailu-sdd-start` 或 `/bailu-dev`

## 查看工作流

```bash
# 查看已安装的工作流
bailu workflow list

# 查看所有可用工作流
bailu workflow list --all
```

## 安装工作流

```bash
# 安装开发工作流到 Claude Code
bailu workflow install dev

# 安装到指定工具
bailu workflow install dev --agent hanako

# 预览安装内容
bailu workflow install dev --dry-run
```

## 卸载工作流

```bash
# 卸载开发工作流
bailu workflow uninstall dev

# 跳过确认直接卸载
bailu workflow uninstall dev --clean
```

## 工作流组件

每个工作流包含以下组件：

| 组件类型 | 说明 |
|----------|------|
| Skills | AI 技能，定义 AI 的能力 |
| Commands | 命令，扩展 CLI 功能 |
| Agents | 代理，定义 AI 角色 |
| Rules | 规则，约束 AI 行为 |
| Hooks | 钩子，自动化操作 |

## 配置文件

工作流配置存储在 `~/.bailu/config/workflows/` 目录：

```
~/.bailu/config/workflows/
├── dev-workflow.yaml
└── ops-workflow.yaml
```

## 自定义工作流

可以创建自定义工作流配置文件，参考现有配置格式。
