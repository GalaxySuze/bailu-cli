# bailu workflow

管理工作流。

## 子命令

### list

查看工作流列表。

```bash
bailu workflow list [options]
```

| 选项 | 说明 |
|------|------|
| `-a, --all` | 显示所有可用工作流 |

### install

安装工作流。

```bash
bailu workflow install <name> [options]
```

| 选项 | 说明 |
|------|------|
| `-a, --agent <agent>` | 指定 AI 工具 |
| `-s, --source <path>` | 指定本地源路径 |
| `--dry-run` | 预览安装内容 |

### uninstall

卸载工作流。

```bash
bailu workflow uninstall <name> [options]
```

| 选项 | 说明 |
|------|------|
| `--clean` | 跳过确认 |

## 示例

```bash
# 查看已安装工作流
bailu workflow list

# 安装开发工作流
bailu workflow install dev

# 卸载工作流
bailu workflow uninstall dev
```
