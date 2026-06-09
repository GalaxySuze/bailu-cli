# bailu status

查看当前项目的白鹿安装状态和下一步指引。运行后会读取 `.bailu.yaml`，对照 `manifest.json` 比对实际安装情况。

## 用法

```bash
bailu status [options]
```

## 选项

| 选项 | 说明 |
|------|------|
| `--json` | 以 JSON 格式输出（CI/CD 脚本友好） |

## 输出示例

### 正常状态

```
🦌 白鹿工作流状态

  平台:      claude-code (Claude Code)
  语言:      zh
  范围:      project
  版本:      2.0.0

✓ Skills:    12 / 12
✓ Commands:  4 / 4
✓ Agents:    1 / 1
✓ MCP:       2 个已配置

下一步:
  → 在 Claude Code 中输入 /bailu-sdd-start 开始一个 SDD 需求
  → 或输入 /bailu-dev 进入开发模式
```

### 未初始化

```
🦌 白鹿工作流状态

  ⚠ 未找到 .bailu.yaml，当前项目尚未初始化。

下一步:
  → 运行 bailu init 开始配置
```

### 有缺失组件

```
🦌 白鹿工作流状态

  平台:      claude-code (Claude Code)
  语言:      zh
  范围:      project
  版本:      2.0.0

✓ Skills:    11 / 12  ✗ bailu-goal (缺失)
✓ Commands:  4 / 4
✓ Agents:    1 / 1
✓ MCP:       2 个已配置

下一步:
  → 运行 bailu update 补充缺失组件
```

## JSON 输出

```bash
bailu status --json
```

```json
{
  "platform": "claude-code",
  "language": "zh",
  "scope": "project",
  "version": "2.0.0",
  "skills": { "total": 12, "installed": 12, "missing": [] },
  "commands": { "total": 4, "installed": 4, "missing": [] },
  "agents": { "total": 1, "installed": 1, "missing": [] },
  "mcp": { "configured": 2 },
  "initialized": true
}
```

## 与其他命令的关系

- 初始化 → [`bailu init`](./init)
- 有缺失 → [`bailu update`](./update)
- 环境异常 → [`bailu doctor`](./doctor)
