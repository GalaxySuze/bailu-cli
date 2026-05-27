# bailu audit

安全审计。

## 用法

```bash
bailu audit [options]
```

## 选项

| 选项 | 说明 |
|------|------|
| `-f, --fix` | 自动修复问题 |
| `-j, --json` | JSON 格式输出 |

## 示例

```bash
# 运行审计
bailu audit

# 自动修复
bailu audit --fix

# JSON 格式输出
bailu audit --json
```

## 审计内容

- Skills 安全检查
- Commands 安全检查
- Agents 安全检查
- Rules 安全检查
- Hooks 安全检查
