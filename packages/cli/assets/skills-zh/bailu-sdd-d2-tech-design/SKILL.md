---
name: bailu-sdd-d2-tech-design
description: 白鹿SDD研发阶段D2技术方案设计助手。触发词：技术方案、技术设计、架构设计、DB设计、表结构设计、接口设计、API设计、技术选型、D2。
allowed-tools:
  - Read
  - Write
  - Bash
---

# 白鹿 SDD D2 - 技术方案设计

## 阶段入口契约

### 前置条件

1. `.sdd/sdd-context.md` 当前阶段为 `D2`
2. `.sdd/sdd-context.md` 中 `需求规模` 字段为 `中等需求` 或 `大需求`（小需求跳过 D2，直接进入 D4）
3. D1 产物存在（`openspec/changes/<change-name>/tasks.md` 或 D1 对话中的任务清单）

### 输入产物

| 输入项 | 来源 | 是否必须 |
|--------|------|----------|
| sdd-context.md | `.sdd/sdd-context.md` | 是 |
| D1 任务清单 | 对话上下文 或 `openspec/changes/<change-name>/tasks.md` | 是 |
| 需求文档（HTML/MD） | D1 阶段输入 | 否（参考用） |

### 输出产物

| 输出项 | 路径 | 说明 |
|--------|------|------|
| proposal.md | `openspec/changes/<change-name>/proposal.md` | 需求背景、业务价值、范围边界 |
| design.md | `openspec/changes/<change-name>/design.md` | 完整技术设计（含代码清单 + 锁定签名） |
| tasks.md（更新） | `openspec/changes/<change-name>/tasks.md` | 与 D1 任务清单粒度对齐的开发子任务 |
| sdd-context.md（更新） | `.sdd/sdd-context.md` | 阶段推进至 D3 |

---

## 概述

引导研发完成技术设计思考，产出锚定真实代码的标准化技术方案。

> **Agent 路由提示**：本阶段由 **architect Agent** 主导，负责架构决策和方案设计。

**两个核心原则：**
- **先扫代码再设计**：设计必须基于真实代码结构，不凭空推断类名/方法名
- **D2 只 propose，不 apply**：apply 是 D4 的事，D3 评审通过后才能进入

---

## Step 1：读取上下文

读取项目根目录 `.sdd/sdd-context.md`，获取需求编号、需求名称、需求规模、SP总计、执行人、工程名、D1产物路径。

若文件不存在或关键字段为空，询问：

```
未找到 D1 上下文，请提供：
① 需求编号（如 DEMO-001，没有可跳过）
② 需求名称或简要描述
③ 需求文档路径（有的话）
```

读取完成后直接进入 Step 2。

---

## Step 2：检测 OpenSpec CLI

```bash
command -v openspec &>/dev/null && openspec --version && echo "openspec_available" || echo "openspec_missing"
```

- `openspec_available`：后续 Step 6 使用 CLI 模式
- `openspec_missing`：提示"未检测到 OpenSpec CLI，将使用 AI 模式生成技术方案，效果一致"，**不阻塞，继续执行**

记录结果供 Step 6 使用。

---

## Step 3：确认设计范围

根据需求自动推断本次涉及的设计模块，展示推断结果：

```
根据需求分析，本次方案将覆盖以下模块：
{AI 推断的模块列表，如：后端业务逻辑、API 接口契约、数据库/表结构}

如需增减模块请说明，否则直接继续。
```

用户无反馈则直接继续；有反馈则调整范围后继续。后续各步骤只展开已确认模块。

---

## Step 3.5：代码锚定

**目的：让设计文档里的每个类/方法都有真实代码出处，避免 D4 编码时类名/签名对不上。**

### 推断相关模块

根据需求描述和 Step 3 选择的范围，自动推断涉及的现有模块，直接扫描，无需确认：

```
根据需求，涉及以下模块：

后端：OrderService、OrderMapper
前端：OrderListPage
数据库：order 表
```

若有遗漏，用户可在方案输出后补充。

**如果是全新模块、没有任何现有代码可扫描**，告知用户：

```
本次需求涉及的模块均为新建，无现有代码可扫描。
设计文档中所有类/方法均为 [新增]，将在 Step 5 设计完成后统一确认签名。
```

然后跳过扫描，直接进入 Step 4。

### 扫描现有代码

用户确认模块范围后，按语言扫描：

**Java / PHP / Python / React / Vue（本地工程目录）**

直接读取相关文件，提取类名/组件名、公开方法签名（方法名+参数+返回值）、关键依赖。

**其他语言（非本地工程目录，无法自动扫描）**

提示用户手动提供：

```
⚠️ 检测到 {语言} 模块，无法自动扫描代码，请手动提供以下内容到对话：
- 函数/模块定义
- 类及方法签名
- 接口定义
```

### 生成现有代码清单

整理扫描结果，随技术方案一并输出，无需单独确认。若有遗漏，用户可在方案输出后补充。

---

## Step 4：UI/视觉设计

**仅当 Step 3 选择了"6. UI/视觉设计"时执行，否则跳过。**

询问 UI 来源：

```
1. 已有设计稿或 HTML 原型（提供路径）
2. 需要 AI 生成 UI 方案（需安装 ui-ux-pro-max skill）
3. 跳过，方案中标注"UI 方案待补充"
```

