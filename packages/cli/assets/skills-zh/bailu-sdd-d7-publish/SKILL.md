---
name: bailu-sdd-d7-publish
description: "白鹿SDD研发阶段D7上线/发版助手。触发词：发版、上线、创建MR、提交PR、发布、D7、创建合并请求、merge request。"
---

# SDD D7 - 上线/发版

## 概述

D7 是 D6 测试与缺陷闭环完成后的**可选增强阶段**，负责上线准备与合并请求流程：

- 检查分支、变更范围、提交记录，确认代码具备进入目标分支的条件
- 检测 Nacos、MQ、xxl-job、PG 等发布风险项
- 为相关分支创建 Merge Request 到目标分支
- 更新发布清单
- 标记需求研发阶段完成

**D7 是可选的**：D6 完成后，用户可以选择：
1. 进入 D7，由 AI 辅助执行上线前检查 + 创建 MR
2. 跳过 D7，自行手动创建 Merge Request，直接标记需求完成

**D7 不做**：修复测试缺陷。测试发现的问题应在 D6「测试与缺陷闭环」内修复并复测通过后，再进入 D7。

## 白鹿 Agent 路由

D7 发版阶段可路由到白鹿 `code-reviewer` Agent 进行上线前的最终代码审查，确保 MR/PR 的变更范围和提交记录符合规范。

路由方式：
- 自动检测到 D7 阶段时，提示用户是否启用 `code-reviewer` Agent 做最终审查
- 用户也可主动说"用 code-reviewer 最终审查"来触发 Agent 路由

## 阶段入口契约

### 前置条件

进入 D7 上线/发版阶段前，必须满足以下条件：

1. 当前阶段 = `D7`（读取 `.sdd/sdd-context.md` 确认）
2. D6 测试与缺陷闭环已完成（所有测试通过，缺陷已修复或标记为外部阻塞）
3. D5 代码评审已通过

### 输入产物

- `.sdd/sdd-context.md` — SDD 上下文
- `openspec/changes/<change-name>/review.md` — D5 代码评审和 D6 测试记录
- `openspec/changes/<change-name>/design.md` — 技术设计方案（作为发布风险识别参考，若存在）

## Step 1：读取上下文

读取 `.sdd/sdd-context.md`，确认当前阶段为 `D7`。

若不是 D7，停止并提示先完成 D6 测试与缺陷闭环。

读取：
- `openspec/changes/<change-name>/review.md` — 确认 D5 代码评审和 D6 测试记录
- `openspec/changes/<change-name>/design.md` — 作为发布风险识别参考（若存在）

若 D6 测试记录不存在，提示风险并询问是否继续；用户确认后才继续。

## Step 2：确认发版信息

询问并确认以下信息：

```
发版确认，请确认以下信息：

1. 需求编号：{需求编号}（确认或修改）
2. 开发者姓名：{执行人}（用于 MR 标题和发布清单）
3. 目标分支：默认 master，请按实际发版目标确认或修改（如 main / release/xxx / develop）
4. Git 平台访问凭据：用于创建 MR/PR（若当前环境已有可用配置，可直接复用）
5. 项目根目录：用于搜索相关子项目和分支
6. 发布清单路径：用于追加发版记录
```

**本地配置读取规则**：

优先从用户级配置目录读取，避免 skill 自动更新时丢失：

```bash
CONFIG_DIR="$HOME/.bailu/d7-release"
TOKEN_FILE="$CONFIG_DIR/token.txt"
PROJECT_ROOT_FILE="$CONFIG_DIR/project-root.txt"
RELEASE_LIST_FILE="$CONFIG_DIR/release-list.txt"
```

- Token：若 `token.txt` 存在则自动使用；不存在则询问用户
- 项目根目录：若 `project-root.txt` 存在则自动使用；不存在则询问用户
- 发布清单路径：若 `release-list.txt` 存在则自动使用；不存在则询问用户

首次收集后，执行：

