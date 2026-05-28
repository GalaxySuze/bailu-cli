# 分发架构

白鹿工作流采用 **npm + GitHub** 双轨分发架构，各司其职。

## 架构概览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         分发架构                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  npm 包：@vickzhang/bailu-cli                                          │
│  ├── CLI 工具（bailu 命令）                                             │
│  ├── 安装引擎                                                           │
│  ├── WebUI 管理界面                                                     │
│  └── 插件系统                                                           │
│                                                                         │
│  安装方式：npm install -g @vickzhang/bailu-cli                         │
│  更新方式：npm update -g @vickzhang/bailu-cli                          │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  GitHub 仓库：github.com/vickzhang/bailu-cli                           │
│  ├── docs/                    # VitePress 文档站点                      │
│  ├── packages/cli/            # CLI 源码                                │
│  ├── packages/workflow-dev/   # 开发工作流包                            │
│  ├── packages/workflow-ops/   # 运营工作流包                            │
│  ├── packages/plugin-*/       # 插件包                                  │
│  └── .github/workflows/       # CI/CD 配置                              │
│                                                                         │
│  用途：源码管理、版本控制、文档托管、Issue 追踪                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## npm 包

### 包信息

| 属性 | 值 |
|------|-----|
| 包名 | `@vickzhang/bailu-cli` |
| 版本 | 1.1.0 |
| 许可证 | MIT |
| 入口 | `bin/bailu.js` |

### 包含内容

```
@vickzhang/bailu-cli
├── bin/bailu.js              # CLI 入口
├── src/
│   ├── commands/             # 命令实现
│   │   ├── init.js           # bailu init
│   │   ├── workflow.js       # bailu workflow
│   │   ├── tool.js           # bailu tool
│   │   ├── mcp.js            # bailu mcp
│   │   ├── sync.js           # bailu sync
│   │   ├── serve.js          # bailu serve
│   │   ├── recommend.js      # bailu recommend
│   │   ├── audit.js          # bailu audit
│   │   ├── plugin.js         # bailu plugin
│   │   └── docs.js           # bailu docs
│   ├── webui/                # WebUI 源码
│   │   ├── server/           # Express 服务器
│   │   └── client/           # 前端页面
│   └── dev/                  # 开发者工具（不发布）
└── package.json
```

### 安装方式

```bash
# 全局安装
npm install -g @vickzhang/bailu-cli

# 验证安装
bailu -v

# 更新到最新版本
npm update -g @vickzhang/bailu-cli
```

### npm 职责

npm 包负责：

1. **CLI 工具分发**
   - 提供 `bailu` 命令
   - 跨平台支持（macOS、Windows、Linux）
   - 版本管理和更新

2. **安装引擎**
   - 解析工作流清单
   - 复制组件到 AI 工具目录
   - 记录安装状态

3. **WebUI 管理界面**
   - Express.js 后端
   - 单页应用前端
   - REST API 接口

4. **插件系统**
   - 插件安装和卸载
   - 插件依赖管理
   - 插件生命周期管理

---

## GitHub 仓库

### 仓库结构

```
bailu-cli/
├── .github/
│   └── workflows/
│       └── docs.yml          # 文档自动部署
├── docs/                     # VitePress 文档源码
│   ├── .vitepress/
│   │   ├── config.js         # VitePress 配置
│   │   └── theme/            # 自定义主题
│   ├── index.md              # 首页
│   ├── guide/                # 指南
│   └── api/                  # API 参考
├── packages/
│   ├── cli/                  # CLI 包
│   ├── workflow-dev/         # 开发工作流包
│   ├── workflow-ops/         # 运营工作流包
│   ├── plugin-graphify/      # Graphify 插件
│   ├── plugin-semble/        # Semble 插件
│   ├── plugin-agentmemory/   # AgentMemory 插件
│   ├── plugin-ppt-skill/     # PPT 插件
│   └── plugin-agency/        # Agency 插件
├── package.json              # 根 package.json（monorepo）
└── README.md
```

### GitHub 职责

GitHub 仓库负责：

1. **源码管理**
   - 版本控制（Git）
   - 代码审查（PR）
   - 分支管理

2. **文档托管**
   - VitePress 文档站点
   - GitHub Pages 自动部署
   - 访问地址：`https://vickzhang.github.io/bailu-cli/`

3. **Issue 追踪**
   - Bug 报告
   - 功能请求
   - 讨论交流

4. **CI/CD**
   - GitHub Actions 自动构建
   - 文档自动部署
   - npm 自动发布（计划中）

---

## 职责对比

