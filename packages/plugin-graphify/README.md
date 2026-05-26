# @vickzhang/bailu-plugin-graphify

> 白鹿工作流插件 - Graphify 知识图谱生成器

## 🎯 这是什么

Graphify 插件将你的项目代码映射成**知识图谱**，让你能够：

- 🗺️ **可视化架构**：生成交互式图谱，点击节点查看关联
- 🔍 **智能查询**：用自然语言问"认证和数据库怎么关联的"
- 🎯 **发现意外连接**：找到模块间隐藏的依赖关系
- 📊 **生成报告**：自动输出项目架构分析报告

## 📦 安装

```bash
# 安装插件
bailu plugin install graphify

# 或者直接 npm 安装
npm install -g @vickzhang/bailu-plugin-graphify
```

## 🚀 使用

### 生成知识图谱

```bash
# 在项目根目录执行
bailu graphify .

# 或指定目录
bailu graphify ./src
```

生成文件：
```
graphify-out/
├── graph.html       # 浏览器打开，交互式图谱
├── GRAPH_REPORT.md  # 架构分析报告
└── graph.json       # 完整数据（可程序化查询）
```

### 查询图谱

```bash
# 自然语言查询
bailu graphify:query "认证模块和用户模块的关系"

# 查找路径
bailu graphify:query "UserService 到 DatabasePool 的调用链"
```

### 导出报告

```bash
# 导出 HTML
bailu graphify:export html

# 导出调用流程图
bailu graphify:export callflow
```

## 📋 适用场景

| 场景 | 说明 |
|------|------|
| 🆕 项目初始化 | 新人加入时快速理解项目架构 |
| 🔧 重构分析 | 重构前查看模块依赖，避免遗漏 |
| 🔀 PR 审查 | 分析 PR 影响范围 |
| 📚 文档生成 | 自动生成架构报告 |

## ✅ 优点

- 支持 **31 种编程语言**（Python、JavaScript、Go、Rust、Java 等）
- 生成**交互式可视化图谱**，支持点击、筛选、搜索
- 发现**模块间意外连接**，揭示隐藏依赖
- 支持**自然语言查询**，无需记住精确关键词

## ⚠️ 注意事项

- 需要 Python 3.10+ 环境
- 大型项目（10万+ 行）扫描可能需要几分钟
- 非代码文件（PDF、图片）需要 API 调用

## 🔗 相关链接

- [Graphify GitHub](https://github.com/safishamsi/graphify)
- [白鹿工作流文档](https://github.com/vickzhang/bailu-cli)

## 📄 许可证

MIT
