# Goal: <在这里填一个简短、可识别的目标名>

<!--
  这是当前无人值守任务的「目标契约」。
  AI 执行器必须围绕本文件工作，而不是围绕一次性聊天上下文。
  请逐节填写。空着的章节会被 runner 视为「未完成定义」，可能拒绝执行。
-->

## 目标

<!--
  用 1~3 句话描述本次无人值守任务最终要达成什么。
  写得越客观，AI 越不容易跑偏。
  例：完成 X 模块重构，使其通过 npm test 并能由 bailu serve 正常启动。
-->

## 范围

<!--
  允许 AI 触碰的文件、目录、命令；不允许的也必须写清楚。
  例：
  - 允许修改 packages/xxx/ 下的源文件、测试、文档。
  - 不允许修改发布凭证、~/.ssh、~/.npmrc。
  - 不允许 git push、npm publish、git reset --hard。
-->

## 完成条件

<!--
  每一条都必须是「可验证」的客观条件，可以用命令或自检结果判定。
  例：
  - `npm test` 全部通过。
  - `npm run build` 成功。
  - `bailu serve` 能启动并响应 /health。
  - CHANGELOG 已追加本次条目。
  - 当前执行器完成自检，未发现 P0/P1 问题。
-->

## 每轮执行规则

- 每轮只选择 1~3 个最小原子任务。
- 修改代码前，先在 `.goal/progress.md` 记录本轮计划。
- 每完成一个原子任务，运行相关最小验证（测试 / 构建 / 冒烟）。
- 验证失败时，不允许把任务标记为完成。
- 本轮结束必须同步更新 `.goal/state.json`、`.goal/progress.md`、`.goal/verification.log`。

## 中止条件

<!-- 默认中止条件如下，可按需追加。-->

- 遇到需要用户决策的产品取舍。
- 连续 3 次同一项验证失败。
- Git 工作区出现与本目标无关的变更冲突。
- Claude 不可用或 token 不足。
- 上下文无法可靠恢复。

## 安全边界（无人值守强制）

- 默认只在当前项目 `cwd` 内操作。
- 禁止：`git push`、`git push --force`、`git reset --hard`、`git clean -fd`、`npm publish`。
- 禁止：修改 `~/.ssh`、`~/.npmrc`、shell profile、SSH key、LaunchAgents 之外的全局配置。
- 禁止：读取或写入任何凭证文件。
- 任何 destructive 操作必须先写入 `.goal/blockers.md` 等待用户确认。

## 最终声明

只有「完成条件」全部满足、且当前执行器完成自检（或用户手动确认）无 P0/P1 问题时，
才允许在 `.goal/progress.md` 末尾追加：

```
GOAL_COMPLETED
```

并把 `.goal/state.json.status` 置为 `COMPLETED`。
