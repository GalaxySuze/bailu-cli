# 工作流管理

白鹿工作流将 AI 工具的配置打包为可复用的工作流，方便安装和分享。

## 工作流类型

| 工作流 | 说明 |
|--------|------|
| `dev` | 开发工作流，包含代码开发相关的组件 |
| `ops` | 运营工作流，包含内容创作相关的组件 |

## 查看工作流

```bash
# 查看已安装的工作流
bailu workflow list

# 查看所有可用工作流
bailu workflow list --all
```

## 安装工作流

```bash
# 安装开发工作流到 Claude Code
bailu workflow install dev

# 安装到指定工具
bailu workflow install dev --agent hanako

# 预览安装内容
bailu workflow install dev --dry-run
```

## 卸载工作流

```bash
# 卸载开发工作流
bailu workflow uninstall dev

# 跳过确认直接卸载
bailu workflow uninstall dev --clean
```

## 工作流组件

每个工作流包含以下组件：

| 组件类型 | 说明 |
|----------|------|
| Skills | AI 技能，定义 AI 的能力 |
| Commands | 命令，扩展 CLI 功能 |
| Agents | 代理，定义 AI 角色 |
| Rules | 规则，约束 AI 行为 |
| Hooks | 钩子，自动化操作 |

## 配置文件

工作流配置存储在 `~/.bailu/config/workflows/` 目录：

```
~/.bailu/config/workflows/
├── dev-workflow.yaml
└── ops-workflow.yaml
```

## 自定义工作流

可以创建自定义工作流配置文件，参考现有配置格式。