| 职责 | npm | GitHub |
|------|-----|--------|
| CLI 工具分发 | ✅ 主要 | ❌ 不负责 |
| 源码管理 | ❌ 不负责 | ✅ 主要 |
| 版本发布 | ✅ npm publish | ✅ Git tag |
| 文档托管 | ❌ 不负责 | ✅ GitHub Pages |
| Issue 追踪 | ❌ 不负责 | ✅ GitHub Issues |
| 团队协作 | ❌ 不负责 | ✅ Git 协作 |
| 自动更新 | ✅ npm update | ❌ 手动 git pull |
| 跨平台支持 | ✅ npm 自动处理 | ❌ 需要手动 |

---

## 版本管理

### npm 版本

npm 包使用语义化版本（SemVer）：

```
1.1.0
│ │ │
│ │ └── Patch: 修复 bug
│ └──── Minor: 新增功能
└────── Major: 重大变更
```

**查看版本**：
```bash
bailu -v
```

**更新版本**：
```bash
npm update -g @vickzhang/bailu-cli
```

### GitHub 版本

GitHub 使用 Git Tag 管理版本：

```bash
# 查看所有版本
git tag

# 查看当前版本
git describe --tags
```

**版本对应关系**：
- npm 版本 = Git Tag 版本
- 例如：npm 1.1.0 = Git v1.1.0

---

## 分发流程

### 开发流程

```
1. 本地开发
   ├── 修改代码
   ├── 测试验证
   └── 提交到 Git

2. 版本发布
   ├── 更新 package.json 版本号
   ├── 创建 Git Tag
   ├── 推送到 GitHub
   └── 发布到 npm

3. 文档更新
   ├── 修改 docs/ 目录
   ├── 推送到 GitHub
   └── GitHub Actions 自动部署
```

### 用户使用流程

```
1. 安装 CLI
   npm install -g @vickzhang/bailu-cli

2. 初始化配置
   bailu init

3. 安装工作流
   bailu workflow install dev

4. 使用工具
   bailu serve  # 启动 WebUI
```

---

## 团队协作

### 配置同步

团队成员可以通过 Git 同步配置：

```bash
# 队长：推送配置到 Git
bailu sync push

# 成员：从 Git 拉取配置
bailu sync pull
```

### 协作流程

```
┌─────────────────────────────────────────────────────────────┐
│  队长                                                        │
│  1. bailu init                                              │
│  2. bailu workflow install dev                              │
│  3. bailu sync push                                         │
│  4. git push origin main                                    │
├─────────────────────────────────────────────────────────────┤
│  成员 A                                                      │
│  1. git clone <repo>                                        │
│  2. bailu sync pull                                         │
│  3. bailu tool install claude                               │
├─────────────────────────────────────────────────────────────┤
│  成员 B                                                      │
│  1. git clone <repo>                                        │
│  2. bailu sync pull                                         │
│  3. bailu tool install hanako                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 自定义分发

### 本地工作流

可以将工作流包放在本地目录：

```bash
# 创建本地工作流
mkdir -p my-workflow
cd my-workflow
# 添加组件文件...

# 从本地安装
bailu workflow install my-workflow --source ./my-workflow
```

### 私有仓库

可以使用私有 GitHub 仓库管理工作流：

```bash
# 克隆私有仓库
git clone git@github.com:your-org/bailu-workflows.git

# 从本地安装
bailu workflow install dev --source ./bailu-workflows/dev
```

---

## 最佳实践

### 1. 使用 npm 管理 CLI

```bash
# 好的做法：使用 npm 管理
npm install -g @vickzhang/bailu-cli

# 不推荐：从源码安装
git clone https://github.com/vickzhang/bailu-cli.git
cd bailu-cli
npm link
```

### 2. 使用 Git 管理配置

```bash
# 好的做法：使用 Git 管理团队配置
git clone git@github.com:team/bailu-config.git
bailu sync pull

# 不推荐：手动复制配置
cp -r ~/.bailu /path/to/backup/
```

### 3. 定期更新

```bash
# 更新 CLI
npm update -g @vickzhang/bailu-cli

# 更新工作流
bailu workflow install dev
```

### 4. 版本锁定

在 `package.json` 中锁定版本：

```json
{
  "dependencies": {
    "@vickzhang/bailu-cli": "1.1.0"
  }
}
```

---

## 常见问题

### Q: npm 和 GitHub 的版本不一致怎么办？

**A**: npm 版本和 Git Tag 版本应该保持一致。如果不一致，以 npm 版本为准。

### Q: 如何回退到旧版本？

**A**: 
```bash
# 回退 npm 版本
npm install -g @vickzhang/bailu-cli@1.0.0

# 回退 Git 版本
git checkout v1.0.0
```

### Q: 如何贡献代码？

**A**: 
1. Fork 仓库
2. 创建功能分支
3. 提交 PR
4. 等待审核

### Q: 文档如何更新？

**A**: 
1. 修改 `docs/` 目录
2. 推送到 GitHub
3. GitHub Actions 自动部署
