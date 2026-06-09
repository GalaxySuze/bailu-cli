# 常见问题

## 安装

### bailu: command not found

npm 全局 bin 不在 PATH 里：

```bash
npm config get prefix
# 输出类似 /usr/local 或 ~/.nvm/versions/node/v20.x.x

# 把这个路径 + /bin 加到 PATH
# nvm 用户通常不用加，nvm 自动管理
# 非 nvm 用户：
export PATH="$(npm config get prefix)/bin:$PATH"
```

### EACCES: permission denied

别用 sudo。用 nvm：

```bash
# 装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash

# 装 Node
nvm install 20
nvm use 20

# 装白鹿
npm install -g @vickzhang/bailu-cli
```

### npm install 特别慢

国内切官方源：

```bash
npm install -g @vickzhang/bailu-cli --registry https://registry.npmjs.org
```

## 使用

### bailu init 卡在某个提问

检查终端是否支持彩色输出？试试：

```bash
TERM=xterm-256color bailu init
```

### bailu init 后 AI 工具里看不到 /bailu-sdd-start

```bash
# 1. 确认装到了正确位置
ls .claude/commands/bailu-sdd-start.md
# 应该存在

# 2. 重启 AI 工具重新加载命令列表

# 3. 还是不行？检查 scope
bailu status
# scope = project → 在项目里开 AI 工具
# scope = global → 在任何地方都能
```

### bailu status 显示 Skills 缺失

```bash
bailu update
```

### 能同时用 Claude Code 和 Qoder 吗

可以。`bailu init` 先选 Claude Code 装一次，再选 Qoder 装一次。`.bailu.yaml` 会记录两个平台。

## 升级

### 如何升级

```bash
npm update -g @vickzhang/bailu-cli
bailu update --yes   # 重装新 Assets
```

### 升级后 Skills 还是旧的

`bailu update` 没跑？或者跑的时候选的 skip？再跑一次。

## 卸载

### 完全清除白鹿

```bash
# 1. 每个项目 reset
bailu reset --confirm

# 2. 卸载 launchd（用了 Goal 的话）
bailu goal uninstall-launchd

# 3. 卸载 npm
npm uninstall -g @vickzhang/bailu-cli
```

## 概念

### v2 和 v1 有什么核心区别？

| 维度 | v1 | v2 |
|------|----|----|
| 命令数 | ~35 个 | 5 + 7 = 12 个 |
| 安装位置 | `~/.bailu/` 全局 | `.bailu.yaml` 项目级 |
| WebUI | 有 | 砍掉，专注 CLI |
| TUI | 有 | 砍掉 |
| 工作流 | dev / ops 两套 | 仅 dev（SDD） |
| 支持的 AI | Claude / Qoder / Trae / Cursor / Hermes / Codex | Claude Code / Qoder |
| 无人值守 | 无 | Goal 模式（v2 新增） |

### bailu --yes 和 bailu init --yes 什么关系

`--yes` 是全局选项，对所有命令生效。`bailu init --yes` = 用默认值跳过所有交互。

### 为什么不支持更多工具了？

v2 的精简哲学：在一两个工具上把体验做到最好，比在 6 个工具上都"能用但不爽"更有价值。更多工具的支持通过社区适配或官方扩展实现。

## 与具体工具的集成

### 和 Claude Code 配合

- 需要 Claude Code 本体（[安装指南](https://claude.ai/code)）
- `bailu init` 选 Claude Code
- 输入 `/bailu-sdd-start` 开始

### 和 Qoder 配合

- 需要 Qoder 编辑器
- `bailu init` 选 Qoder
- 输入 `/bailu-sdd-start` 开始

### 和 Codex 配合

当前**不完全支持**。`bailu doctor` 能检测，但 `bailu init` 不能选 Codex 作为目标。需要等 Codex 的 Skills 协议稳定。

## 关于 Goal

Goal 相关问题移到 [Goal 常见问题](/goal/faq)。

## 错误代码

### 常见非零退出码

| 退出码 | 含义 | 下一步 |
|--------|------|--------|
| 1 | 一般错误 | 看终端输出 |
| 2 | Commander 经典错误 | 检查命令拼写 |
| 100 | 环境不满足 | `bailu doctor` |
| 101 | 状态文件损坏 | 检查 `.bailu.yaml` |
| 102 | 安装失败 | 重试或 `bailu reset` 再 init |
| 103 | 权限不足 | 检查文件权限 |