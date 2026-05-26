# 白鹿工作流 monorepo

> **版本**：1.0.0
> **寓意**：林深见鹿——在复杂的代码森林中，发现优雅的解决方案

---

## 📦 包列表

| 包名 | 说明 | 安装命令 |
|------|------|----------|
| `@vickzhang/bailu-cli` | 核心 CLI | `npm install -g @vickzhang/bailu-cli` |
| `@vickzhang/bailu-workflow-dev` | 开发工作流（团队） | `npm install -g @vickzhang/bailu-workflow-dev` |
| `@vickzhang/bailu-workflow-ops` | 运营工作流（个人） | `npm install -g @vickzhang/bailu-workflow-ops` |

---

## 🔌 插件系统

白鹿工作流支持插件扩展，可以选择性安装：

| 插件 | 说明 | 安装命令 |
|------|------|----------|
| 🗺️ `@vickzhang/bailu-plugin-graphify` | 知识图谱生成器 | `bailu plugin install graphify` |
| 🔍 `@vickzhang/bailu-plugin-semble` | 语义代码搜索 | `bailu plugin install semble` |
| 🧠 `@vickzhang/bailu-plugin-agentmemory` | 跨会话记忆 | `bailu plugin install agentmemory` |

查看所有可用插件：
```bash
bailu plugin list
```

详细插件文档：[PLUGINS.md](./PLUGINS.md)

---

## 🚀 快速开始

### 团队成员

```bash
# 安装 CLI + 开发工作流
npm install -g @vickzhang/bailu-cli @vickzhang/bailu-workflow-dev

# 初始化
bailu init

# 安装到 AI 工具
bailu tool install

# 可选：安装插件
bailu plugin install graphify
bailu plugin install semble
```

### 个人使用

```bash
# 安装 CLI + 运营工作流
npm install -g @vickzhang/bailu-cli @vickzhang/bailu-workflow-ops

# 初始化
bailu init

# 安装到 AI 工具
bailu tool install
```

---

## 🔄 更新机制

白鹿工作流采用**双轨更新机制**，CLI 工具本身与 AI 工具配置文件的更新方式不同：

| 组件 | 更新方式 | 说明 |
|------|---------|------|
| **CLI 工具本身** | npm 升级 | `npm update -g @vickzhang/bailu-cli` |
| **AI 工具配置**（Skills/Commands/Agents/Rules） | git + 重新部署 | 拉取最新工作流后执行 `bailu install <workflow>` |
| **团队共享配置** | 团队同步 | `bailu sync pull` |

### 为什么要区分？

- **CLI 本体** 是分发给用户的命令行程序，托管在 npm，版本号遵循语义版本控制。升级方式：
  ```bash
  npm update -g @vickzhang/bailu-cli
  ```

- **AI 工具配置**（安装到 `~/.claude/skills/` 等目录的 Skills、Commands、Agents 等文件）来源于工作流包（如 `@vickzhang/bailu-workflow-dev`），通过 `bailu install` 命令部署到 AI 工具。当工作流内容更新时，需重新执行安装命令：
  ```bash
  # 拉取最新工作流（如果是本地开发）
  git pull
  # 重新部署到 AI 工具
  bailu install dev --agent claude
  ```

- **团队共享配置** 通过团队同步功能管理：
  ```bash
  bailu sync pull   # 拉取团队最新配置
  bailu sync push   # 推送本地配置到团队
  ```

---

## 🛠️ 开发

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
# 链接 CLI
cd packages/cli && npm link

# 链接工作流
cd packages/workflow-dev && npm link
cd packages/workflow-ops && npm link
```

### 发布

```bash
# 使用开发环境脚本发布
./dev.sh publish --dry-run  # 预览
./dev.sh publish            # 发布
```

---

## 📁 目录结构

```
bailu-cli/
├── packages/
│   ├── cli/                          # @vickzhang/bailu-cli
│   │   ├── bin/bailu.js              # CLI 入口
│   │   ├── src/
│   │   │   ├── commands/             # 用户命令
│   │   │   ├── dev/                  # 开发命令（不打包）
│   │   │   └── utils/                # 工具函数
│   │   └── package.json
│   │
│   ├── workflow-dev/                 # @vickzhang/bailu-workflow-dev
│   ├── workflow-ops/                 # @vickzhang/bailu-workflow-ops
│   │
│   ├── plugin-graphify/              # @vickzhang/bailu-plugin-graphify
│   └── plugin-semble/                # @vickzhang/bailu-plugin-semble
│
├── dev.sh                            # 开发环境脚本
├── PLUGINS.md                        # 插件文档
└── package.json                      # monorepo 配置
```

---

## 📄 许可证

MIT
