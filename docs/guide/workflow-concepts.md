# 工作流核心概念

工作流是白鹿工具的核心概念，它将 AI 工具的增强配置组织为**可复用的配置包**。

## 什么是工作流？

工作流是一组预配置的 AI 能力集合，包含：

```
工作流包
├── Skills（技能）      # AI 的能力定义
├── Commands（命令）    # 斜杠命令
├── Agents（代理）      # AI 角色定义
├── Rules（规则）       # 行为约束
├── Hooks（钩子）       # 自动化脚本
└── MCP Servers（服务） # 外部服务集成
```

**类比**：如果把 AI 工具比作一台电脑，工作流就是预装的软件包。安装开发工作流就像给电脑装上开发工具套件。

---

## 工作流包规范

### 目录结构

```
bailu-workflow-dev/
├── manifest.json          # 包清单（元数据）
├── skills/                # 技能文件
│   ├── bailu-dev-workflow/
│   │   └── SKILL.md
│   └── bailu-init/
│       └── SKILL.md
├── commands/              # 命令文件
│   ├── bailu-dev.md
│   └── bailu-init.md
├── agents/                # 代理角色
│   ├── code-reviewer.md
│   ├── backend-architect.md
│   └── ...
├── rules/                 # 规则文件
│   ├── coding-standards.md
│   └── workflow-rules.md
├── hooks/                 # 钩子脚本
│   ├── pre-commit.sh
│   └── post-task.sh
└── mcp-servers/           # MCP 服务配置
    └── config.json
```

### manifest.json 规范

每个工作流包必须包含一个 `manifest.json` 文件：

```json
{
  "name": "dev",
  "version": "1.0.0",
  "displayName": "开发工作流",
  "description": "适用于团队开发的完整工作流配置",
  "author": "白鹿",
  "license": "MIT",
  
  "components": {
    "skills": ["bailu-dev-workflow", "bailu-init"],
    "commands": ["bailu-dev", "bailu-init"],
    "rules": ["coding-standards", "workflow-rules"],
    "hooks": ["pre-commit", "post-task"],
    "agents": ["code-reviewer", "backend-architect", "frontend-developer"],
    "mcpServers": ["context7"]
  },
  
  "targetAgents": ["claude"],
  "dependencies": [],
  
  "metadata": {
    "category": "development",
    "tags": ["团队开发", "代码审查", "CI/CD"],
    "minBailuVersion": "1.0.0"
  }
}
```

**字段说明**：

| 字段 | 必填 | 说明 |
|------|------|------|
| name | ✅ | 工作流名称（唯一标识） |
| version | ✅ | 版本号（语义化版本） |
| displayName | ✅ | 显示名称 |
| description | ✅ | 描述信息 |
| components | ✅ | 包含的组件列表 |
| targetAgents | ✅ | 支持的 AI 工具 |
| dependencies | ❌ | 依赖的其他工作流 |
| metadata | ❌ | 元数据（分类、标签等） |

---

## 开发工作流（dev）

开发工作流面向软件开发日常工作，提升代码质量和开发效率。

### 包含组件

#### Skills（16 个）

| 技能 | 分类 | 说明 |
|------|------|------|
| bailu-dev-workflow | 核心 | 开发工作流主技能 |
| bailu-init | 核心 | 初始化技能 |
| brainstorming | 需求 | 头脑风暴技能 |
| product-requirements | 需求 | 需求文档生成 |
| search-first | 需求 | 搜索优先技能 |
| writing-plans | 方案 | 方案文档生成 |
| mermaid-visualizer | 方案 | 图表可视化 |
| excalidraw-diagram | 方案 | 手绘风格图表 |
| subagent-driven-development | 开发 | 子 Agent 驱动开发 |
| test-driven-development | 开发 | 测试驱动开发 |
| systematic-debugging | 开发 | 系统化调试 |
| codex | 开发 | Codex 集成 |
| requesting-code-review | 交付 | 代码审查请求 |
| verification-before-completion | 交付 | 完成前验证 |
| obsidian-cli | 交付 | 知识库管理 |

