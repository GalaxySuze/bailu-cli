# SDD 研发工作流

SDD（Specification-Driven Development）是白鹿 v2 的核心研发引擎，提供从需求到上线的七阶段流程。每个阶段都有对应的 Skill 引导 AI 完成。

## 设计哲学

> **先写规格，再写代码**。让 AI 不只是"会写代码"，而是"按规格写代码"。

传统的 AI 协同开发存在两个核心问题：

1. **没有规格** → AI 自由发挥，结果难复现、难审查
2. **没有阶段** → 从需求到上线一锅烩，关键决策点缺失

SDD 把研发流程拆成 7 个可审计阶段，每个阶段：
- 有明确的输入输出
- 有专属的 Skill 引导
- 有可观察的产物（写入 `openspec/changes/<name>/`）

## 七阶段概览

| 阶段 | 名称 | 主导能力 | 核心产出 |
|------|------|---------|---------|
| D1 | 任务分配与评估 | `bailu-sdd-d1-planning` | 任务清单 + SP 汇总 |
| D2 | 技术方案设计 | `bailu-sdd-d2-tech-design` | proposal.md + design.md + tasks.md |
| D3 | 技术方案评审 | `bailu-sdd-d3-tech-review` | review.md（通过/有条件通过/不通过） |
| D4 | 开发编码 | `bailu-sdd-d4-coding` + `bailu-sdd-d4-git-branch` | 代码实现 + 分支管理 |
| D5 | 代码评审 | `bailu-sdd-d5-code-review` | AI 审核 + 人工审核记录 |
| D6 | 测试与缺陷闭环 | `bailu-sdd-d6-test-closure` | 测试记录 + 缺陷闭环 |
| D7 | 上线/发版（可选） | `bailu-sdd-d7-publish` | MR + 发布清单 |

## 三级规模路由

SDD 根据需求规模自动选择流程深度：

```
                     D1 任务分配与评估
                            │
                    ┌───────┼───────┐
                    ▼       ▼       ▼
                 小需求   中等需求   大需求
                    │       │       │
                    │       ▼       ▼
                    │    D2 技术方案设计
                    │       │       │
                    │       ▼       ▼
                    │    D3 评审    D3 评审
                    │   (AI自检)  (正式评审会)
                    │       │       │
                    ├───────┼───────┤
                    ▼       ▼       ▼
                   D4 开发编码（模式不同）
                    │       │       │
                    ▼       ▼       ▼
                   D5 代码评审（双重闸门）
                    │       │       │
                    ▼       ▼       ▼
                   D6 测试与缺陷闭环
                    │       │       │
                    ▼       ▼       ▼
                   D7 上线/发版（可选）
```

### 小需求（快速模式）

- **流程**：D1 → D4 → D5 → D6
- **特点**：跳过 D2/D3，D4 直接扫代码确认改动范围后写代码
- **预计**：1-2 轮对话
- **适用**：改一两个功能点，改动范围清晰，无需跨模块协作

### 中等需求（标准模式）

- **流程**：D1 → D2 → D3(AI自检) → D4 → D5 → D6
- **特点**：D3 仅 AI 自检，不开评审会
- **预计**：3-5 轮对话
- **适用**：多模块改动，有前后端协作，需要技术方案

### 大需求（完整模式）

- **流程**：D1 → D2 → D3(正式评审会) → D4 → D5 → D6 → D7
- **特点**：D3 必须走正式评审会，D7 执行上线前检查
- **预计**：多天多轮对话
- **适用**：功能复杂、改动量大、需要正式评审会

## 规模自动判定

系统根据特征信号 + 文件扫描双重判定需求规模：

**特征信号**：

| 信号特征 | 推荐规模 |
|---------|---------|
| "加一个"、"改一下"、纯前端样式、无接口变更 | 小需求 |
| 有接口新增/变更、前后端协作、涉及多个模块 | 中等需求 |
| 新建系统/子系统、跨团队协作、改动量大 | 大需求 |
| 描述模糊、范围不清晰 | 中等需求（保守推荐） |

**文件扫描**（D1 阶段自动执行）：

| 涉及文件数 | 推荐规模 |
|-----------|---------|
| ≤ 2 且无接口变更 | 小需求 |
| 3-5 或有 1-2 个接口变更 | 中等需求 |
| > 5 或新建模块 | 大需求 |

## 使用方式

在已经 `bailu init` 过的项目里，打开 AI 工具（Claude Code / Qoder）输入：

