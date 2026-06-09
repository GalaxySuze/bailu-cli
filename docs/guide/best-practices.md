# 最佳实践

## 场景一：新项目第一次接入

### 情景

刚接手一个新的 Node / Python / Go / PHP 项目，想快速搭建 AI 辅助开发环境。

### 操作

```bash
# 1. 进入项目
cd new-project

# 2. 装白鹿（如未装）
npm install -g @vickzhang/bailu-cli

# 3. 初始化（推荐 project 范围）
bailu init

# 4. 让 AI 自己写一份 CLAUDE.md
# 打开 Claude Code，输入：
/bailu-init

# 5. 第一个 SDD 需求
/bailu-sdd-start
```

### 检查清单

```bash
bailu doctor      # 环境正常？
bailu status      # Skills/Commands/Agent 全装？
ls .claude/       # 项目级目录建立？
```

## 场景二：已有项目接入

### 情景

项目已经用了一段时间，可能本身就有 `.claude/` 或其他白鹿之前的残留。

### 操作

```bash
# 1. 跑 init，它会自动检测旧版残留
bailu init
# 遇到冲突选 "备份后覆盖"
# 这会把现有文件备份到 .bailu-backup/ 然后覆盖

# 2. 检查备份没漏什么
ls .bailu-backup/

# 3. 验证新装
bailu status
```

### 如果想保留某个旧 Skill

跑 init 之前手动复制到非 `bailu-` 前缀的位置：

```bash
cp -r .claude/skills/my-custom-skill ~/save/
# 跑 bailu init
# 装完后再复制回来
cp -r ~/save/my-custom-skill .claude/skills/
```

## 场景三：用 SDD 推进一个中等需求

### 情景

需求："给订单列表加 Excel 导出功能"，涉及前后端，3-5 天工作量。

### 操作

打开 Claude Code，依次进行：

```
你：/bailu-sdd-start

Claude：欢迎使用白鹿 SDD 流程。请提供需求信息...

你：PROJ-12345 订单列表 Excel 导出
   - 入口：订单列表页右上角按钮
   - 后端：导出当前筛选条件下所有订单
   - 字段：订单号、客户、金额、下单时间、状态
   - 单次最多 10000 条，超出提示分批

Claude：...（D1 任务评估，建议中等需求，标准模式 D1→D2→D3→D4→D5→D6）

你：同意

Claude：（D2 技术方案，11 项模块逐项展开...）

你：方案 OK，继续

Claude：（D3 AI 自检 7 维度...）

你：继续

Claude：（D4 编码，每完成关键节点会暂停询问...）

...
```

中途随时可以 `/bailu-sdd-start` 看进度。`.sdd/sdd-context.md` 会持久化所有状态。

## 场景四：用 Goal 无人值守跑长链路任务

### 情景

任务："为现有 12 个 v1 命令补全单元测试，覆盖率每个 ≥ 80%"，预计需要几十轮。

### 操作

```bash
# 1. 准备
cd your-project
git checkout -b test-coverage
git add -A && git commit -m "wip: 启动 Goal 前基线" --allow-empty

# 2. 初始化 Goal
bailu goal init

# 3. 编辑 .goal/current.md
cat > .goal/current.md <<'EOF'
# Goal: 补全 v1 命令单元测试，覆盖率每个 ≥ 80%

## 目标

为 src/v1/commands/ 下的 12 个命令补全单元测试。

## 范围

- 允许修改 test/v1/commands/ 下任意测试文件
- 允许修改 src/v1/commands/ 下文件（仅测试发现的 bug）
- 不允许修改 package.json 依赖
- 不允许改非 v1 的代码

## 完成条件

- 12 个命令每个都有 ≥ 8 个测试用例
- nyc/c8 报告中，每个命令覆盖率 ≥ 80%
- npm test 全部通过

## 每轮规则

- 每轮只处理 1 个命令
- 修改前在 progress.md 记录计划
- 每完成一个命令跑覆盖率验证
- 失败不允许跳过

## 中止条件

- 连续 3 次同一测试失败
- 工作区有非本 Goal 变更
- npm 配额不足

## 最终声明

满足所有完成条件后写入 GOAL_COMPLETED。
EOF

# 4. 试运行一轮
bailu goal run

# 5. 满意后装 launchd
bailu goal install-launchd --interval 1800

# 6. 喝咖啡，看通知
```

详细参见 [Goal 快速上手](/goal/quick-start)。

## 场景五：升级白鹿到新版本

### 情景

`@vickzhang/bailu-cli` 发布了新版本，想升级所有项目。

### 操作

```bash
# 1. 升级 npm 包
npm install -g @vickzhang/bailu-cli@latest

# 2. 在每个项目跑 update
for proj in proj-a proj-b proj-c; do
  cd ~/Code/$proj
  bailu update --yes
done

# 3. 验证
bailu --version
bailu status   # 在某个项目里
```

## 场景六：彻底卸载白鹿

```bash
# 1. 每个项目内 reset
for proj in proj-a proj-b proj-c; do
  cd ~/Code/$proj
  bailu reset --confirm
done

# 2. 卸载 launchd（如果用了 Goal）
bailu goal uninstall-launchd

# 3. 卸载 npm 包
npm uninstall -g @vickzhang/bailu-cli

# 4. 清理 ~/.bailu-goal/（如果用过 Goal）
rm -rf ~/.bailu-goal
```

## 设计原则与建议

### 1. 永远 project scope，不要 global

`bailu init --scope project`（默认）。**不推荐** global，原因：

- 多项目隔离
- 升级一个项目不影响另一个
- git 跟随项目走

### 2. CLAUDE.md / QODER.md 必须人工写

`bailu init` 不会自动生成。运行 `/bailu-init` slash 命令让 AI 起草，然后**人工 review 修改**。这是团队 AI 协作的基石。

### 3. SDD 优先，Goal 兜底

日常开发用 SDD（人工节奏推进）。需要长跑、无人值守、机械重复的任务用 Goal。

### 4. 不要手改 bailu-* Skills

会被 `bailu update` 覆盖。要改就 fork 出来去掉 `bailu-` 前缀作为你自己的 Skill。

### 5. 定期 doctor

```bash
bailu doctor
```

Node 升级、AI 工具升级、迁移机器后跑一下，比出问题再排查省时间。

## 下一步

- [常见问题](./faq)
- [Goal 无人值守](/goal/)
