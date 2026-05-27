# @vickzhang/bailu-workflow-dev

白鹿开发工作流 — 适用于团队协作开发

## 安装

```bash
npm install -g @vickzhang/bailu-workflow-dev
```

## 使用

```bash
# 安装工作流到配置中心
bailu install dev

# 安装到AI工具
bailu tool install
```

## 包含内容

### Skills（技能）

- `bailu-dev-workflow` — 开发工作流（四阶段：需求→方案→编码→交付）
- `bailu-init` — 项目初始化工作流

### Commands（命令）

- `/bailu-dev` — 进入开发工作流
- `/bailu-init` — 初始化工作流

### Agents（智能体）

| Agent | 职责 |
|-------|------|
| architect | 系统架构设计、技术选型 |
| planner | 任务规划、需求分解 |
| frontend-developer | 前端 UI 组件和页面开发 |
| backend-developer | 后端 API 和数据库开发 |
| test-engineer | 测试用例编写和质量保障 |
| code-reviewer | 代码审查和质量把关 |

### Rules（规则）

- `dev-workflow` — 开发工作流规则（阶段推进、人工节点）
- `code-quality` — 代码质量标准（可读性、健壮性、性能）
- `git-conventions` — Git 提交与分支规范

### Hooks（钩子）

- `pre-commit` — 提交前检查（lint、类型检查、提交信息格式）
- `post-task` — 任务完成处理（测试覆盖率、文档更新提醒）

## 触发词

- 开发、代码、bug、重构、API、数据库、部署、测试
- 初始化工作流、init workflow

## 许可证

MIT
