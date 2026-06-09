# 团队协作

白鹿 v2 把团队协作简化为一句话：**把 `.bailu.yaml` 提交到 git，团队成员 pull 后 `bailu update` 就完事**。

## 工作原理

```
        ┌────────────────────────────────────┐
        │       Git 仓库（你的项目）          │
        │                                    │
        │   .bailu.yaml ← 状态文件           │
        │   .claude/    ← Skills/Commands    │
        │   .qoder/                          │
        │                                    │
        └────────┬─────────────────┬─────────┘
                 │ git pull        │ git pull
        ┌────────┴─────────┐  ┌────┴────────────┐
        │   成员 A         │  │   成员 B        │
        │                  │  │                 │
        │   bailu update   │  │   bailu update  │
        │   → 同一套配置   │  │   → 同一套配置  │
        └──────────────────┘  └─────────────────┘
```

不需要中央配置服务器。不需要 sync push/pull 命令（v1 时代的复杂机制 v2 全部移除）。

## 完整流程

### 第一个人：项目发起者

```bash
# 1. 在项目里初始化白鹿
cd your-project
bailu init
# 选择 Claude Code、zh、project、备份后覆盖

# 2. 把白鹿生成的文件加入 git
git add .bailu.yaml .claude/
git commit -m "chore: 初始化白鹿工作流"

# 3. push
git push origin main
```

### 后续成员

```bash
# 1. 克隆项目
git clone <repo-url>
cd your-project

# 2. 全局装白鹿（如未装）
npm install -g @vickzhang/bailu-cli

# 3. 一键同步
bailu update
```

`bailu update` 会读取项目里已有的 `.bailu.yaml`，按照其中的配置（platform / language / scope）重新部署。

### 后续白鹿升级

任意成员：

```bash
# 1. 升级 npm 包
npm update -g @vickzhang/bailu-cli

# 2. 升级项目里的 Skills（如果 manifest 有更新）
bailu update --yes

# 3. 把更新提交
git add .claude/
git commit -m "chore: 升级白鹿到 v2.1.0"
git push
```

其他成员 pull 后 `bailu update` 即可。

## 该提交什么、该忽略什么

### 应该提交

| 文件/目录 | 原因 |
|---|---|
| `.bailu.yaml` | 状态文件，团队需要一致 |
| `.claude/skills/bailu-*/` | Skills 内容，确保所有人 AI 行为一致 |
| `.claude/commands/bailu-*.md` | slash 命令 |
| `.claude/agents/bailu-*.md` | Agents |
| `.qoder/...` | 如果团队也用 Qoder |

### 应该忽略

| 文件/目录 | 原因 |
|---|---|
| `.bailu-backup/` | 个人备份，无需共享 |
| `.sdd/` | SDD 运行时状态，因人而异 |
| `.goal/` | Goal 运行时状态（个人推进任务） |

`.gitignore` 推荐配置：

```text
# 白鹿运行时产物
.bailu-backup/
.sdd/
.goal/
```

## 关于 CLAUDE.md / QODER.md

`bailu init` 不会自动生成 `CLAUDE.md`（或 `QODER.md`）——这是 Claude Code / Qoder 的项目级 system prompt 文件，需要你**手动用 `/bailu-init` slash 命令**生成（在 AI 工具里输入）。

`CLAUDE.md` 通常包含：
- 项目背景
- 技术栈
- 编码规范
- 关键目录说明

这是**最重要的团队协作文件**——它让所有 AI 协同动作有共同上下文。

## 跨项目复用工作流

如果你有多个项目都想用白鹿：

```bash
# 项目 A
cd project-a
bailu init
git add . && git commit -m "init bailu"

# 项目 B（用同样的 manifest）
cd ../project-b
bailu init
git add . && git commit -m "init bailu"
```

每个项目独立 `.bailu.yaml`，互不干扰。这是 v2 的设计：**项目级隔离 > 全局共享**。

## 与 SDD / Goal 的关系

| 工具 | 与团队协作的关系 |
|------|-----------------|
| SDD | `.sdd/sdd-context.md` **不应**提交 git（每人各自开发不同需求）|
| Goal | `.goal/` **不应**提交 git（无人值守是个人推进） |

如果团队多人同时跑 SDD，**用 git branch 隔离**——每人一个 feature 分支，各自的 `.sdd/` 不冲突。

## 故障排查

### 同步后 bailu status 显示有缺失

```bash
# 重新跑 update
bailu update --yes
```

通常是因为 manifest 更新了但本地 Skills 还是旧的。

### 不同成员 Node 版本不一致

`bailu doctor` 会提示。统一升级到 Node 18+。

### 多个项目互相干扰

不会。`.bailu.yaml` 是项目级的，互不影响。

## 下一步

- [最佳实践](./best-practices)
- [bailu init 命令](/commands/init)
- [SDD 研发工作流](./sdd-workflow)
