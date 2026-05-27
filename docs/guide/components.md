# 组件管理

白鹿工作流将 AI 工具的配置抽象为组件，方便统一管理。

## 组件类型

### Skills（技能）

技能定义了 AI 的能力，例如：
- 代码审查
- 测试驱动开发
- 文档生成

### Commands（命令）

命令扩展了 CLI 的功能，例如：
- `/bailu-dev` - 启动开发工作流
- `/code-review` - 代码审查

### Agents（代理）

代理定义了 AI 的角色，例如：
- 代码审查专家
- 后端架构师
- 前端开发工程师

### Rules（规则）

规则约束了 AI 的行为，例如：
- 编码规范
- Git 工作流
- 安全规则

### Hooks（钩子）

钩子实现了自动化操作，例如：
- 提交前检查
- 任务完成后操作

## 查看组件

```bash
# 查看所有组件
bailu status

# 在 WebUI 中查看
bailu serve
```

## 组件安装

组件通过工作流安装：

```bash
# 安装开发工作流（包含组件）
bailu workflow install dev
```

## 组件目录

组件安装到 AI 工具的配置目录：

```
~/.claude/
├── skills/
├── commands/
├── agents/
├── rules/
└── hooks/
```