#### Commands（12 个）

| 命令 | 说明 |
|------|------|
| /bailu-dev | 启动开发工作流 |
| /bailu-init | 初始化配置 |
| /code-review | 代码审查 |
| /checkpoint | 创建检查点 |
| /build-fix | 修复构建错误 |
| /e2e | 端到端测试 |
| /tdd | 测试驱动开发 |
| /update-docs | 更新文档 |
| /verify | 验证完成度 |
| /multi-plan | 多 Agent 规划 |
| /multi-execute | 多 Agent 执行 |

#### Agents（10 个）

| 角色 | 分类 | 说明 |
|------|------|------|
| backend-architect | 架构 | 后端架构师 |
| architect | 架构 | 通用架构师 |
| frontend-developer | 开发 | 前端开发工程师 |
| code-reviewer | 开发 | 代码审查专家 |
| test-engineer | 开发 | 测试工程师 |
| devops-automator | 运维 | DevOps 自动化专家 |
| doc-updater | 文档 | 文档更新专家 |
| security-reviewer | 审查 | 安全审查专家 |
| database-reviewer | 审查 | 数据库审查专家 |
| planner | 规划 | 项目规划师 |

#### Hooks（4 个）

| 钩子 | 说明 |
|------|------|
| pre-commit.sh | 提交前钩子 |
| post-task.sh | 任务完成后钩子 |
| claude-island-state.py | Claude 状态管理 |
| rtk-rewrite.sh | RTK 重写钩子 |

### 工作流程

开发工作流分为四个阶段：

```
┌─────────────────────────────────────────────────────────────┐
│  阶段 1：需求讨论与澄清                                      │
│  ├── Deep Interview（深度访谈）                              │
│  ├── 多方评审                                                │
│  └── 方案对比                                                │
│  检查点：问题清单确认、方案方向确认                           │
├─────────────────────────────────────────────────────────────┤
│  阶段 2：方案文档生成                                         │
│  ├── 技术架构设计                                            │
│  ├── 业务需求分析                                            │
│  ├── 功能模块划分                                            │
│  └── 任务拆分                                                │
│  检查点：架构确认、任务确认                                   │
├─────────────────────────────────────────────────────────────┤
│  阶段 3：AI Coding                                           │
│  ├── 子 Agent 执行                                           │
│  ├── 代码 Review                                             │
│  └── 测试验证                                                │
│  检查点：阻塞确认、Review 确认                               │
├─────────────────────────────────────────────────────────────┤
│  阶段 4：交付                                                │
│  ├── 代码审查                                                │
│  ├── 文档更新                                                │
│  └── 知识沉淀                                                │
│  检查点：最终验收                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 运营工作流（ops）

运营工作流面向内容创作和运营工作，提升内容质量和创作效率。

### 包含组件

#### Skills（8 个）

| 技能 | 分类 | 说明 |
|------|------|------|
| bailu-ops-workflow | 核心 | 运营工作流主技能 |
| article-writing | 内容 | 文章写作技能 |
| writing-skills | 内容 | 写作技巧技能 |
| content-engine | 内容 | 内容引擎 |
| banner-design | 设计 | Banner 设计技能 |
| design-system | 设计 | 设计系统技能 |
| liquid-glass-design | 设计 | 液态玻璃设计 |
| market-research | 分析 | 市场调研技能 |

#### Commands（5 个）

| 命令 | 说明 |
|------|------|
| /bailu-ops | 启动运营工作流 |
| /article-write | 文章写作 |
| /banner-design | Banner 设计 |
| /market-research | 市场调研 |
| /content-plan | 内容规划 |

### 工作流程

```
┌─────────────────────────────────────────────────────────────┐
│  阶段 1：内容策划                                            │
│  ├── 选题调研                                                │
│  ├── 竞品分析                                                │
│  └── 内容规划                                                │
├─────────────────────────────────────────────────────────────┤
│  阶段 2：内容创作                                            │
│  ├── 文章撰写                                                │
│  ├── 图片设计                                                │
│  └── 排版优化                                                │
├─────────────────────────────────────────────────────────────┤
│  阶段 3：发布运营                                            │
│  ├── 平台发布                                                │
│  ├── 数据监控                                                │
│  └── 用户互动                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 安装流程

