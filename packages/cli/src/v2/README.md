# 白鹿 CLI v2 精简版

## 设计理念

从"35个命令 + 3套界面 + 7种组件"的瑞士军刀，精简为"1个交互式向导 + 1个状态文件 + 1个工作流"的精准工具。

**核心原则：**
- 最低心智成本：用户从安装到开始使用，只需要记住 2 个命令
- 先跑通一个流程：先把"开发工作流安装到 Claude Code"这一个流程打磨到健壮
- 做减法：暂停 WebUI、TUI 等非核心功能
- 状态驱动：用一个 `.bailu.yaml` 状态文件记录一切

## 命令清单（5个）

```bash
npm install -g @vickzhang/bailu-cli    # 安装

bailu init                             # 交互式初始化（唯一需要记住的命令）
bailu status                           # 查看当前状态和下一步指引
bailu update                           # 更新工作流到最新版本
bailu doctor                           # 环境诊断
bailu reset                            # 重置（清除已安装的配置，回到初始状态）
```

## 架构设计

### 目录结构

```
packages/cli/
├── bin/
│   ├── bailu.js           # v1 入口（保持兼容）
│   └── bailu-v2.js        # v2 入口
└── src/
    ├── v2/
    │   ├── index.js        # CLI 程序入口
    │   ├── state.js        # 状态文件管理
    │   ├── platforms.js    # 平台检测
    │   └── commands/
    │       ├── init.js     # 初始化命令
    │       ├── status.js   # 状态查看命令
    │       ├── update.js   # 更新命令
    │       ├── doctor.js   # 诊断命令
    │       └── reset.js    # 重置命令
    └── ...                 # v1 代码（保持不变）
```

### 核心模块

#### 1. 状态文件管理 (`state.js`)

使用 `.bailu.yaml` 记录所有安装状态：

```yaml
version: "2.0.0"
installedAt: "2026-06-08"
scope: "project"
language: "zh"
platforms:
  claude-code:
    installed: true
    skills: ["bailu-sdd-start", ...]
    agents: ["bailu-fullstack.md"]
    commands: ["bailu-sdd-start.md"]
    installedAt: "2026-06-08"
workflows:
  dev:
    version: "1.0.0"
    installedAt: "2026-06-08"
```

#### 2. 平台检测 (`platforms.js`)

数据化平台定义，新增平台只加一条记录：

```javascript
const PLATFORMS = {
  'claude-code': {
    id: 'claude-code',
    name: 'Claude Code',
    skillsDir: '.claude/skills',
    globalSkillsDir: '~/.claude/skills',
    detectionPaths: ['.claude'],
    detectionCommand: 'claude --version'
  },
  // ...
};
```

#### 3. 命令框架

每个命令都遵循统一结构：
- 参数解析
- 环境检测
- 交互式引导
- 执行逻辑
- 结果展示

### 与 v1 的关系

v2 精简版在独立分支 `refactor/v2-minimal` 上开发，**不碰现有 v1 代码**：

- v1 继续维护，直到 v2 稳定
- v2 使用新的入口文件 `bin/bailu-v2.js`
- v2 代码放在 `src/v2/` 目录
- 发布时可以同时发布两个版本

## 开发进度

### 第一步：搭建精简版骨架 ✅

- [x] 创建 v2 目录结构
- [x] 实现 5 个命令的框架
- [x] 实现 `.bailu.yaml` 状态文件读写
- [x] 实现平台检测模块
- [x] 测试 CLI 基本功能

### 第二步：实现 Claude 族安装器（进行中）

- [ ] 从现有 `installer/claude.js` 提取核心逻辑
- [ ] 简化为只支持 Claude Code + Qoder 编辑器
- [ ] 实现 dev 工作流的部署逻辑

### 第三步：实现交互式 init 向导

- [ ] 基于 @inquirer/prompts 实现完整流程
- [ ] 环境检测 → 选项引导 → 安装执行 → 完成指引

### 第四步：测试与打磨

- [ ] 在真实项目中使用
- [ ] 收集反馈，迭代改进
- [ ] 重点打磨 init 流程和 status 准确性

## 设计参考

本设计深度参考了 Comet CLI（`@rpamis/comet`）的优秀实践：

1. **三层组件体系**：OpenSpec + Superpowers + Comet，分层独立可替换
2. **清单驱动安装**：`assets/manifest.json` 定义文件列表，安装器只负责按清单复制
3. **冲突解决三级策略**：批量覆盖 → 批量跳过 → 逐个选择
4. **全命令 `--json` 输出**：CI/CD 友好
5. **`--yes` 全自动模式**：所有交互都有默认值
6. **平台定义数据化**：新增平台只加一条记录

## 成功标准

### 用户体验指标

- **3 步完成安装**：npm install → bailu init → 开始使用
- **0 个需要记忆的命令**：除了 `bailu init`
- **init 过程 < 2 分钟**：正常情况下不超过 2 分钟
- **status 回答"我在哪，下一步做什么"**

### 技术指标

- **代码量 < 2,000 行**（CLI 核心，不含工作流内容）
- **依赖包 < 50 个**（node_modules）
- **安装体积 < 5MB**

## 下一步

1. 实现 Claude 族安装器核心逻辑
2. 完善交互式 init 向导
3. 添加测试用例
4. 在真实项目中验证

---

**分支**：`refactor/v2-minimal`  
**状态**：开发中  
**最后更新**：2026-06-08
