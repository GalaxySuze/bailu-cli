# 最佳实践

本指南通过具体场景，告诉你如何在实际工作中高效使用白鹿工作流。

## 场景一：新项目初始化

### 背景

你刚接手一个新的 Laravel 项目，需要快速搭建 AI 辅助开发环境。

### 操作步骤

```bash
# 1. 初始化白鹿配置
bailu init

# 2. 安装开发工作流
bailu workflow install dev

# 3. 安装到 Claude Code
bailu tool install claude

# 4. 启动 WebUI 查看状态
bailu serve
```

### 效果

安装完成后，Claude Code 会自动获得：
- 10+ 个开发技能（代码审查、测试驱动开发等）
- 5+ 个命令（/bailu-dev、/code-review 等）
- 3+ 个角色（代码审查专家、后端架构师等）
- 完整的编码规范和安全规则

### 小贴士

::: tip
如果你同时使用多个 AI 工具，可以重复执行第 3 步，为每个工具安装配置：

```bash
bailu tool install claude
bailu tool install hanako
bailu tool install cursor
```
:::

---

## 场景二：团队配置同步

### 背景

你的团队有 5 个开发者，每个人的 AI 工具配置都不一样，导致代码风格不统一。

### 操作步骤

**队长操作**：

```bash
# 1. 创建配置仓库
mkdir team-ai-config && cd team-ai-config
git init

# 2. 初始化白鹿配置
bailu init

# 3. 推送到 Git 仓库
bailu sync push
git add .
git commit -m "init: 团队 AI 配置"
git push origin main
```

**成员操作**：

```bash
# 1. 克隆配置仓库
git clone git@github.com:team/team-ai-config.git
cd team-ai-config

# 2. 拉取配置
bailu sync pull

# 3. 安装到本地工具
bailu tool install claude
```

### 效果

- 所有成员使用相同的 Skills、Commands、Agents、Rules
- 代码风格统一，减少 Code Review 负担
- 新成员入职时，5 分钟内完成环境配置

### 小贴士

::: tip
建议在项目 README 中添加 AI 工具配置说明：

```markdown
## AI 工具配置

本项目使用白鹿工作流管理 AI 工具配置。

# 克隆配置
git clone git@github.com:team/team-ai-config.git

# 安装配置
bailu sync pull
bailu tool install claude
```
:::

---

## 场景三：代码审查

### 背景

你写完了一个功能，想在提交前让 AI 帮你审查代码质量。

### 操作步骤

```bash
# 方式一：使用命令
bailu audit

# 方式二：在 Claude Code 中使用命令
/code-review
```

### 审查内容

AI 会检查：
- 代码风格是否符合规范
- 是否有安全漏洞
- 是否有性能问题
- 是否有潜在的 bug

### 示例输出

```
╭─────────────────────────────────────────────────────╮
│  🔒 代码审查报告                                    │
├─────────────────────────────────────────────────────╮
│  信任分数: 92/100                                   │
│  状态: 安全                                         │
├─────────────────────────────────────────────────────┤
│  发现问题:                                          │
│  - [LOW] UserService.php:120 - 建议添加空值检查    │
│  - [LOW] OrderController.php:45 - 建议使用事务     │
╰─────────────────────────────────────────────────────╯
```

### 小贴士

::: tip
建议在 Git Hook 中集成自动审查：

```bash
# .git/hooks/pre-commit
bailu audit --json || exit 1
```
:::

---

## 场景四：快速定位代码

### 背景

你在维护一个大型代码库，想找某个功能的实现位置。

### 操作步骤

```bash
# 安装 Semble 插件
bailu plugin install semble

# 在 Claude Code 中使用语义搜索
# 输入自然语言描述，如："用户登录的逻辑在哪里"
```

### 效果

- 比 grep 减少 98% 的 token 消耗
- 支持自然语言查询
- 智能匹配相关代码

### 示例查询

```
"用户登录的逻辑在哪里"
"订单支付的流程"
"如何添加新的 API 接口"
"数据库迁移文件在哪里"
```

### 小贴士

::: tip
Semble 会学习你的代码库结构，使用越多越精准。
:::

---

## 场景五：跨会话记忆

### 背景

你在处理一个复杂问题，需要多次对话才能完成，但每次都要重新解释上下文。

### 操作步骤

```bash
# 安装 AgentMemory 插件
bailu plugin install agentmemory

# 在对话中使用记忆功能
# AI 会自动记住之前的对话内容
```

### 效果

- 跨会话保持上下文
- 自动检索相关记忆
- 减少重复解释

### 示例场景

```
第 1 次对话：
你："我在重构用户模块，需要支持多种登录方式"
AI："好的，我记住了这个需求..."

第 2 次对话：
你："继续上次的重构"
AI："我记得你在重构用户模块，上次讨论到微信登录..."
```

