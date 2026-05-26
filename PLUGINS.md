# 白鹿工作流插件系统

> 林深见鹿，优雅前行

## 🎯 什么是插件系统

白鹿工作流插件系统让你可以**选择性安装**额外工具到 AI 编程助手中，保持核心 CLI 轻量，按需扩展功能。

## 📦 可用插件

### 🗺️ Graphify 知识图谱

**一句话**：给你的项目画一张地图

| 特性 | 说明 |
|------|------|
| **功能** | 将代码映射成知识图谱，支持可视化和自然语言查询 |
| **安装** | `bailu plugin install graphify` |
| **Skill** | `graphify` |
| **Command** | `/graphify` |
| **适用** | 项目初始化、架构分析、PR 审查 |
| **优点** | 支持 31 种语言、交互式可视化、发现意外连接 |
| **注意** | 需要 Python 环境，大型项目扫描较慢 |

**使用场景**：
- 🆕 新人加入项目，快速理解架构
- 🔧 重构前，查看模块依赖
- 🔀 PR 审查，分析影响范围

```bash
# 安装到 AI 工具
bailu plugin install graphify

# 在 AI 工具中使用
/graphify .                          # 生成图谱
graphify query "认证和数据库的关系"  # 查询图谱
```

---

### 🔍 Semble 语义搜索

**一句话**：给你的代码配一个 GPS

| 特性 | 说明 |
|------|------|
| **功能** | 语义代码搜索引擎，比 grep 节省 98% token |
| **安装** | `bailu plugin install semble` |
| **Skill** | `semble` |
| **Command** | `/search` |
| **适用** | 日常开发、代码查找、快速定位 |
| **优点** | 毫秒级响应、CPU 运行、零外部依赖 |
| **注意** | 需要 Python 环境，索引需定期更新 |

**使用场景**：
- 🔍 "这个功能在哪里实现的？"
- 📖 "这个函数是干嘛的？"
- 🧭 快速定位某个逻辑

```bash
# 安装到 AI 工具
bailu plugin install semble

# 在 AI 工具中使用
/search "认证流程"                    # 语义搜索
/search "save_pretrained" --top-k 10 # 搜索更多结果
```

---

### 🧠 AgentMemory 跨会话记忆

**一句话**：让 AI 记住你是谁、做了什么、喜欢什么

| 特性 | 说明 |
|------|------|
| **功能** | 自动捕获会话信息，跨会话记忆 |
| **安装** | `bailu plugin install agentmemory` |
| **Skill** | `agentmemory` |
| **Command** | `/agentmemory` |
| **适用** | 跨会话记忆、Token 优化、团队协作 |
| **优点** | 自动捕获、节省 92% token、多平台支持 |
| **注意** | 需要 Node.js 环境，需要运行服务器 |

**使用场景**：
- 🔄 跨会话记住项目架构和技术选型
- 💰 减少重复解释，节省 token
- 👥 团队共享开发记忆
- 📼 会话回放和分析

```bash
# 安装到 AI 工具
bailu plugin install agentmemory

# 初始化
bailu agentmemory init

# 连接到 AI 工具
bailu agentmemory connect claude-code
bailu agentmemory connect codex

# 查看状态
bailu agentmemory status
```

---

## 🔧 插件管理

### 查看插件列表

```bash
bailu plugin list
```

### 查看插件详情

```bash
bailu plugin info graphify
bailu plugin info semble
```

### 安装插件到 AI 工具

```bash
# 安装到所有已安装的 AI 工具
bailu plugin install graphify
bailu plugin install semble

# 安装到特定 AI 工具
bailu plugin install graphify --tool claude
bailu plugin install semble --tool codex
```

### 卸载插件

```bash
# 从所有 AI 工具中卸载
bailu plugin uninstall graphify
bailu plugin uninstall semble

# 从特定 AI 工具中卸载
bailu plugin uninstall graphify --tool claude
```

---

## 📊 插件对比

| | **Graphify** | **Semble** |
|---|---|---|
| **定位** | 知识图谱生成器 | 语义搜索引擎 |
| **输出** | 图谱 + 可视化 + 报告 | 精确代码片段 |
| **速度** | 较慢（全量扫描） | 极快（毫秒级） |
| **Token** | 较高 | 极低（节省 98%） |
| **可视化** | ✅ 交互式图谱 | ❌ 无 |
| **类比** | 城市地图 | GPS 导航 |

---

## 💡 推荐工作流

```bash
# 1. 项目初始化时，用 Graphify 生成架构图谱
/graphify .

# 2. 日常用 Semble 快速搜索代码
/search "认证流程"

# 3. 重构前，用 Graphify 分析依赖
graphify query "UserService 依赖哪些模块"

# 4. PR 审查，用 Graphify 查看影响范围
graphify export callflow
```

---

## 🚀 安装所有插件

```bash
# 安装核心 CLI
npm install -g @vickzhang/bailu-cli

# 安装插件到 AI 工具
bailu plugin install graphify
bailu plugin install semble

# 查看状态
bailu status
```

---

## 🔗 相关链接

- [白鹿工作流文档](https://github.com/vickzhang/bailu-cli)
- [Graphify GitHub](https://github.com/safishamsi/graphify)
- [Semble GitHub](https://github.com/MinishLab/semble)
