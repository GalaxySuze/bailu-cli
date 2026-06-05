# 命令参考

白鹿工作流 CLI 提供了丰富的命令来管理你的 AI 工具配置。

## 命令概览

| 命令 | 说明 |
|------|------|
| [`bailu`](/api/) | 显示 TUI 仪表盘 |
| [`bailu init`](/api/init) | 初始化配置 |
| [`bailu workflow`](/api/workflow) | 工作流管理 |
| [`bailu tool`](/api/tool) | AI 工具管理 |
| [`bailu mcp`](/api/mcp) | MCP 服务管理 |
| [`bailu sync`](/api/sync) | 团队同步 |
| [`bailu status`](/api/status) | 查看状态 |
| [`bailu serve`](/api/serve) | 启动 WebUI |
| [`bailu recommend`](/api/recommend) | AI 工具推荐 |
| [`bailu audit`](/api/audit) | 安全审计 |

## 全局选项

| 选项 | 说明 |
|------|------|
| `-V, --version` | 显示版本号 |
| `-h, --help` | 显示帮助信息 |

## 配置目录

白鹿工作流的配置存储在 `~/.bailu/` 目录下：

```
~/.bailu/
├── config/
│   ├── base.yaml           # 基础配置
│   └── workflows/          # 工作流配置
│       ├── dev-workflow.yaml
│       └── ops-workflow.yaml
├── projects.json           # 项目配置
└── publish.json            # 发布配置
```
