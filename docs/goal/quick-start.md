# 快速上手

5 分钟跑通第一个 Goal。

## 前提

- 已经 `npm install -g @vickzhang/bailu-cli`（≥ 2.0.0）
- Mac（launchd 是 macOS 特性）
- 已装 Claude Code（`claude --version` 可用）
- 想推进的项目已经 git init

## 第一步：初始化 .goal/

```bash
cd your-project
bailu goal init
```

输出：

```
🎯 创建 .goal/ 骨架...

  ✓ .goal/current.md           ← 待编辑（最重要）
  ✓ .goal/state.json
  ✓ .goal/progress.md
  ✓ .goal/blockers.md
  ✓ .goal/verification.log
  ✓ .goal/handoff.md
  ✓ .goal/snapshots/

下一步：
  → 编辑 .goal/current.md 填入目标和完成条件
  → 运行 bailu goal run 试运行一轮
```

## 第二步：编辑 current.md

打开 `.goal/current.md`，把模板替换成你的真实目标。**这是 AI 执行的最高依据**，必须写清楚。

最简模板：

```markdown
# Goal: 把 reset 命令补全单元测试

## 目标

为 `bailu reset` 命令补充单元测试，确保覆盖率 ≥ 80%。

## 范围

- 允许修改 packages/cli/test/v2/commands/reset.test.js
- 允许修改 packages/cli/src/v2/commands/reset.js（仅测试发现的 bug）
- 不允许修改其他命令的代码
- 不允许修改 package.json 的依赖

## 完成条件

- 新增至少 8 个测试用例
- npm test 全部通过
- reset.js 覆盖率 ≥ 80%（用 nyc 或 c8 报告）

## 中止条件

- 测试发现 reset.js 有需要重设计的 bug（写入 blockers.md）
- 连续 3 次同一测试失败

## 每轮执行规则

- 每轮只选 1-3 个最小原子任务
- 修改代码前在 progress.md 记录本轮计划
- 每完成一个任务跑 `npm test -- --testPathPattern=reset` 验证
- 失败不允许跳过

## 最终声明

所有完成条件满足后，写入 `GOAL_COMPLETED`。
```

详细写法参见 [.goal/ 目录契约](./file-contract)。

## 第三步：试运行一轮

```bash
bailu goal run
```

这会**前台调用** runner，能看到 Claude 的实时输出。看完后检查：

```bash
# 看 Claude 干了什么
cat .goal/progress.md

# 看状态
bailu goal status

# 看 git 改了什么
git status
git diff
```

如果觉得方向对、产物合理，进入第四步。如果有问题，回到第二步调整 `current.md`。

## 第四步：进入无人值守

确认试运行 OK 后，安装 launchd 守护：

```bash
bailu goal install-launchd --interval 1800
```

会有风险确认，输入 `y` 安装。然后：

- 每 30 分钟 launchd 会唤醒 runner
- runner 读 `state.json` 决策
- 状态是 `RUNNABLE` → 调用 Claude 推进一轮
- 状态是 `COMPLETED` / `BLOCKED` → 通知你并停下

## 第五步：监控

随时查看状态：

```bash
bailu goal status        # 状态汇总
bailu goal logs -f       # 实时跟随 runner 日志
tail -f .goal/progress.md # 实时看 AI 做了什么
```

## 第六步：完成

当目标达成，Claude 会写 `GOAL_COMPLETED` 到 `progress.md` 并把 `state.json.status` 设为 `COMPLETED`。

下一次 launchd 唤醒时 runner 看到 COMPLETED，会发 Mac 通知"白鹿 Goal 已完成 🎉"。

收尾：

```bash
# 1. 卸载 launchd 守护
bailu goal uninstall-launchd

# 2. review 代码
git diff
git log

# 3. 满意后 commit
git add -A
git commit -m "feat: reset 命令补全单元测试 (由 Goal 自动推进)"

# 4. （可选）清理 .goal/ 目录
rm -rf .goal
```

## 全流程小结

```
bailu goal init                    ← 创建骨架
编辑 .goal/current.md              ← 写目标
bailu goal run                     ← 试运行
bailu goal install-launchd         ← 进入无人值守
（每 30 分钟自动推进）
bailu goal status / logs            ← 监控
完成后通知
bailu goal uninstall-launchd       ← 卸载
git commit                          ← 收尾
```

## 紧急停止

如果发现 AI 在乱搞：

```bash
# 软暂停（保留 launchd，下次唤醒跳过）
bailu goal stop --reason "方向不对，明天再说"

# 硬停止（卸载 launchd）
bailu goal uninstall-launchd

# 看看改了什么
git status
git diff

# 不想要 → 回滚
git checkout .
```

## 下一步

- [.goal/ 目录契约](./file-contract)：详解每个文件的写法
- [状态机详解](./state-machine)：理解 10 种状态
- [安全边界](./safety)：什么不会被 AI 自动做
- [常见问题](./faq)
