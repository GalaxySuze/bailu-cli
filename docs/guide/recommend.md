# 推荐工具

白鹿工作流提供了社区推荐工具功能，可以发现和分享优质 AI 工具。

## 功能入口

```bash
# 启动 WebUI
bailu serve

# 访问 http://localhost:3000 → 推荐工具
```

## 工具分类

| 分类 | 说明 |
|------|------|
| AI Coding Agent | AI 编程代理，如 Claude Code、Codex |
| AI Code Editor | AI 代码编辑器，如 Cursor、Windsurf |
| AI Coding Extension | AI 编程扩展，如 GitHub Copilot |
| AI Coding Assistant | AI 编程助手，如 Codeium |
| AI Agentic IDE | AI 智能 IDE，如 Trae |

## 浏览推荐工具

在推荐工具页面，你可以：

1. **查看工具列表**：浏览社区推荐的 AI 工具
2. **按分类筛选**：选择特定类型的工具
3. **搜索工具**：按名称或标签搜索
4. **查看详情**：点击工具卡片查看详细信息

## 提交工具推荐

### 第一步：打开提交表单

点击页面右上角的「提交推荐」按钮。

### 第二步：填写工具信息

| 字段 | 必填 | 说明 |
|------|------|------|
| 工具名称 | ✅ | 工具的名称 |
| 工具类型 | ✅ | 选择工具分类 |
| 用户群体 | ❌ | 目标用户，默认"开发者" |
| 下载地址 | ✅ | 工具的下载/安装链接 |
| 文档地址 | ❌ | 工具的官方文档链接 |
| 标签 | ❌ | 用逗号分隔的标签 |
| 工具说明 | ✅ | 一句话描述工具的核心价值 |

### 第三步：提交审核

填写完成后点击「提交」按钮，等待审核通过后会显示在推荐列表中。

## 内置推荐数据

白鹿工作流内置了精选的 AI 工具推荐数据，包括：

### AI Coding Agent

| 工具 | 说明 |
|------|------|
| Claude Code | Anthropic 出品的 AI 编程助手 |
| Codex | OpenAI 的代码生成模型 |
| Aider | 终端中的 AI 结对编程 |
| Goose | Block 出品的 AI 开发助手 |

### AI Code Editor

| 工具 | 说明 |
|------|------|
| Cursor | AI 原生的代码编辑器 |
| Windsurf | Codeium 出品的 AI 编辑器 |
| VS Code + Copilot | VS Code 集成 GitHub Copilot |

### AI Coding Extension

| 工具 | 说明 |
|------|------|
| GitHub Copilot | GitHub 官方 AI 编程助手 |
| Codeium | 免费的 AI 代码补全 |
| Tabnine | 智能代码补全 |

## 推荐数据来源

推荐工具数据存储在 `packages/cli/src/commands/recommend.js` 中，以 JSON 格式定义：

```javascript
const RECOMMENDED_TOOLS = [
  {
    name: 'Claude Code',
    type: 'AI Coding Agent',
    download: 'https://claude.ai/code',
    docs: 'https://docs.anthropic.com/claude-code',
    description: 'Anthropic 出品的 AI 编程助手',
    tags: ['coding', 'agent', 'terminal'],
    audience: '开发者'
  },
  // ... 更多工具
];
```

## 贡献推荐

欢迎社区贡献优质 AI 工具推荐！

### 方式一：通过 WebUI 提交

使用 WebUI 的「提交推荐」功能。

### 方式二：通过 GitHub PR

1. Fork 仓库
2. 编辑 `packages/cli/src/commands/recommend.js`
3. 添加工具数据
4. 提交 Pull Request

### 贡献指南

- 确保工具是真实可用的
- 提供准确的下载和文档链接
- 用简洁的语言描述工具价值
- 添加相关标签便于搜索

## 排序和筛选

### 默认排序

推荐工具按以下规则排序：
1. 社区推荐数量
2. 最后更新时间
3. 工具名称字母顺序

### 筛选条件

- 按工具类型筛选
- 按标签筛选
- 按关键词搜索

## 工具详情

点击工具卡片可以查看详细信息：

- 工具名称和类型
- 下载和文档链接
- 工具说明
- 标签
- 推荐人数
- 最后更新时间
