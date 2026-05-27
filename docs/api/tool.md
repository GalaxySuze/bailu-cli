# bailu tool

管理 AI 工具配置。

## 子命令

### status

查看工具状态。

```bash
bailu tool status [tool]
```

### install

安装工具配置。

```bash
bailu tool install <tool>
```

### uninstall

卸载工具配置。

```bash
bailu tool uninstall <tool>
```

## 示例

```bash
# 查看所有工具状态
bailu tool status

# 安装 Claude Code 配置
bailu tool install claude

# 卸载工具配置
bailu tool uninstall claude
```
