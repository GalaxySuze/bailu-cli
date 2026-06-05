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

## 场景四：SDD 小需求快速开发

### 背景

产品经理提了一个小需求：给订单列表添加 Excel 导出功能。改动范围清晰，只需修改 2-3 个文件。

### 操作步骤

```bash
# 在 Claude Code 中启动 SDD 流程
/bailu-sdd-start QYHT-29001 订单列表 Excel 导出

# 或者用自然语言
我要开发需求 QYHT-29001 订单列表 Excel 导出
```

### SDD 自动执行

1. **D1 任务分配与评估**
   - AI 扫描代码，识别涉及文件：`OrderController.php`、`OrderService.php`、`order-list.blade.php`
   - 判定为小需求（≤ 2 个文件，无接口变更）
   - 输出任务清单和 SP 估算

2. **D4 开发编码**（跳过 D2/D3）
   - AI 直接读取现有代码，确认改动范围
   - 实现 Excel 导出功能
   - 关键决策点暂停询问

3. **D5 代码评审**
   - AI 六维度自动审查
   - 输出审查报告

4. **D6 测试与缺陷闭环**
   - AI 编写单元测试
   - 执行功能自测

### 效果

- 1-2 轮对话完成需求
- 自动跳过不必要的评审环节
- 代码质量有保障

### 小贴士

::: tip
小需求适合：
- 改一两个功能点
- 改动范围清晰
- 无需跨模块协作
:::

---

## 场景五：SDD 中等需求标准开发

### 背景

需求：重构用户登录模块，支持微信、支付宝、手机号三种登录方式。涉及多个模块，有前后端协作。

### 操作步骤

```bash
# 启动 SDD 流程
/bailu-sdd-start QYHT-29002 用户登录重构 多方式登录
```

### SDD 自动执行

1. **D1 任务分配与评估**
   - AI 扫描代码，识别涉及文件：8 个文件，3 个接口变更
   - 判定为中等需求
   - 输出任务清单和 SP 估算

2. **D2 技术方案设计**
   - AI 代码锚定：扫描现有代码，设计文档中每个类/方法有真实代码出处
   - 生成 OpenSpec artifacts：
     - `proposal.md` - 需求提案
     - `design.md` - 技术设计文档
     - `tasks.md` - 任务清单

3. **D3 技术方案评审**（AI 自检）
   - 7 大维度自动检查
   - 输出评审结论：通过 / 有条件通过 / 不通过

4. **D4 开发编码**
   - AI 读取 design.md + tasks.md
   - 逐任务实现代码变更
   - 关键决策点暂停询问

5. **D5 代码评审**
   - AI 六维度审查
   - 人工审核双重闸门

6. **D6 测试与缺陷闭环**
   - 单元测试 → 功能自测 → 前后端联调
   - 缺陷必须闭环

### 效果

- 3-5 轮对话完成需求
- 技术方案有文档沉淀
- 代码质量双重保障

### 小贴士

::: tip
中等需求适合：
- 多模块改动
- 有前后端协作
- 需要技术方案
:::

---

## 场景六：SDD 大需求完整研发

### 背景

需求：新建订单履约系统，需要新建数据库、API、前后端页面，跨团队协作。

### 操作步骤

```bash
# 启动 SDD 流程
/bailu-sdd-start QYHT-29003 订单履约系统 新建子系统
```

### SDD 自动执行

1. **D1 任务分配与评估**
   - AI 扫描代码，识别涉及文件：15+ 个文件，新建模块
   - 判定为大需求
   - 输出任务清单和 SP 估算

2. **D2 技术方案设计**
   - 11 项模块逐项展开
   - 生成完整的 OpenSpec artifacts

3. **D3 技术方案评审**（正式评审会）
   - 录入评审人、结论、意见
   - 评审结论三态：通过 / 有条件通过 / 不通过
   - 不通过时退回 D2 修改

4. **D4 开发编码**
   - 按 tasks.md 逐任务实现
   - 关键决策点必须人工确认

5. **D5 代码评审**
   - AI 审核 + 人工审核
   - 加载语言 CR 规则（Java / PHP / Python / React）

6. **D6 测试与缺陷闭环**
   - 四环节测试：单元测试 → 功能自测 → 前后端联调 → 三方联调

7. **D7 上线/发版**
   - 上线前 Checklist
   - 创建 Merge Request
   - 更新发布清单

### 效果

- 多天多轮对话完成需求
- 完整的研发流程管控
- 代码质量有保障

### 小贴士

::: tip
大需求适合：
- 功能复杂、改动量大
- 需要正式评审会
- 跨团队协作
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
| dev | 代码开发 | SDD 七阶段引擎、代码审查、测试等 |
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

## 场景九：SDD 状态管理与断点恢复

### 背景

你在开发一个中等需求，突然被紧急任务打断，需要保存当前进度。

### 操作步骤

```bash
# 查看当前研发状态
cat ~/.bailu/state/sdd-state.yaml

# 状态文件示例
需求编号: QYHT-29002
需求名称: 用户登录重构
需求规模: 中等需求
当前阶段: D4-开发编码
当前分支: develop-20260602-task-QYHT-29002-zhangsan
技术方案路径: openspec/changes/QYHT-29002-user-login-refactor/design.md
```

### 断点恢复

```bash
# 继续上次的 SDD 流程
/bailu-sdd-start QYHT-29002

# AI 会自动读取状态文件，从上次中断的阶段继续
```

### 多需求并行

```bash
# 同时开发多个需求
/bailu-sdd-start QYHT-29001 订单列表 Excel 导出
/bailu-sdd-start QYHT-29002 用户登录重构

# 每个需求有独立的状态文件和分支
```

### 效果

- 支持断点恢复，不怕中断
- 多需求并行开发
- 完整的研发过程追溯

### 小贴士

::: tip
状态文件存储在 `~/.bailu/state/` 目录，建议定期备份。
:::

---

## 场景十：SDD 规模自动判定

### 背景

你不确定需求应该走哪个流程，让 AI 自动判断。

### 操作步骤

```bash
# 描述需求，让 AI 自动判定规模
/bailu-sdd-start QYHT-29004 给订单列表添加搜索功能
```

### AI 判定逻辑

**信号特征分析**：
- "添加" → 倾向小需求
- "搜索功能" → 可能涉及接口变更

**文件扫描分析**：
- 涉及文件：`OrderController.php`、`OrderService.php`、`order-list.blade.php`
- 接口变更：无
- 推荐规模：小需求

**最终判定**：
- 小需求（快速模式）
- 流程：D1 → D4 → D5 → D6

### 效果

- 自动选择最优流程
- 避免过度流程化
- 节省开发时间

### 小贴士

::: tip
如果对 AI 判定的规模有异议，可以手动指定：

```bash
/bailu-sdd-start QYHT-29004 给订单列表添加搜索功能 --size small
```
:::

---

## 进阶技巧

### 1. 自定义工作流

如果内置工作流不能满足需求，可以自定义：

```bash
# 编辑工作流配置
vim ~/.bailu/config/workflows/dev-workflow.yaml
```

### 2. 定期更新

保持工具和工作流更新：

```bash
# 更新 CLI
npm update -g @vickzhang/bailu-cli

# 更新工作流
bailu workflow install dev
```

### 3. 参与社区

分享你的最佳实践：

```bash
# 推荐优质工具
bailu serve  # 在 WebUI 中提交推荐

# 贡献代码
git clone https://github.com/vickzhang/bailu-cli
```
