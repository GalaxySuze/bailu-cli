# 插件系统

白鹿工作流支持插件扩展，可以通过插件增强功能。

## 插件管理

### 查看插件

```bash
bailu plugin list
```

### 安装插件

```bash
bailu plugin install <name>
```

### 卸载插件

```bash
bailu plugin uninstall <name>
```

## 可用插件

| 插件 | 说明 | 安装命令 |
|------|------|----------|
| graphify | 知识图谱生成器，分析代码结构 | `bailu plugin install graphify` |
| semble | 语义代码搜索引擎，快速定位代码 | `bailu plugin install semble` |
| agentmemory | Agent 记忆管理，跨会话记忆 | `bailu plugin install agentmemory` |
| ppt-skill | PPT 生成器，创建演示文稿 | `bailu plugin install ppt-skill` |
| agency | 多 Agent 编排，211 个角色 | `bailu plugin install agency` |

## 插件详情

### Graphify

知识图谱生成器，可以将代码库转换为知识图谱。

**功能特性**：
- 分析代码结构和依赖关系
- 生成可视化的知识图谱
- 支持多种编程语言

**使用场景**：
- 代码库结构分析
- 依赖关系可视化
- 代码审查辅助

### Semble

语义代码搜索引擎，比 grep 减少 98% 的 token 消耗。

**功能特性**：
- 语义级别的代码搜索
- 支持自然语言查询
- 智能匹配和排序

**使用场景**：
- 快速定位代码
- 查找相似实现
- 代码库探索

### AgentMemory

Agent 记忆管理，实现跨会话记忆。

**功能特性**：
- 持久化存储对话记忆
- 智能检索相关记忆
- 支持多 Agent 共享

**使用场景**：
- 长期项目跟踪
- 上下文保持
- 知识积累

### PPT Skill

PPT 生成器，创建专业的演示文稿。

**功能特性**：
- 支持杂志风格和瑞士风格
- 自动生成布局
- 支持图片和图表

**使用场景**：
- 技术分享
- 项目汇报
- 培训材料

### Agency

多 Agent 编排系统，内置 211 个角色。

**功能特性**：
- DAG 并行执行
- 211 个预定义角色
- 支持自定义角色

**使用场景**：
- 复杂任务分解
- 多角色协作
- 工作流自动化

## 插件配置

插件配置存储在 `~/.bailu/plugins/installed.json`：

```json
{
  "plugins": [
    {
      "name": "graphify",
      "version": "1.0.0",
      "installed_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## 开发插件

插件需要导出一个包含以下属性的对象：

```javascript
module.exports = {
  name: 'my-plugin',
  version: '1.0.0',
  description: '插件描述',
  
  // 安装时执行
  async install() {
    // 安装逻辑
  },
  
  // 卸载时执行
  async uninstall() {
    // 卸载逻辑
  }
};
```