### 安装命令

```bash
# 安装开发工作流
bailu workflow install dev

# 安装到指定工具
bailu workflow install dev --agent claude

# 预览安装内容
bailu workflow install dev --dry-run

# 从本地安装
bailu workflow install dev --source ./local-path
```

### 安装过程

```
bailu workflow install dev
    ↓
1. 读取 registry.json，查找 dev 工作流信息
2. 下载工作流包（或使用本地版本）
3. 解压到临时目录
4. 读取 manifest.json
5. 按组件类型安装：
   - Skills → ~/.claude/skills/
   - Commands → ~/.claude/commands/
   - Agents → ~/.claude/agents/
   - Rules → 合并到 ~/.claude/rules/
   - Hooks → ~/.claude/hooks/
   - MCP → ~/.claude/settings.json
6. 记录安装信息到 ~/.bailu/installed.json
7. 输出安装结果
```

### 安装结果

安装完成后，组件会被复制到 AI 工具的配置目录：

```
~/.claude/
├── skills/                # 已安装的技能
│   ├── bailu-dev-workflow/
│   ├── brainstorming/
│   └── ...
├── commands/              # 已安装的命令
│   ├── bailu-dev.md
│   └── ...
├── agents/                # 已安装的代理
│   ├── code-reviewer.md
│   └── ...
├── rules/                 # 已安装的规则
│   ├── common/
│   ├── python/
│   └── typescript/
├── hooks/                 # 已安装的钩子
│   ├── pre-commit.sh
│   └── ...
└── settings.json          # MCP 服务配置
```

---

## 工作流叠加

工作流可以叠加安装，组件会合并到 AI 工具中：

```bash
# 安装开发工作流
bailu workflow install dev

# 安装运营工作流（叠加）
bailu workflow install ops
```

叠加后的效果：
- Skills：16 + 8 = 24 个
- Commands：12 + 5 = 17 个
- Agents：10 个（dev 提供）
- Rules：合并
- Hooks：合并

---

## 自定义工作流

### 创建自定义工作流

1. 创建目录结构：
```bash
mkdir -p my-workflow/{skills,commands,agents,rules,hooks}
```

2. 创建 manifest.json：
```json
{
  "name": "my-workflow",
  "version": "1.0.0",
  "displayName": "我的工作流",
  "description": "自定义工作流",
  "components": {
    "skills": [],
    "commands": [],
    "agents": [],
    "rules": [],
    "hooks": []
  },
  "targetAgents": ["claude"]
}
```

3. 添加组件文件

4. 安装自定义工作流：
```bash
bailu workflow install my-workflow --source ./my-workflow
```

---

## 最佳实践

### 1. 按需安装

只安装需要的工作流，避免组件过多导致冲突。

```bash
# 好的做法
bailu workflow install dev

# 不推荐
bailu workflow install dev
bailu workflow install ops
bailu workflow install design
```

### 2. 定期更新

保持工作流版本更新，获取最新功能和修复。

```bash
# 更新 CLI
npm update -g @vickzhang/bailu-cli

# 重新安装工作流
bailu workflow install dev
```

### 3. 团队统一

团队成员使用相同的工作流配置。

```bash
# 队长推送配置
bailu sync push

# 成员拉取配置
bailu sync pull
```

### 4. 版本管理

使用 Git 管理工作流配置版本。

```bash
# 提交配置变更
git add ~/.bailu/
git commit -m "chore: 更新工作流配置"
```
