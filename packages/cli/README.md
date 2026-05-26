# @vickzhang/bailu-cli

白鹿工作流 CLI - 林深见鹿，优雅前行

## 安装

```bash
npm install -g @vickzhang/bailu-cli
```

## 使用

```bash
# 初始化
bailu init

# 查看状态
bailu status

# 工作流管理
bailu workflow list
bailu workflow install dev

# 工具管理
bailu tool install
```

## 命令列表

| 命令 | 说明 |
|------|------|
| `bailu init` | 初始化配置中心 |
| `bailu status` | 查看状态 |
| `bailu workflow list` | 列出可用工作流 |
| `bailu workflow install <name>` | 安装工作流 |
| `bailu workflow uninstall <name>` | 卸载工作流 |
| `bailu tool install [tools...]` | 安装到AI工具 |
| `bailu tool uninstall [tools...]` | 从AI工具卸载 |
| `bailu config` | 打开配置目录 |

## 支持的工具

- Claude Code
- Codex
- Qoder
- Trae
- Hermes
- Openclaw
- Cursor
- Windsurf

## 跨平台支持

- ✅ macOS
- ✅ Windows
- ✅ Linux

## 许可证

MIT
