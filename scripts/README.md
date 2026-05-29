# 发布脚本 release.sh

一键发布白鹿工作流 CLI，自动处理多 remote push、GitLab MR 创建、GitHub merge、tag 和 npm publish。

## 设计原则

- **本地禁推 origin master**：脚本通过 GitLab API 自动创建 MR (dev → master)，等待人工审核合并
- **GitHub 允许直推 main**：脚本自动合并 dev → main 并 push
- **变量化**：版本号、commit message、remote 名等可通过环境变量覆盖
- **安全**：DRY_RUN 模式预演不执行，所有破坏性操作前有校验

## 快速使用

```bash
# 1. 配置 GitLab token (一次性)
export GITLAB_TOKEN="glpat-xxxxxxxxxxxxxx"
# 获取地址: https://10.50.200.10/-/user_settings/personal_access_tokens
# 权限: api

# 2. 登录 npm (一次性)
npm login --registry https://registry.npmjs.org

# 3. 在 dev 分支执行
./scripts/release.sh
```

## 环境变量

### 必需

| 变量 | 说明 |
|------|------|
| `GITLAB_TOKEN` | GitLab Personal Access Token (api scope)，用于创建 MR。不设置则跳过 MR 创建，提示手动 |

### 可选

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VERSION` | 从 `packages/cli/package.json` 读取 | 新版本号（不含 v 前缀） |
| `COMMIT_MSG` | `chore: release v$VERSION` | merge/tag 消息 |
| `SKIP_NPM` | `0` | `1` 跳过 npm publish |
| `SKIP_GITHUB` | `0` | `1` 跳过 GitHub 所有操作 |
| `SKIP_TAG` | `0` | `1` 跳过打 tag（已手动打过 tag 时用） |
| `DRY_RUN` | `0` | `1` 预演不执行，只打印命令 |
| `GITLAB_HOST` | `10.50.200.10` | GitLab 主机 |
| `GITLAB_PROJECT_ID` | `SupEntra%2FSupEntra_ai_workflow` | URL encoded 项目路径 |
| `GITLAB_TARGET_BRANCH` | `master` | MR 目标分支 |
| `GITLAB_SOURCE_BRANCH` | `dev` | MR 源分支 |
| `GITHUB_TARGET_BRANCH` | `main` | GitHub 合并目标 |
| `ORIGIN_REMOTE` | `origin` | GitLab remote 名 |
| `GITHUB_REMOTE` | `github` | GitHub remote 名 |

## 流程步骤

1. **环境校验** — 分支/工作区/版本号/tag/token
2. **push dev → origin** (GitLab)
3. **push dev → github** (GitHub)
4. **创建 GitLab MR** (dev → master) — 调 API，需 `GITLAB_TOKEN`
5. **合并 dev → main 并 push github** — 直接执行
6. **打 tag vX.Y.Z** 推送两个 remote
7. **npm publish** `packages/cli`

## 常见用法

```bash
# 预演完整流程
DRY_RUN=1 ./scripts/release.sh

# 仅本地操作，不发 npm
SKIP_NPM=1 ./scripts/release.sh

# 显式指定版本号
VERSION=1.4.0 ./scripts/release.sh

# 自定义 commit message
COMMIT_MSG="feat: v1.4.0 - 新功能 X" VERSION=1.4.0 ./scripts/release.sh

# 已手动打过 tag
SKIP_TAG=1 ./scripts/release.sh

# 仅 GitLab，不动 GitHub
SKIP_GITHUB=1 ./scripts/release.sh
```

## 失败恢复

脚本每步都有 `set -euo pipefail` 保护，任一步失败立即中止。

- **push 失败** → 检查网络/代理/SSH 权限
- **MR 创建失败** → 检查 `GITLAB_TOKEN` 权限，或手动到 GitLab 创建
- **merge 冲突** → 手动解决后再次执行（脚本会跳过已完成步骤需手动改）
- **npm publish 失败** → 检查 `npm whoami`、版本号是否已发布、package.json 配置

## 完成后

- 在 GitLab 上审阅并合并 MR (dev → master)
- 验证 npm: `npm view @vickzhang/bailu-cli version`
- 可选: `gh release create v$VERSION --generate-notes`