### 小贴士

::: tip
记忆功能适合长期项目，短期任务可以不用。
:::

---

## 场景六：知识图谱分析

### 背景

你刚加入一个新项目，想快速了解代码库的整体结构。

### 操作步骤

```bash
# 安装 Graphify 插件
bailu plugin install graphify

# 生成知识图谱
# 在 Claude Code 中使用 graphify 命令
```

### 效果

- 可视化代码结构
- 展示模块依赖关系
- 快速理解项目架构

### 示例输出

```
项目结构图：
├── app/
│   ├── Http/Controllers/  ← 控制器层
│   ├── Models/            ← 数据模型层
│   ├── Services/          ← 业务逻辑层
│   └── Repositories/      ← 数据访问层
├── routes/
│   └── api.php            ← API 路由
└── database/
    └── migrations/        ← 数据库迁移
```

### 小贴士

::: tip
Graphify 特别适合：
- 新成员入职
- 项目交接
- 重构前的架构分析
:::

---

## 场景七：工作流切换

### 背景

你同时负责开发和运营工作，需要在不同工作流之间切换。

### 操作步骤

```bash
# 安装开发工作流
bailu workflow install dev

# 切换到运营工作流
bailu workflow install ops

# 查看当前工作流
bailu workflow list
```

### 工作流对比

| 工作流 | 适用场景 | 包含组件 |
|--------|----------|----------|
| dev | 代码开发 | 代码审查、测试、调试等 |
| ops | 内容运营 | 文章写作、PPT 制作等 |

### 小贴士

::: tip
工作流可以叠加安装，组件会合并到 AI 工具中。
:::

---

## 场景八：安全审计

### 背景

项目即将上线，需要对 AI 生成的代码进行安全审查。

### 操作步骤

```bash
# 运行安全审计
bailu audit

# 自动修复可修复的问题
bailu audit --fix

# 在 WebUI 中查看详细报告
bailu serve
```

### 审计内容

| 检查项 | 说明 |
|--------|------|
| 文件权限 | 检查敏感文件权限 |
| 敏感信息 | 检查是否泄露密钥、密码等 |
| 代码注入 | 检查 SQL 注入、XSS 等 |
| 依赖安全 | 检查第三方库漏洞 |

### 小贴士

::: tip
建议在 CI/CD 中集成安全审计：

```yaml
# .github/workflows/audit.yml
- name: Security Audit
  run: bailu audit --json
```
:::

---

## 场景九：PPT 生成

### 背景

你需要为技术分享准备一份 PPT，但不想花太多时间在排版上。

### 操作步骤

```bash
# 安装 PPT 插件
bailu plugin install ppt-skill

# 在 Claude Code 中描述需求
# "帮我做一份关于 Laravel 最佳实践的 PPT"
```

### 支持风格

| 风格 | 特点 |
|------|------|
| 杂志风格 | 大图配文字，视觉冲击力强 |
| 瑞士风格 | 简洁排版，重点突出 |

### 小贴士

::: tip
PPT 生成适合：
- 技术分享
- 项目汇报
- 培训材料
:::

---

## 场景十：多 Agent 协作

### 背景

你有一个复杂任务，需要多个 AI 角色协作完成。

### 操作步骤

```bash
# 安装 Agency 插件
bailu plugin install agency

# 在 Claude Code 中使用多 Agent 功能
# 描述任务，系统会自动分配角色
```

### 内置角色

| 角色 | 职责 |
|------|------|
| 代码审查专家 | 审查代码质量 |
| 后端架构师 | 设计系统架构 |
| 前端开发工程师 | 实现前端功能 |
| 测试工程师 | 编写测试用例 |
| DevOps 工程师 | 配置部署流程 |

### 小贴士

::: tip
Agency 支持 211 个预定义角色，覆盖大部分开发场景。
:::

---

## 进阶技巧

### 1. 自定义工作流

如果内置工作流不能满足需求，可以自定义：

```bash
# 编辑工作流配置
vim ~/.bailu/config/workflows/dev-workflow.yaml
```

### 2. 插件组合使用

多个插件可以组合使用，发挥更大价值：

```bash
# 同时安装多个插件
bailu plugin install graphify
bailu plugin install semble
bailu plugin install agentmemory
```

### 3. 定期更新

保持工具和插件更新：

```bash
# 更新 CLI
npm update -g @vickzhang/bailu-cli

# 更新工作流
bailu workflow install dev
```

### 4. 参与社区

分享你的最佳实践：

```bash
# 推荐优质工具
bailu serve  # 在 WebUI 中提交推荐

# 贡献代码
git clone https://github.com/vickzhang/bailu-cli
```
