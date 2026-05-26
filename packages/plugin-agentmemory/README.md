# @vickzhang/bailu-plugin-agentmemory

> 白鹿工作流插件 - AgentMemory 跨会话记忆

## 🎯 这是什么

AgentMemory 让你的 AI 编程助手拥有**持久化记忆**：

- 🧠 **自动捕获**：12 个 hooks 自动记录会话，零手动操作
- 🔄 **跨会话记忆**：Session 2 的 AI 已经知道 Session 1 你做了什么
- 💰 **节省 Token**：比传统方式节省 92% token
- 🔍 **智能搜索**：BM25 + 向量 + 图谱，找到最相关的记忆

## 📦 安装

```bash
# 安装插件
bailu plugin install agentmemory

# 或者直接 npm 安装
npm install -g @agentmemory/agentmemory
```

## 🚀 使用

### 初始化

```bash
# 启动记忆服务器
bailu agentmemory init
```

### 连接到 AI 工具

```bash
# 连接到 Claude Code
bailu agentmemory connect claude-code

# 连接到 Codex
bailu agentmemory connect codex

# 连接到 Cursor
bailu agentmemory connect cursor

# 连接到 Hermes
bailu agentmemory connect hermes
```

### 查看状态

```bash
bailu agentmemory status
```

### 运行演示

```bash
bailu agentmemory demo
```

### 停止服务器

```bash
bailu agentmemory stop
```

## 📋 使用场景

| 场景 | 说明 |
|------|------|
| 🔄 跨会话记忆 | AI 记住你的项目架构、技术选型 |
| 💰 Token 优化 | 不需要每次都重新解释背景 |
| 👥 团队协作 | 共享记忆服务器，团队成员都能访问 |
| 📼 会话回放 | 回放任意会话的时间线 |

## ✅ 优点

- **自动捕获**：12 个 hooks 自动记录，零手动操作
- **节省 92% token**：~170K tokens/年，成本 ~$10/年
- **多平台支持**：Claude Code、Codex、Cursor、Hermes 等
- **MCP 标准接口**：53 个 MCP 工具
- **实时可视化**：端口 3113 查看记忆构建过程

## ⚠️ 注意事项

- 需要 Node.js 环境
- 首次使用需要初始化
- 记忆服务器默认运行在端口 3111
- 实时查看器在端口 3113

## 🔧 工作原理

```
Session 1: 你设置 JWT 认证
    ↓
    AgentMemory 自动捕获
    ↓
    压缩成可搜索记忆
    ↓
Session 2: 你问"怎么做限流"
    ↓
    AI 已经知道你的 JWT 用 jose 中间件
    不需要重新解释
```

## 🔗 相关链接

- [AgentMemory GitHub](https://github.com/rohitg00/agentmemory)
- [白鹿工作流文档](https://github.com/vickzhang/bailu-cli)

## 📄 许可证

MIT
