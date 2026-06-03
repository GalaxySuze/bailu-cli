# @vickzhang/bailu-workflow-dev

白鹿开发工作流 v2.0.0 — SDD 七阶段研发管理 + 白鹿原生四阶段

## 概述

白鹿开发工作流引入 SDD（Specification-Driven Development）七阶段引擎，覆盖从需求到上线的完整研发管理链路。同时保留白鹿原生四阶段推荐式流程作为 Fallback。

```
┌─────────────────────────────────────────────────────┐
│           共享基础层：Agents / Rules / Hooks          │
│                                                      │
│  ┌──────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  SDD 引擎    │  │ Comet    │  │ 白鹿原生引擎   │  │
│  │ （默认）     │  │ (v3.0)   │  │ （fallback）   │  │
│  │              │  │          │  │               │  │
│  │ D1→D2→D3→   │  │ 五阶段   │  │ 四阶段        │  │
│  │ D4→D5→D6→D7 │  │ 状态机   │  │ 推荐式引导    │  │
│  └──────────────┘  └──────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────┘
```

## 安装

```bash
# 通过白鹿 CLI 安装（推荐）
bailu install dev

# 安装到指定工具
bailu install dev --agent claude
bailu install dev --agent qoder

# 跳过外部依赖（OpenSpec CLI）
bailu install dev --skip-external
```

## SDD 七阶段

| 阶段 | 名称 | 主导 Agent | 说明 |
|------|------|-----------|------|
| D1 | 任务分配与评估 | planner | 任务拆解、SP 估算、规模推荐 |
| D2 | 技术方案设计 | architect | 代码锚定设计、OpenSpec 文档生成 |
| D3 | 技术方案评审 | code-reviewer | AI 自检 / 正式评审会 |
| D4 | 开发编码 | developer Agents | 逐任务实现代码变更 |
| D5 | 代码评审 | code-reviewer | AI 审核 + 人工审核双重闸门 |
| D6 | 测试与缺陷闭环 | test-engineer | 四环节测试，缺陷必须闭环 |
| D7 | 上线/发版 | code-reviewer | 上线前检查 + MR 创建（可选） |

## 三级规模路由

| 规模 | 流程 | 预计 |
|------|------|------|
| 小需求（快速模式） | D1 → D4 → D5 → D6 | 1-2 轮对话 |
| 中等需求（标准模式） | D1 → D2 → D3(AI自检) → D4 → D5 → D6 | 3-5 轮对话 |
| 大需求（完整模式） | D1 → D2 → D3(正式评审会) → D4 → D5 → D6 → D7 | 多天多轮对话 |

## 使用方式

```bash
# SDD 流程入口（推荐）
/bailu-sdd-start

# 带需求信息启动
/bailu-sdd-start QYHT-29001 订单列表 Excel 导出

# 白鹿原有入口（SDD 可用时自动路由）
/bailu-dev

# 自然语言触发
我要开发需求 QYHT-29001 订单列表 Excel 导出
```

## 包含内容

### Skills（技能）

| Skill | 说明 |
|-------|------|
| `bailu-dev-workflow` | 白鹿开发工作流（四阶段） |
| `bailu-init` | 项目初始化工作流 |
| `bailu-sdd-start` | SDD 主入口/总控 |
| `bailu-sdd-d1-planning` | D1 任务分配与评估（含 SP 字典） |
| `bailu-sdd-d2-tech-design` | D2 技术方案设计（含架构图模板） |
| `bailu-sdd-d3-tech-review` | D3 技术方案评审 |
| `bailu-sdd-d4-coding` | D4 开发编码 |
| `bailu-sdd-d4-git-branch` | D4 辅助：规范分支创建 |
| `bailu-sdd-d5-code-review` | D5 代码评审（含 4 语言 CR 规则） |
| `bailu-sdd-d6-test-closure` | D6 测试与缺陷闭环 |
| `bailu-sdd-d7-publish` | D7 上线/发版 |
| `bailu-sdd-openspec-workflow` | OpenSpec 工作流引擎 |

### Commands（命令）

| 命令 | 说明 |
|------|------|
| `/bailu-sdd-start` | SDD 研发流程入口 |
| `/bailu-dev` | 开发工作流（SDD 可用时自动路由） |
| `/bailu-init` | 工作流初始化 |

### Agents（智能体）

| Agent | SDD 职责 |
|-------|---------|
| architect | D2 技术方案设计 |
| planner | D1 任务分配与评估 |
| frontend-developer | D4 前端开发编码 |
| backend-developer | D4 后端开发编码 |
| test-engineer | D6 测试与缺陷闭环 |
| code-reviewer | D3 方案评审 + D5 代码评审 + D7 发版 |

### Rules（规则）

- `dev-workflow` — 开发工作流规则（SDD 七阶段 + 三级规模路由 + 白鹿原生 Fallback）
- `code-quality` — 代码质量标准
- `git-conventions` — Git 提交与分支规范

### Hooks（钩子）

- `pre-commit` — 提交前检查（lint、类型检查、提交信息格式）
- `post-task` — 任务完成处理（测试覆盖率、文档更新提醒）

### 外部依赖

| 依赖 | 包 | 必需 | 说明 |
|------|-----|------|------|
| OpenSpec | `@fission-ai/openspec` | 否 | Spec 生命周期管理，不可用时降级为 AI 模式 |

## 状态管理

研发状态通过 `.sdd/sdd-context.md` 管理，支持断点恢复和多需求并行：

```
项目根目录/
└── .sdd/
    ├── sdd-context.md                      ← 当前活跃需求
    ├── QYHT-29001-order-list-export.md     ← 暂停中
    └── QYHT-29002-user-auth.md             ← 已完成
```

## 许可证

MIT
