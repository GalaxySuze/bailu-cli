# bailu plugin

插件管理。

## 子命令

### list

查看插件列表。

```bash
bailu plugin list
```

### install

安装插件。

```bash
bailu plugin install <name>
```

### uninstall

卸载插件。

```bash
bailu plugin uninstall <name>
```

## 示例

```bash
# 查看插件
bailu plugin list

# 安装插件
bailu plugin install graphify

# 卸载插件
bailu plugin uninstall graphify
```

## 可用插件

| 插件 | 说明 |
|------|------|
| graphify | 知识图谱生成器 |
| semble | 语义代码搜索 |
| agentmemory | Agent 记忆管理 |
| ppt-skill | PPT 生成器 |
| agency | 多 Agent 编排 |