```bash
mkdir -p "$CONFIG_DIR"
chmod 700 "$CONFIG_DIR"
```

将 Token 写入 `token.txt` 后执行：

```bash
chmod 600 "$TOKEN_FILE"
```

不要将 Token 写入项目仓库、`.sdd/` 目录或 skill 安装目录。

## Step 3：上线前 Checklist

在创建 MR 前，先输出并执行上线前检查：

```markdown
## D7 上线前 Checklist - {需求编号}

### 分支检查
- [ ] 当前分支符合团队规范
- [ ] 目标分支确认：{targetBranch}
- [ ] 远程分支存在且可访问

### 变更检查
- [ ] diff 范围符合本次需求
- [ ] 无明显无关文件、临时代码、调试日志
- [ ] D6 测试与缺陷闭环已完成

### 提交记录检查
- [ ] 增量提交记录清晰
- [ ] 提交内容可对应需求编号/功能点

### 发布风险检查
- [ ] Nacos 配置变更已识别
- [ ] MQ Topic/Group 变更已识别
- [ ] xxl-job 变更已识别
- [ ] PG DDL/DML 变更已识别
```

若发现阻塞项，暂停并让用户确认处理方式；非阻塞风险记录到发布清单。

## Step 4：搜索相关分支

若用户输入完整分支名，直接进入 Step 5。

否则根据需求编号遍历项目根目录下所有子项目，搜索匹配需求编号的远程分支：

```bash
for dir in {项目根目录}/*/; do
  project=$(basename "$dir")
  git -C "$dir" branch -r 2>/dev/null | grep -i "{需求编号}" | while read branch; do
    branch=${branch#origin/}
    echo "$project|$branch"
  done
done
```

将所有匹配到的分支按应用分组展示给用户确认。

若未匹配到分支，询问用户手动提供分支名。

## Step 5：获取增量提交与变更范围

对每个确认的分支执行：

```bash
git -C {项目目录} fetch origin {分支名}
git -C {项目目录} log origin/{目标分支}..origin/{分支名} --pretty=format:"%s"
git -C {项目目录} diff --stat origin/{目标分支}...origin/{分支名}
```

输出：
- 增量提交列表
- diff 文件统计
- 15 字以内核心改动描述建议

若 diff 明显超出需求范围，暂停并让用户确认是否继续创建 MR。

## Step 6：检测发布风险

对每个确认的分支，基于 diff 检查以下风险：

**Nacos 配置**：扫描 `application*.yml`、`bootstrap*.properties` 等配置文件 diff，以及 `.java` 文件中的 `@Value("${xxx}")` 和 `@ConfigurationProperties` 注解。

**MQ 配置**：扫描 `.java` 文件 diff，识别 `@BatchRocketMqListener`、`@RocketMqListener` 注解，以及 `MqConstants` 中的 `XXX_TOPIC`、`XXX_GROUP` 常量。

**xxl-job 配置**：扫描 `.java` 文件 diff，识别 `@XxlJob(value = "xxx")` 注解。

**PG DDL/DML**：扫描 `.sql` 文件和 MyBatis XML mapper 文件中的 DDL/DML 语句。

若检测到上述变更，展示给用户确认，并记录到发布清单；PG DDL/DML 需等待用户提供 DBA 工单信息后再继续。

## Step 7：创建 MR/PR

### 自动检测 Git 平台 CLI

优先检测系统中可用的 Git 平台命令行工具，按以下优先级：

```bash
# 检测 GitHub CLI
command -v gh &>/dev/null && echo "github" || \
# 检测 GitLab CLI
command -v glab &>/dev/null && echo "gitlab" || \
# 检测 Gitee CLI
command -v tea &>/dev/null && echo "gitee" || \
echo "none"
```

### 使用对应 CLI 创建 MR/PR

**GitHub CLI (`gh`)**：

```bash
gh pr create \
  --base "{目标分支}" \
  --head "{分支名}" \
  --title "{需求编号} {15字内核心改动}" \
  --body "{需求编号} {15字内核心改动}"
```

