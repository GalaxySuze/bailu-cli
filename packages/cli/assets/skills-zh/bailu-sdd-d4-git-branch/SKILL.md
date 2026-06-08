---
name: bailu-sdd-d4-git-branch
description: "白鹿SDD辅助：交互式创建规范 Git 分支。触发词：创建分支、新建分支、开个分支、建branch、切分支、开发分支、修复分支。"
---

# Git 规范分支创建

分支命名格式：`{分支前缀}-{YYYYMMDD}-{类型}-{需求编号}-{功能描述}-{git用户名}`

示例：
- `develop-20260416-task-DEMO-002-特调通知优化-zhangsan`
- `develop-20260416-bug-DEMO-002-特调通知修复-zhangsan`
- `feature-20260416-task-PROJ-12345-add-export-vickzhang`
- `hotfix-20260416-bug-PROJ-67890-fix-timeout-vickzhang`

## 执行步骤

### Step 1：收集参数

**优先从上下文自动推断**，减少不必要的询问：

- 日期：自动取当天（`date +%Y%m%d`）
- 开发者：自动取 `git config user.name`
- 需求编号：若用户在触发时已提供则直接使用

**一次性展示所有待确认参数**，用户可批量确认或修改，不逐一打断：

```
即将创建分支，请确认以下参数（直接回车全部确认）：

需求编号  : PROJ-12345（已从上下文读取，可修改）
分支类型  : task（1-task / 2-bug，默认1）
功能描述  : （可留空；如填写请用英文或拼音，避免中文在 Git 工具中乱码）
开发者    : zhangsan（已从 git config 读取）
分支前缀  : develop（1-develop / 2-feature / 3-hotfix / 4-release，默认1）
基础分支  : master（可修改）
```

> 建议功能描述使用拼音或英文，避免中文字符在部分 Git 工具中出现编码问题。

若 `git config user.name` 为空，补充询问开发者名称后再展示确认界面。

### Step 2：构造分支名并确认

拼接规则：
- 有功能描述：`{分支前缀}-{日期}-{类型}-{需求编号}-{功能描述}-{git用户名}`
- 无功能描述：`{分支前缀}-{日期}-{类型}-{需求编号}-{git用户名}`

向用户展示完整分支名，确认无误后执行。

### Step 3：执行 Git 命令

```bash
git checkout {基础分支} && git pull origin {基础分支}
git checkout -b "{完整分支名}"
```

若任意命令执行失败，立即停止并将完整错误信息展示给用户，不继续后续步骤。

本地分支创建成功后输出当前分支名，然后询问用户：

```
本地分支已创建，是否同时推送到远程？(y/N)：
```

- 输入 `y` → 执行推送：
  ```bash
  git push -u origin "{完整分支名}"
  ```
  成功后提示远程分支已创建。
- 输入 `n` 或直接回车 → 跳过，仅保留本地分支。

### Step 4：写入 SDD 上下文

分支创建成功后，自动在项目根目录写入/更新 `.sdd/sdd-context.md`：

```bash
mkdir -p .sdd
GIT_USER=$(git config user.name)
PROJECT=$(basename $(git rev-parse --show-toplevel))
DATE=$(date +%Y-%m-%d)
```

写入字段：

| 字段 | 值 | 来源 |
|------|----|------|
| 需求编号 | 用户输入的需求编号 | Step 1 ① |
| 需求名称 | 用户输入的功能描述（若有） | Step 1 ③ |
| 当前阶段 | D4 | 固定值 |
| 当前分支 | 完整分支名 | Step 2 |
| change-name | 需求编号（用于 OpenSpec 目录） | 自动取值 |
| 需求规模 | 待评估 | 初始值 |
| 技术方案路径 | （留空，由 D2 openspec-workflow 填入） | — |
| SP总计 | （留空，由 D1 story-points-estimator 填入） | — |
| 开始日期 | 当天日期 | 自动获取 |
| 执行人 | git config user.name | 自动获取 |
| 工程名 | basename of git root | 自动获取 |

写入格式：

```
需求编号: {需求编号}
需求名称: {功能描述或留空}
当前阶段: D4
当前分支: {完整分支名}
change-name: {需求编号}
需求规模: 待评估
技术方案路径: ""
SP总计: ""
开始日期: {DATE}
执行人: {GIT_USER}
工程名: {PROJECT}
```

若 `.sdd/sdd-context.md` 已存在，覆盖全部字段。写入完成后提示用户：

```
✅ sdd-context.md 已更新，当前阶段：D4
```
