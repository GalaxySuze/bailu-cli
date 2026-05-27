# bailu status

查看系统状态。

## 用法

```bash
bailu status [options]
```

## 选项

| 选项 | 说明 |
|------|------|
| `-j, --json` | JSON 格式输出 |

## 示例

```bash
# 查看状态
bailu status

# JSON 格式输出
bailu status --json
```

## 输出内容

- 系统信息（操作系统、Node.js 版本）
- CLI 版本
- 已安装工作流
- 组件统计
- 已配置工具
