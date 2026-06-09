# bailu update

更新工作流到最新版本，重新部署 Skills/Commands/Agent。

## 用法

```bash
bailu update [options]
```

## 选项

| 选项 | 说明 | 默认 |
|------|------|------|
| `--check` | 仅检查是否有更新，不执行 | `false` |
| `--yes` | 自动重新部署 Skills，CLI 升级仍需确认 | `false` |

## 什么时候用

- **CLI 版本升级后**：`npm update -g @vickzhang/bailu-cli` 之后跑 `bailu update` 把新版资产部署到项目
- **`bailu status` 提示有缺失**：补全缺失的 Skills/Commands
- **manifest 有变动**：比如新增 `bailu-goal` Skill 后

## 行为说明

### 默认行为（无参数）

```
🦌 检查更新...

  当前版本: 2.0.0
  最新版本: 2.0.1

  有新版本可用。需要先升级 CLI：

  npm install -g @vickzhang/bailu-cli@latest

升级后再次运行 bailu update 部署新资产。
```

### `--yes` 模式

跳过 Skills 重新部署的交互确认，但 **CLI 自身升级仍需手动 npm update**。这是有意为之，避免脚本自动改变全局环境。

```bash
bailu update --yes
```

### `--check` 模式

只查不动：

```bash
bailu update --check
```

输出当前与最新版本对比，不做任何修改。

## 升级流程

完整升级流程：

```bash
# 1. 升级 npm 包
npm update -g @vickzhang/bailu-cli

# 2. 验证版本
bailu --version

# 3. 在每个使用白鹿的项目里重新部署
cd project-a
bailu update --yes

cd ../project-b
bailu update --yes
```

## 注意事项

### 已修改的 Skills 会被覆盖吗？

会。`bailu update` 直接重写 `.claude/skills/bailu-*/SKILL.md`。如果你**手动改过**这些文件，建议先备份：

```bash
cp -r .claude/skills/bailu-sdd-start ~/backup/
```

或者把改动 fork 出来作为自己的 Skill 而不是直接修改白鹿的。

### 不会动什么？

- 不会动 `.claude/skills/` 下**非 `bailu-*` 开头**的 Skills（其他来源的）
- 不会动你项目里的 `.sdd/`、`.goal/`（这些是 SDD/Goal 运行时产物）
- 不会动 `~/.claude.json` 中已配置的 MCP（只追加，不修改已有）

## 与其他命令的关系

- 升级前 → [`bailu status`](./status) 查看当前状态
- 升级后 → [`bailu status`](./status) 验证组件齐全
- 想完全重装 → [`bailu reset`](./reset) + [`bailu init`](./init)
