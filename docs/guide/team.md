# 团队协作

白鹿工作流支持基于 Git 的团队配置同步机制，保持团队 AI 工具配置统一。

## 工作原理

```
┌─────────────────────────────────────────────────────────────┐
│                    Git 仓库                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  bailu-config/                                      │   │
│  │  ├── config/                                        │   │
│  │  │   ├── base.yaml                                  │   │
│  │  │   └── workflows/                                 │   │
│  │  │       ├── dev-workflow.yaml                      │   │
│  │  │       └── ops-workflow.yaml                      │   │
│  │  └── projects.json                                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         ↑                    ↓                    ↑
         │ push               │ pull               │ pull
         │                    │                    │
    ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
    │ 成员 A  │          │ 成员 B  │          │ 成员 C  │
    └─────────┘          └─────────┘          └─────────┘
```

## 使用步骤

### 第一步：初始化配置

```bash
# 在团队 Git 仓库中初始化
bailu init
```

### 第二步：推送配置

```bash
# 将本地配置推送到 Git 仓库
bailu sync push
```

### 第三步：拉取配置

```bash
# 从 Git 仓库拉取最新配置
bailu sync pull
```

## 同步内容

| 内容 | 说明 |
|------|------|
| 工作流配置 | `~/.bailu/config/workflows/` |
| 基础配置 | `~/.bailu/config/base.yaml` |
| 项目配置 | `~/.bailu/projects.json` |

## 最佳实践

### 1. 使用专用仓库

建议为团队配置创建专用的 Git 仓库：

```bash
git clone git@github.com:your-team/bailu-config.git
cd bailu-config
bailu init
```

### 2. 定期同步

建议团队成员定期同步配置：

```bash
# 每天开始工作前
bailu sync pull

# 修改配置后
bailu sync push
```

### 3. 使用分支管理

对于重要的配置变更，建议使用分支管理：

```bash
git checkout -b feature/new-workflow
# 修改配置
bailu sync push
# 创建 Pull Request
```

## 冲突处理

如果同步时出现冲突，需要手动解决：

```bash
# 拉取时出现冲突
bailu sync pull
# 错误：配置文件存在冲突

# 手动解决冲突后
git add .
git commit -m "resolve: 配置冲突"
bailu sync push
```
