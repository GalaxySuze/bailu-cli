# 安全边界

无人值守必然涉及较高权限——让 AI 自动改你的代码、跑测试、提交。但权限必须收窄。本页是 Goal 模式的安全约定。

## 权限原则

| 原则 | 体现 |
|------|------|
| 只给项目权限 | runner 的 `WorkingDirectory` 固定为当前项目，AI 不能跨项目改 |
| 不给整个 `~` 权限 | AI 工具自身的权限模型决定，白鹿不破坏 |
| 不读凭证文件 | AI 不会主动读 `.env` / `.ssh` / `~/.npmrc`（除非 `current.md` 显式允许） |
| 不自动发布 | 永不自动 `npm publish` |
| 不自动 push | 永不自动 `git push`（除非 `current.md` 显式允许） |
| 危险命令禁用 | 列表见下 |

## 危险命令禁用清单

以下命令**不得在无人值守模式中自动执行**：

```bash
# 数据销毁
rm -rf ~                    # 删除家目录
rm -rf /                    # 删根目录
git reset --hard            # 重置工作区
git clean -fd               # 删除未追踪文件

# 发布与远程
npm publish                 # 发布到 npm
yarn publish
git push --force            # 强制推送
git push --force-with-lease

# 系统配置
修改 shell profile（.zshrc / .bashrc）
修改 SSH key
修改 ~/.gitconfig（除非范围明确）
修改 LaunchAgents（除了 com.bailu.goal-runner 自身）

# 凭证
读 .env / .env.local / .env.production
读 ~/.aws/credentials
读 ~/.npmrc 中的 token
```

这些限制由两层保证：

1. **AI 工具层**：Claude / Codex 本身的权限模型不允许执行某些命令
2. **bailu-goal Skill 层**：Skill 文件明确写"不允许执行 X"，AI 在每轮决策时会自检

如果你的 `.goal/current.md` 的"范围"里明确写了"允许 git push to origin/feature-x"，AI 才会执行。**默认全禁**。

## Git 工作区保护

每轮开始前 runner 和 AI 都会检查：

```bash
git status --short
```

判断逻辑：

| 发现 | 行为 |
|------|------|
| 工作区干净 | 继续 |
| 有变更，与当前 Goal 相关 | 继续，记录到 progress |
| 有变更，与当前 Goal 无关 | **暂停**，写 `BLOCKED` |
| 无法判断关联 | **暂停**，等待用户 |

这确保 AI 不会把你的未提交改动卷进 Goal。

## 锁文件保护

`~/.bailu-goal/goal-runner.lock` 防止 runner 并发：

- runner 启动时获取锁
- 进程退出前释放锁
- 如果锁存在但进程不存在（崩溃残留），下次启动会自动清理
- launchd 唤醒时如果锁还在，跳过本次

人工 `bailu goal run` 也走同样的锁，所以**手动跑和自动跑不会撞车**。

## 超时控制

```
单次执行超时 = 1500 秒（25 分钟）
```

超时后：
- AI 进程被 kill
- 锁文件被释放
- 工作区可能处于中间状态——下次唤醒时 AI 会读 git status 决定如何收尾

## 通知机制

以下事件会触发 Mac 通知：

| 事件 | 通知文案 |
|------|----------|
| 目标完成 | "白鹿 Goal 已完成 🎉" |
| 被阻塞 | "白鹿 Goal 已暂停：&lt;原因&gt;" |
| 自动化失败 | "白鹿 Goal 失败需介入" |
| Claude CLI 不可用 | "白鹿 Goal：Claude 不可用" |

通知通过 `osascript` 调用 macOS Notification Center。

## 推荐安全实践

### 1. 范围尽量小

```markdown
# .goal/current.md

## 范围
- 允许修改 packages/cli/src/v2/commands/reset.js
- 允许修改 packages/cli/test/v2/commands/reset.test.js
- ❌ 不允许修改其他命令的代码
- ❌ 不允许修改 package.json
```

范围越窄，意外越少。

### 2. 完成条件要客观

```markdown
## 完成条件
- ✓ npm test 通过
- ✓ reset.js 覆盖率 ≥ 80%
- ✗ "感觉差不多"
- ✗ "应该 OK 了"
```

主观条件 AI 会自我满足，客观条件 AI 跑不过就停。

### 3. 中止条件要主动

```markdown
## 中止条件
- 连续 3 次同一测试失败 → 主动停
- 出现非本 Goal 的变更 → 主动停
- 需要决策超过 3 个产品取舍 → 主动停
```

让 AI 知道**什么时候应该认怂**比让它"再试一次"重要。

### 4. 项目先 commit

启动 Goal 之前，把当前的所有修改 commit：

```bash
git add -A
git commit -m "wip: 启动 Goal 前的基线"

# 然后启动 Goal
bailu goal install-launchd
```

这样万一 AI 改坏了，一条 `git reset --hard HEAD~N` 就能回滚。

### 5. 定期看 progress

不要装完 launchd 就不管。每天至少看一次：

```bash
bailu goal status
tail -100 .goal/progress.md
git log --oneline -20
```

发现方向不对，立刻 `bailu goal stop`。

## 出问题怎么办

### AI 改坏了代码

```bash
# 1. 立刻暂停
bailu goal stop --reason "改坏了，回滚"

# 2. 卸载 launchd
bailu goal uninstall-launchd

# 3. 看改了什么
git status
git diff
git log --oneline -20

# 4. 回滚
git reset --hard <安全的提交 hash>
# 或选择性回滚
git checkout <文件路径>
```

### AI 卡住不动

```bash
# 1. 看日志
bailu goal logs -n 100

# 2. 看 state.json 是不是 stuck 在 RUNNING
cat .goal/state.json

# 3. 强制释放锁
rm ~/.bailu-goal/goal-runner.lock

# 4. 把 state.json 改回 RUNNABLE
```

### Claude/Codex 配额用完

state.json 会被设为 `TOKEN_LOW`，runner 下次唤醒会跳过。等配额恢复后手动改回 RUNNABLE 或跑：

```bash
bailu goal run
```

## 下一步

- [常见问题](./faq)
- [bailu goal install-launchd 命令](/commands/goal-install-launchd)
