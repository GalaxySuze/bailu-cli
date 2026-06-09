# 快速开始

3 分钟从安装到第一个 SDD 需求。

## 前置条件

| 依赖 | 最低版本 | 说明 |
|------|----------|------|
| Node.js | **18.0.0** | `@inquirer/prompts` 要求 |
| npm | 随 Node.js 附带 | 包管理器 |
| Claude Code 或 Qoder | 任意版本 | 至少安装一个目标工具 |

验证 Node.js：

```bash
node --version
# 应输出 v18.x.x 或更高
```

## 第一步：全局安装

```bash
npm install -g @vickzhang/bailu-cli
```

安装完成后验证：

```bash
bailu --version
# 输出：2.0.0
```

如果你在国内访问 npmjs 较慢，可临时切到官方源：

```bash
npm install -g @vickzhang/bailu-cli --registry https://registry.npmjs.org
```

## 第二步：在项目中初始化

```bash
cd your-project
bailu init
```

`bailu init` 是一个交互式向导，会依次询问：

1. **选择 AI 工具**：Claude Code / Qoder
2. **选择语言**：中文 / English（影响 Skills 的语言版本）
3. **选择安装范围**：
   - **project**（推荐）：装到当前项目的 `.claude/` 或 `.qoder/`
   - **global**：装到 `~/.claude/` 或 `~/.qoder/`
4. **冲突处理**（如已有同名文件）：跳过 / 覆盖 / 备份后覆盖

执行完成后，你的项目会多出：

```
your-project/
├── .bailu.yaml              # 白鹿状态文件（建议加入 git）
├── .claude/                 # 或 .qoder/
│   ├── skills/              # 12 个 SKILL.md
│   ├── commands/            # 4 个 slash 命令
│   └── agents/              # 1 个 fullstack agent
└── （你原有的文件）
```

如果想完全跳过交互直接安装默认配置：

```bash
bailu init --yes
```

## 第三步：查看状态

```bash
bailu status
```

输出示例：

```
🦌 白鹿工作流状态

  平台:      claude-code (Claude Code)
  语言:      zh
  范围:      project
  版本:      2.0.0

✓ Skills:    12 / 12
✓ Commands:  4 / 4
✓ Agents:    1 / 1
✓ MCP:       2 个已配置

下一步:
  → 在 Claude Code 中输入 /bailu-sdd-start 开始一个 SDD 需求
  → 或输入 /bailu-dev 进入开发模式
```

## 第四步：启动一个 SDD 需求

打开 Claude Code，在对话框输入：

```
/bailu-sdd-start
```

白鹿会引导你完成：

1. 收集需求信息（标题、目标、相关文件）
2. 自动判断需求规模（小 / 中 / 大）
3. 根据规模路由到对应阶段：
   - 小需求：D1 → D4 → D6
   - 中需求：D1 → D2 → D4 → D5 → D6
   - 大需求：D1 → D2 → D3 → D4 → D5 → D6 → D7

详细流程参见 [SDD 研发工作流](./sdd-workflow)。

## 第五步（可选）：开启 Goal 无人值守

如果你想让 AI 自动推进一个长链路目标：

```bash
# 在项目中初始化 .goal/ 骨架
bailu goal init

# 编辑 .goal/current.md 填入目标与完成条件
# 然后手动跑一轮看看效果
bailu goal run

# 满意后安装 launchd 进入真正无人值守
bailu goal install-launchd --interval 1800   # 30 分钟唤醒一次
```

详细参见 [Goal 无人值守 → 快速上手](/goal/quick-start)。

## 常见问题

### npm install 失败

试试官方源：

```bash
npm install -g @vickzhang/bailu-cli --registry https://registry.npmjs.org
```

### 提示找不到 Claude Code

`bailu doctor` 看一下：

```bash
bailu doctor
```

如果 Claude Code 标为 `optional: missing`，意味着你的系统里还没装。安装后再跑 `bailu init` 即可。

### 想完全卸载白鹿

```bash
# 1. 卸载已安装的 Skills/Commands/Agent
bailu reset

# 2. 卸载 npm 包
npm uninstall -g @vickzhang/bailu-cli
```

## 下一步

- 深入了解 [SDD 研发工作流](./sdd-workflow)
- 阅读 [Goal 无人值守模式](/goal/)
- 浏览 [命令参考](/commands/)