**GitLab CLI (`glab`)**：

```bash
glab mr create \
  --target-branch "{目标分支}" \
  --source-branch "{分支名}" \
  --title "{需求编号} {15字内核心改动}" \
  --description "{需求编号} {15字内核心改动}"
```

**Gitee CLI (`tea`)**：

```bash
tea pulls create \
  --base "{目标分支}" \
  --head "{分支名}" \
  --title "{需求编号} {15字内核心改动}" \
  --description "{需求编号} {15字内核心改动}"
```

**无可用 CLI（手动创建）**：

若以上 CLI 均不可用，输出手动创建指引：

```
未检测到 gh / glab / tea 命令行工具，请手动创建 Merge Request：

分支：{分支名} → {目标分支}
标题：{需求编号} {15字内核心改动}

请在 Git 平台页面完成创建后回复"已创建"或提供 MR/PR 链接。
```

保存每个应用的 MR 地址。

### 凭据管理

- Token/凭据保存在 `~/.bailu/d7-release/token.txt`（权限 600）
- 若 CLI 未登录，引导用户执行对应的登录命令（`gh auth login` / `glab auth login` / `tea login`）
- 不要在日志或输出中打印 Token 内容

## Step 8：更新发布清单

将发布信息追加到发布清单文件：

1. 读取发布清单根目录
2. 按当天日期 `{发布清单根目录}/{年}/{月}/{日期}/git.txt` 创建文件
3. 追加发布信息
4. 询问用户确认后，提交并 push 发布清单仓库

格式：

```markdown
# 日期：{当前日期}

## 开发姓名：{开发者姓名}
### 应用名称：{应用名1}、{应用名2}...
### 大致功能描述：{需求编号} {15字内核心改动}
### 目标分支：{目标分支}
### 分支名称：{完整分支名}
### 合并请求地址：
{MR地址1}
{MR地址2}

### 发布风险
- Nacos：{无/配置项说明}
- MQ：{无/Topic/Group 说明}
- xxl-job：{无/Job 说明}
- PG：{无/SQL 工单地址}
```

## Step 9：发版阶段完成

输出完整 MR 汇总：

```markdown
## D7 上线/发版完成 - {需求编号}

**需求编号**：{需求编号}
**开发姓名**：{开发者姓名}
**目标分支**：{目标分支}
**完成日期**：{当前日期}

### MR 汇总
| 应用 | 分支 | MR 地址 |
|------|------|---------|
| 应用1 | 分支名 | MR地址 |
| 应用2 | 分支名 | MR地址 |

### 发布风险
| 类型 | 应用 | 说明 |
|------|------|------|
| Nacos | 应用1 | 配置变更说明 |
| MQ | 应用2 | Topic/Group 说明 |
| xxl-job | - | Job 说明 |
| PG | - | SQL 工单地址 |

### 发布清单
{发布清单文件路径}
```

更新 `.sdd/sdd-context.md`（只修改以下字段，禁止写入其他内容）：

```
当前阶段: 完成
```

输出进度块（按根 SKILL.md 的进度块规则，D1-D7 全部标 ✅），然后输出：

```
🎉 需求 {需求编号} 研发阶段全部完成！
📋 MR 汇总已输出，发布清单已更新。
```

## 边界与注意事项

- D7 输入可以是需求编号或完整分支名
- 创建 MR、提交发布清单、push 发布清单仓库都属于外部可见操作，执行前必须向用户确认
- 不在 D7 修复测试缺陷；发现代码问题应退回 D6 完成测试与缺陷闭环
- 若检测到 PG DDL/DML 变更，需等待用户提供 DBA 工单信息后再追加到发布清单
- 若检测到 xxl-job 变更，需向用户确认 cron 调度频率
- Token 只能保存到用户级配置目录（`~/.bailu/`），不得提交到仓库或写入 skill 安装目录