```bash
# 标准入口（推荐）
/bailu-sdd-start

# 带需求信息启动
/bailu-sdd-start PROJ-12345 订单列表 Excel 导出

# 自然语言触发（任一即可）
我要开发需求 PROJ-12345 订单列表 Excel 导出
开始 SDD
开始研发
```

`/bailu-sdd-start` Skill 会自动读取 `.sdd/sdd-context.md`，判断当前阶段，路由到对应阶段的 Skill 继续执行。

## 状态管理

研发状态通过 `.sdd/sdd-context.md` 管理，支持断点恢复和多需求并行：

```yaml
需求编号: PROJ-12345
需求名称: 订单列表 Excel 导出
change-name: PROJ-12345-order-list-excel-export
需求规模: 中等需求
当前阶段: D4
当前分支: develop-20260602-task-PROJ-12345-zhangsan
技术方案路径: openspec/changes/PROJ-12345-order-list-excel-export/design.md
SP总计: 4
执行人: zhangsan
工程名: order-service
开始日期: 2026-06-02
阶段产物索引:
  D1: openspec/changes/PROJ-12345-order-list-excel-export/tasks.md
  D2: openspec/changes/PROJ-12345-order-list-excel-export/design.md
  D3: openspec/changes/PROJ-12345-order-list-excel-export/review.md
```

中断对话后再次输入 `/bailu-sdd-start` 即可从上次阶段继续。

## 各阶段详解

### D1 任务分配与评估

- 接收需求输入（HTML 原型 / MD 文档 / 一句话描述）
- 代码扫描辅助规模判定
- 任务拆解 + SP 估算（参考 SP 字典）
- 判断是否需要 OpenSpec 文档
- 输出任务清单（Markdown 表格）

### D2 技术方案设计

- **代码锚定**：扫描现有代码，设计文档中每个类/方法都有真实代码出处
- 11 项模块逐项展开（技术选型 / 架构 / 后端逻辑 / 前端组件 / DB / API / 中间件 / 性能 / 安全 / 风险 / 签名确认）
- 生成 OpenSpec artifacts（proposal.md + design.md + tasks.md）
- **关键约束**：D2 只生成方案，不生成代码

### D3 技术方案评审

- **AI 自检模式**（中等需求）：7 大维度自动检查
- **正式评审会模式**（大需求）：录入评审人、结论、意见
- 结论三态：通过 / 有条件通过 / 不通过
- 不通过时退回 D2 修改

### D4 开发编码

- **标准模式**：读取 design.md + tasks.md，逐任务实现
- **小需求模式**：扫代码 → 确认改动范围 → 直接写代码
- 关键决策点暂停询问（设计冲突 / 多实现路径 / 新依赖 / 测试失败）
- 配套 `bailu-sdd-d4-git-branch` Skill 自动管理分支

### D5 代码评审

- **双重闸门**：AI 审核 → 人工审核
- AI 六维度审查：代码规范 / 安全漏洞 / 性能 / 业务逻辑 / 异常处理 / 可维护性
- 自动加载语言 CR 规则（Java / PHP / Python / React）

### D6 测试与缺陷闭环

- 四环节测试：单元测试 → 功能自测 → 前后端联调 → 三方联调
- **核心原则**：AI 先测，人工补充确认
- D6 发现的问题必须在 D6 内修复闭环

### D7 上线/发版（可选）

- 上线前 Checklist（分支 / 变更 / 提交 / 发布风险）
- 创建 Merge Request（支持 GitHub / GitLab / Gitee）
- 更新发布清单

## 与白鹿原生四阶段的关系

SDD 引擎是 v2 的**默认流程**。白鹿原生四阶段（需求讨论 → 方案文档 → AI Coding → 交付）保留为 Fallback：当 SDD Skills 不可用时，`/bailu-dev` 自动回退到原生四阶段。

## 与 OpenSpec 的集成

SDD 的产物默认写入 `openspec/changes/<change-name>/` 目录，遵循 OpenSpec 规范。相关 Skill：

- `bailu-sdd-openspec-workflow`：协调 OpenSpec 提案/归档流程

详细参见 [openspec](https://github.com/anthropics/openspec) 项目。

## 下一步

- [Skills 与 Commands](./skills-commands) 完整清单
- [bailu init 命令](/commands/init) 安装到项目
- [Goal 无人值守](/goal/) 让 SDD 流程自动推进
