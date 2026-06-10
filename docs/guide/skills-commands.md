# Skills 与 Commands

`bailu init` 会安装一组 Skills（Claude/Qoder 的能力定义）和 Commands（slash 命令）。本页是完整清单。

## Skills（12 个）

Skill 是 AI 工具的"能力定义"——一个 SKILL.md 描述某个能力的触发词、行为、产物。AI 工具在对话中检测到匹配特征时会自动启用对应 Skill。

### SDD 七阶段（10 个）

| Skill | 阶段 | 触发词 |
|-------|------|--------|
| `bailu-sdd-start` | 总入口 | "开始 SDD"、"我要开发需求"、"/bailu-sdd-start" |
| `bailu-sdd-d1-planning` | D1 任务评估 | 由 `start` 路由 |
| `bailu-sdd-d2-tech-design` | D2 技术设计 | 由 `start` 路由 |
| `bailu-sdd-d3-tech-review` | D3 技术评审 | 由 `start` 路由 |
| `bailu-sdd-d4-coding` | D4 编码 | 由 `start` 路由 |
| `bailu-sdd-d4-git-branch` | D4 分支管理 | 配合 `coding` 自动启用 |
| `bailu-sdd-d5-code-review` | D5 代码评审 | 由 `start` 路由 |
| `bailu-sdd-d6-test-closure` | D6 测试闭环 | 由 `start` 路由 |
| `bailu-sdd-d7-publish` | D7 发布 | 由 `start` 路由 |
| `bailu-sdd-openspec-workflow` | OpenSpec 协调 | 涉及 openspec 操作时自动启用 |

### 通用工作流（1 个）

| Skill | 作用 |
|-------|------|
| `bailu-dev-workflow` | 白鹿原生四阶段（需求 → 方案 → 编码 → 交付），作为 SDD 不可用时的 Fallback |

### Goal 无人值守（1 个）

| Skill | 作用 |
|-------|------|
| `bailu-goal` | 引导 AI 按 Goal 协议读取 `.goal/current.md` 并推进，每轮更新 state/progress/verification |

## Commands（5 个）

Command 是用户在 AI 工具中输入 `/xxx` 触发的 slash 命令。

| Command | 用途 | 与 Skill 关系 |
|---------|------|---------------|
| `/bailu-init` | 引导 AI 在当前项目生成 CLAUDE.md / QODER.md 等约定文件 | 独立 |
| `/bailu-project-config` | 扫描项目并生成/整理 `.claude/rules/` 与 `.qoder/rules/` 下的项目规则文件 | 独立（v2.2.0+） |
| `/bailu-dev` | 进入白鹿开发模式（四阶段或 SDD） | 激活 `bailu-dev-workflow` 或路由到 SDD |
| `/bailu-sdd-start` | SDD 流程入口 | 激活 `bailu-sdd-start` |
| `/bailu-goal` | Goal 无人值守入口 | 激活 `bailu-goal` |

## Agent（1 个）

Agent 是更高级别的能力组合，可以在 Claude Code 中作为子任务调度。

| Agent | 作用 |
|-------|------|
| `bailu-fullstack` | 全栈开发 agent，自动协调前后端任务 |

## MCP 服务（2 个）

`bailu init` 选 Claude Code 时会尝试写入 `~/.claude.json`，追加两个 MCP 服务：

| MCP | 作用 | 备注 |
|-----|------|------|
| `context7` | 第三方库文档实时查询 | 减少 AI 编瞎话 |
| `playwright` | 浏览器自动化 | 用于前端测试和 E2E |

## 安装位置

`bailu init` 默认安装到**项目级**：

```
your-project/
├── .claude/                       # Claude Code
│   ├── skills/bailu-*/SKILL.md   # 12 个
│   ├── commands/bailu-*.md       # 5 个（v2.2.0+）
│   ├── rules/README.md           # v2.2.0+ 项目规则骨架
│   └── agents/bailu-*.md         # 1 个
└── .qoder/                        # Qoder
    └── （同上结构）
```

如果选 `--scope global`，会装到 `~/.claude/` 或 `~/.qoder/`。但 **rules 目录不会进全局**（规则是项目级的）。

## 关于项目规则（Rules）

v2.2.0 起，`bailu init` 会创建 `rules/` 目录骨架和 README 模板。实际的规则内容需在 AI 工具中运行 `/bailu-project-config` 生成。

规则文件遵循**方案 E（轻量标记分隔符）** 规范：

```
---
name: PHP 编码规范
category: 代码风格
priority: high
---

::: constraints [MUST]
- 每个 PHP 文件顶部必须 declare(strict_types=1)
:::

::: anti_patterns
- ❌ 在 Controller 中编写复杂业务逻辑
:::
```

三重兼容：Claude Code / Qoder / Obsidian 都能正确处理，不识别 `:::` 时仍是合法 Markdown。

## 关于 manifest.json

所有 Skills/Commands/Agent/MCP 的清单都在 `packages/cli/assets/manifest.json` 中数据化定义。`bailu init` 严格按 manifest 安装，不会偷偷多装或漏装。

manifest 结构示例：

```json
{
  "version": "2.0.0",
  "platforms": ["claude-code", "qoder"],
  "skills": [
    { "id": "bailu-sdd-start", "name": "...", "trigger": "..." }
  ],
  "commands": [
    { "id": "bailu-init", "file": "bailu-init.md" }
  ],
  "agents": [
    { "id": "bailu-fullstack", "file": "bailu-fullstack.md" }
  ],
  "mcpServers": {
    "context7": { ... },
    "playwright": { ... }
  }
}
```

## 自定义与扩展

如果你想：

- **修改某个 Skill**：直接编辑 `.claude/skills/bailu-xxx/SKILL.md`，但下次 `bailu update` 会被覆盖。建议复制一份改名（去掉 `bailu-` 前缀）作为自己的 Skill
- **新增自己的 Skill**：放到 `.claude/skills/your-name/SKILL.md`，白鹿不会动它
- **禁用某个 Skill**：删除对应目录即可，再跑 `bailu status` 会显示缺失但不会自动补回

## 下一步

- [SDD 研发工作流详解](./sdd-workflow)
- [bailu init 命令](/commands/init)
- [Goal 无人值守](/goal/)
