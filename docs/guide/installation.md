# 安装与配置

## 环境要求

| 依赖 | 最低版本 | 说明 |
|------|----------|------|
| Node.js | **18.0.0** 及以上 | `@inquirer/prompts` 要求 |
| npm | 随 Node.js 附带 | 包管理器 |
| Git | 任意版本 | 可选，用于团队协作 |
| Claude Code 或 Qoder | 任意版本 | 至少安装一个 |

验证 Node.js：

```bash
node --version
# 应输出 v18.x.x 或更高
```

## 全局安装

```bash
npm install -g @vickzhang/bailu-cli
```

安装完成后 `bailu` 命令全局可用。

## 验证安装

```bash
bailu --version
# 输出：2.0.0

bailu --help
# 列出 5 个核心命令 + goal 子命令组
```

## 更新到最新版本

```bash
npm update -g @vickzhang/bailu-cli

bailu --version
```

## 卸载

```bash
# 1. 卸载已安装的工作流组件
cd your-project
bailu reset

# 2. 卸载全局 npm 包
npm uninstall -g @vickzhang/bailu-cli
```

## 配置文件

白鹿 v2 的所有配置都在**项目根目录**的 `.bailu.yaml` 中：

```yaml
# .bailu.yaml 示例
version: 2.0.0
platform: claude-code         # claude-code | qoder
scope: project                 # project | global
installedAt: 2026-06-09T10:00:00+08:00

# 已安装组件清单（由 bailu init 自动写入）
installed:
  skills:
    - bailu-sdd-start
    - bailu-sdd-d1-planning
    # ... 共 12 个
  commands:
    - bailu-init
    - bailu-dev
    - bailu-sdd-start
    - bailu-goal
  agents:
    - bailu-fullstack
  mcp:
    - context7
    - playwright
```

### 是否应该提交 .bailu.yaml 到 git？

**建议提交**。理由：

- 团队成员 `git pull` 后直接 `bailu update` 即可同步工作流
- 切换分支时如果 manifest 变化，状态文件能反映差异
- 不含敏感信息

如果出于某些原因不想提交，加到 `.gitignore` 即可。

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `BAILU_DEBUG` | 开启调试日志 | `false` |
| `BAILU_NO_COLOR` | 禁用彩色输出 | `false` |

## 从 v1 迁移

如果你之前使用过 v1（1.x 系列），有几点重要变化：

### 命令对照表

| v1 命令 | v2 命令或等价 |
|---------|---------------|
| `bailu workflow install dev` | `bailu init`（向导内一键完成）|
| `bailu workflow install ops` | ❌ v2 已移除 ops，专注开发场景 |
| `bailu tool install claude` | `bailu init`（向导选择 Claude Code）|
| `bailu mcp add` | `bailu init`（向导自动写入 mcp.json）|
| `bailu sync push/pull` | 用 git 直接管理 `.bailu.yaml` |
| `bailu serve` | ❌ v2 移除 WebUI，回归 CLI |
| `bailu recommend` | ❌ v2 移除，外部用 awesome-claude 列表 |
| `bailu audit` | ❌ v2 移除，外部用 `npm audit` |

### 配置位置变化

| v1 位置 | v2 位置 |
|---------|---------|
| `~/.bailu/config/` | 项目内 `.bailu.yaml` |
| `~/.bailu/projects.json` | 不再需要 |

### 升级步骤

```bash
# 1. 清理 v1 的全局配置（可选，看你是否还想保留）
rm -rf ~/.bailu

# 2. 清理 v1 安装到全局工具目录的残留
#    （v1 默认装到 ~/.claude/，v2 默认装到项目级）
rm -rf ~/.claude/skills/bailu-* ~/.claude/commands/bailu-*.md ~/.claude/agents/bailu-*.md

# 3. 更新 npm 包到 v2
npm install -g @vickzhang/bailu-cli@latest

# 4. 在每个项目中重新跑 init
cd your-project
bailu init
```

## 故障排查

### `bailu: command not found`

检查 npm 全局 bin 是否在 PATH 里：

```bash
npm config get prefix
# 输出类似 /usr/local 或 ~/.nvm/versions/node/v20.x.x

# 应该在 PATH 中能看到上述路径 + /bin
echo $PATH
```

### Node 版本太低

`@inquirer/prompts` 要求 Node 18+。用 nvm 升级：

```bash
nvm install 20
nvm use 20
```

### 权限错误

如果 `npm install -g` 报权限错误，用 nvm 是最干净的解决方式。**不建议** `sudo npm install -g`，这会导致后续维护麻烦。

## 下一步

- [快速开始](./getting-started)：3 分钟跑通第一个 SDD 需求
- [命令参考](/commands/)：每个命令的完整说明
- [SDD 研发工作流](./sdd-workflow)：深入了解七阶段流程
