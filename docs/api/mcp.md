# bailu mcp

管理 MCP（Model Context Protocol）服务。

## 子命令

### list

查看 MCP 服务列表。

```bash
bailu mcp list
```

### add

添加 MCP 服务。

```bash
bailu mcp add <name> <url>
```

### remove

删除 MCP 服务。

```bash
bailu mcp remove <name>
```

### enable

启用 MCP 服务。

```bash
bailu mcp enable <name>
```

### disable

禁用 MCP 服务。

```bash
bailu mcp disable <name>
```

## 示例

```bash
# 查看 MCP 服务
bailu mcp list

# 添加 MCP 服务
bailu mcp add github https://mcp.github.com

# 删除 MCP 服务
bailu mcp remove github
```
