# @vickzhang/bailu-cli

白鹿工作流 CLI — 林深见鹿，优雅前行

一个命令初始化 AI 辅助研发工作流，让 Claude Code / Qoder 拥有完整的 SDD（Specification-Driven Development）能力。

## 快速开始

```bash
# 全局安装
npm install -g @vickzhang/bailu-cli

# 在项目目录初始化（唯一需要记住的命令）
cd your-project
bailu init
```

`bailu init` 会自动检测环境、选择平台、部署 Skills，全程交互式引导。

## 命令

| 命令 | 说明 |
|------|------|
| `bailu init` | 交互式初始化白鹿工作流 |
| `bailu status` | 查看当前状态和下一步指引 |
| `bailu update` | 更新工作流到最新版本 |
| `bailu doctor` | 环境诊断，检查依赖和配置 |
| `bailu reset` | 重置配置，清除已安装的工作流 |

常用参数：

- `--yes`：跳过交互确认，使用默认值
- `--json`：以 JSON 格式输出（CI/CD 友好）
- `--scope project|global`：安装范围（默认 project）

## 初始化后

在 Claude Code 或 Qoder 中使用 Slash 命令启动 SDD 研发流程：

```
/bailu-sdd-start
```

SDD 流程包含 7 个阶段：需求规划 → 技术设计 → 技术评审 → 编码实现 → 代码审查 → 测试收尾 → 发布部署。

## 支持的平台

| 平台 | 状态 |
|------|------|
| Claude Code | ✅ 完整支持 |
| Qoder | 🚧 规划中 |
| Codex | 🚧 规划中 |

## 系统要求

- Node.js >= 18.0.0
- Git（建议，用于版本追溯）

## 跨平台支持

- ✅ macOS
- ✅ Windows
- ✅ Linux

## 许可证

MIT