选 2 时检测 ui-ux-pro-max 是否已安装，未安装则提供安装命令，等待安装后继续；或选择跳过。

---

## Step 5：技术设计

**目的：把需求转化为可执行的设计决策。每个决策都必须有真实代码出处，不允许凭空发明类名/方法名。**

根据 Step 3 选择的范围，逐项展开。**每项开始前先评估与本次需求的相关性——如果该项对当前需求确实没有影响，直接标注"不涉及"跳过，不打扰用户。**

涉及类/方法时，必须标注来源：
- `[复用]` — 来自 Step 3.5 现有代码清单，直接调用
- `[新增]` — 需新建，签名为 AI 建议，在 Step 5 结束后统一由用户确认

### 5.1 技术选型与依赖评估
> 识别新引入的技术风险点。若本次改动沿用现有技术栈、无新增外部依赖，标注"沿用现有技术栈，无新增依赖"跳过。

### 5.2 整体架构方案
> 描述系统交互链路和模块调用关系。若是单模块内部改动、没有跨服务调用，标注"单模块改动，无架构影响"跳过。

### 5.3 后端业务逻辑
> 核心业务流程、关键处理节点、异常分支。

### 5.4 前端页面/组件
> 涉及哪些页面/组件改动，新增还是修改，交互逻辑变化。

### 5.5 数据库/表结构
> 新增或修改的表/字段/索引，提供 DDL。

### 5.6 API 接口契约
> 接口 path、method、request/response 结构定义。

### 5.7 中间件/三方系统
> Redis/MQ/定时任务/三方系统的接入方式和关键参数。

### 5.8 性能方案
> 缓存策略、分页、异步、限流等。若无性能风险，标注"无特殊性能要求"跳过。

### 5.9 安全方案
> 鉴权、数据脱敏、注入防护、敏感字段处理。若无安全风险，标注"无特殊安全要求"跳过。

### 5.10 风险与待确认项
> 方案中的不确定性和需评审确认的点。**如确实无风险，写"暂无"即可——不要为非空而编造风险，假风险比没有风险更有害。**

### 5.11 新增代码签名确认

**仅当以上步骤中存在 `[新增]` 标注时执行，否则跳过。**

汇总所有 `[新增]` 条目，统一展示给用户确认：

```
以下是本次需要新建的类/方法，请确认签名是否符合团队规范：

① ExportService.buildExcelStream(List<OrderVO> orders) → InputStream
② ExportController.exportOrderList(OrderQueryDTO query, HttpServletResponse response) → void

直接回车全部确认，或指出序号修改，如"①方法名改为 generateExcel，参数不变"。
```

用户确认后，签名锁定写入 design.md，D4 编码严格按此执行。

---

完成后直接进入 Step 6 生成 artifacts，不需要单独确认设计摘要。

---

## Step 6：生成 OpenSpec artifacts

1. 优先读取 `.sdd/sdd-context.md` 中已有的 `change-name` 字段作为 OpenSpec change 名，后续 artifacts 路径均使用该值；若为空，则从需求编号 + 需求名称自动派生 kebab-case change 名并写回 `.sdd/sdd-context.md`，不需要确认。

2. 根据 Step 2 的检测结果选择模式：

   - **CLI 模式**：`openspec new change "<change-name>"`，按 `D2-openspec-workflow/SKILL.md` 流程填入内容
   - **AI 模式**：直接生成文件写入 `openspec/changes/<change-name>/`

3. 产出三个文件：
   - `proposal.md` — 需求背景、业务价值、范围边界
   - `design.md` — 完整技术设计（含 Step 3.5 现有代码清单 + Step 5.11 锁定签名）
   - `tasks.md` — 可执行的开发子任务（与 D1 任务清单粒度对齐）

---

## Step 6.5：架构图（可选）

若方案涉及跨服务调用或中间件，在 Step 7 完成信息末尾附加一行提示：
"如需生成可视化架构图，说'生成架构图'即可。"

不主动询问，不打断当前流程。

架构图生成器模板路径：`architecture-diagram/resources/template.html`

---

## Step 7：收尾

更新 `.sdd/sdd-context.md`（只修改以下字段，禁止写入其他内容）：

| 字段 | 值 |
|------|-----|
| 当前阶段 | D3 |
| 技术方案路径 | openspec/changes/{change-name}/design.md |
| D2产物 | openspec/changes/{change-name}/ |

输出进度块（按根 SKILL.md 的进度块规则，D1/D2 标 ✅，D3 标 ▶️），然后输出：

```
✅ D2 技术方案设计完成

📄 artifacts：
   proposal.md  openspec/changes/{change-name}/proposal.md
   design.md    openspec/changes/{change-name}/design.md
   tasks.md     openspec/changes/{change-name}/tasks.md

sdd-context.md 已推进至 D3。
直接说"继续"或"开始评审"即可。
```

---

## 边界

- design.md 是技术方案唯一主文档，不额外生成其他文档
- 严禁在 D2 执行 `openspec apply`，apply 是 D4 的事
- tasks.md 任务粒度与 D1 任务清单对齐，不重新拆解
- 小需求（来自 sdd-context.md 需求规模字段）不进入 D2 阶段，直接跳转 D4
