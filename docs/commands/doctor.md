# bailu doctor

环境诊断。检查 Node.js、平台、Git 仓库等关键依赖。

## 用法

```bash
bailu doctor [options]
```

## 选项

| 选项 | 说明 |
|------|------|
| `--json` | 以 JSON 格式输出 |

## 检查项

| 检查项 | 类型 | 说明 |
|--------|------|------|
| Node.js | required | 必须 18.0.0+ |
| npm | required | 通常随 Node 安装 |
| Claude Code | optional | 检测 `~/.claude/` 或 `claude --version` |
| Qoder | optional | 检测 `~/.qoder/` 或 `qoder --version` |
| Codex | optional | 检测 `~/.codex/` 或 `codex --version` |
| Git 仓库 | optional | 当前目录是否为 git 仓库 |
| `.bailu.yaml` | optional | 项目是否已初始化 |

## 输出示例

### 全绿

```
🩺 白鹿环境诊断

✓ Node.js          v20.18.0  (>= 18.0.0)
✓ npm              10.9.0
✓ Claude Code      已检测到 (~/.claude/)
○ Qoder            未安装 (optional)
○ Codex            未安装 (optional)
✓ Git 仓库         是
✓ .bailu.yaml      已初始化 (v2.0.0)

  环境正常，可以使用白鹿。
```

### 有问题

```
🩺 白鹿环境诊断

✗ Node.js          v16.20.0  (要求 >= 18.0.0)  ← 关键问题
✓ npm              8.19.4
○ Claude Code      未安装 (optional)
○ Qoder            未安装 (optional)

  ⚠ 至少有一个 required 检查项失败：
    → 请升级 Node.js 到 18.0.0 或更高版本：nvm install 20

  ⚠ 未检测到任何 AI 工具，bailu init 无法选择目标平台：
    → 安装 Claude Code 或 Qoder 后再试
```

## required vs optional

- **required** 失败 → 白鹿无法正常工作，必须修复
- **optional** 失败 → 不影响白鹿本身，但可能影响某些场景（比如没装任何 AI 工具就无法 `bailu init`）

## JSON 输出

```bash
bailu doctor --json
```

```json
{
  "node": { "version": "v20.18.0", "ok": true, "required": "18.0.0" },
  "npm": { "version": "10.9.0", "ok": true },
  "platforms": {
    "claude-code": { "installed": true, "optional": true, "path": "/Users/kangkang/.claude" },
    "qoder": { "installed": false, "optional": true },
    "codex": { "installed": false, "optional": true }
  },
  "git": { "isRepo": true, "optional": true },
  "bailuYaml": { "exists": true, "version": "2.0.0", "optional": true },
  "ok": true
}
```

## 常见诊断

### Node 版本太低

```bash
nvm install 20
nvm use 20
node --version  # 应输出 v20.x.x
```

### 没装任何 AI 工具

至少装一个：
- Claude Code: [https://claude.ai/code](https://claude.ai/code)
- Qoder: 官网下载

### 项目未初始化 .bailu.yaml

```bash
bailu init
```

## 与其他命令的关系

- 诊断完毕环境正常 → [`bailu init`](./init)
- 诊断发现项目未初始化 → [`bailu init`](./init)
- 想看已安装组件 → [`bailu status`](./status)
