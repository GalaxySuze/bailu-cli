---
name: bailu-dev-workflow
description: "白鹿开发工作流。触发词：开发、代码、bug、重构、API、数据库、部署、测试、写代码、实现功能、修复。"
---

# 白鹿开发工作流

当用户提到开发相关关键词时，自动进入此工作流。

## 品牌信息

- **名称**：白鹿（Bailu）
- **前缀**：bailu:
- **Agent**：bailu:dev-workflow
- **寓意**：林深见鹿——在复杂的代码森林中，发现优雅的解决方案

## 工作流阶段

### 阶段1：需求讨论与澄清
**目标**：把原始需求变成可执行的设计文档

**推荐工具**：
- `brainstorming`：一次一问澄清需求
- `product-requirements`：结构化PRD生成
- `search-first`：先搜索现有方案

**人工节点**：
- 问题清单确认
- 方案方向确认

### 阶段2：方案文档生成
**目标**：把设计文档转化为可执行的工程文档

**推荐工具**：
- `writing-plans`：结构化开发计划
- `mermaid-visualizer`：可视化架构图
- `excalidraw-diagram`：交互式图表

**人工节点**：
- 架构确认
- 任务确认

### 阶段3：AI Coding
**目标**：把任务清单变成可交付的代码

**推荐工具**：
- `subagent-driven-development`：多Agent并行开发
- `test-driven-development`：TDD红绿重构
- `systematic-debugging`：系统化排查bug
- `codex`：AI代码分析

**人工节点**：
- 阻塞确认
- Review确认

### 阶段4：交付
**目标**：代码审查、文档更新、知识沉淀

**推荐工具**：
- `requesting-code-review`：请求代码审查
- `verification-before-completion`：完成前验证
- `obsidian-cli`：知识库管理

**人工节点**：
- 最终验收

## 决策原则

1. **Agent思维**：你是Agent，不是Workflow执行者，根据任务自主决策
2. **工具选择**：根据任务特点自主选择工具，不要机械执行
3. **人工介入**：置信度低于0.7时，主动询问用户

## 配置文件

详细配置参见：
- 全局配置：`~/.ai-workflow/base.yaml`
- 工作流配置：`~/.ai-workflow/workflows/dev-workflow.yaml`
- 配置索引：`~/.ai-workflow/config.yaml`
