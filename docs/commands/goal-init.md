# bailu goal init

在当前项目根目录创建 `.goal/` 骨架，为无人值守任务准备契约。

## 用法

```bash
bailu goal init [options]
```

## 选项

| 选项 | 说明 |
|------|------|
| `--force` | 覆盖现有 `.goal/` 文件（默认不覆盖） |
| `--yes` | 跳过所有确认 |

## 创建内容

执行后会创建：

```
.goal/
├── current.md         ← 目标契约（你必须手工填）
├── state.json         ← 机器可读状态
├── progress.md        ← 人类可读进度
├── blockers.md        ← 阻塞清单
├── verification.log   ← 验证记录
├── handoff.md         ← 交接摘要
└── snapshots/         ← 关键 diff / 截图等快照
```

## 第一步：编辑 current.md

`bailu goal init` 只生成模板，你必须打开 `.goal/current.md` 把目标和完成条件**写清楚**：

```markdown
# Goal: 你的目标标题

## 目标
（一句话说清要做什么）

## 范围
- 允许修改 ...
- 不允许修改 ...

## 完成条件
- npm test 通过
- ... 其他客观、可验证的条件

## 中止条件
- 遇到需要用户决策的产品取舍
- 连续 3 次同一测试失败
- ...

## 每轮执行规则
- 每轮只选择 1-3 个最小原子任务
- 修改代码前先记录计划到 progress.md
- ...
```

模板里已经写好了一份示例。详细解读参见 [.goal/ 目录契约](/goal/file-contract)。

## 示例

### 全新初始化

```bash
cd my-project
bailu goal init
```

### 已有 .goal/ 强制覆盖

```bash
bailu goal init --force --yes
```

⚠️ `--force` 会覆盖 `current.md`，会丢失你已经写的目标。建议先备份。

## 下一步

- 编辑 `.goal/current.md` 填入真实目标
- 用 [`bailu goal run`](./goal-run) 手动跑一轮试试
- 满意后用 [`bailu goal install-launchd`](./goal-install-launchd) 进入无人值守

## 与其他命令的关系

- 查看当前状态 → [`bailu goal status`](./goal-status)
- 跑一轮 → [`bailu goal run`](./goal-run)
- 进入无人值守 → [`bailu goal install-launchd`](./goal-install-launchd)
