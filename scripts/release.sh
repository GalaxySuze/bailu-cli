#!/usr/bin/env bash
# ============================================================================
# 白鹿工作流 一键发布脚本
#
# 流程:
#   1. 校验环境 (分支/工作区干净/版本号)
#   2. push dev 到 origin + github
#   3. 合并 dev → master, push origin (本地禁推 master, 改为创建 GitLab MR)
#   4. 合并 dev → main, push github (允许直推)
#   5. 打 tag vX.Y.Z, push 到两个 remote
#   6. npm publish CLI
#
# 使用:
#   ./scripts/release.sh                  # 交互模式 (默认)
#   VERSION=1.3.3 ./scripts/release.sh    # 显式指定版本号
#   DRY_RUN=1 ./scripts/release.sh        # 预演不执行
#
# 必需环境变量 (创建 GitLab MR):
#   GITLAB_TOKEN   - GitLab Personal Access Token (api scope)
#                    http://10.50.200.10:82/-/user_settings/personal_access_tokens
#
# 可选环境变量:
#   VERSION             - 新版本号 (不填则从 packages/cli/package.json 读取)
#   COMMIT_MSG          - 自定义 merge commit message
#   SKIP_NPM            - 1 则跳过 npm publish
#   SKIP_GITHUB         - 1 则跳过 github remote 操作
#   SKIP_TAG            - 1 则不打 tag
#   GITLAB_HOST         - GitLab 主机 (默认 10.50.200.10)
#   GITLAB_PORT         - GitLab 端口 (默认 82)
#   GITLAB_SCHEME       - http 或 https (默认 http)
#   GITLAB_PROJECT_ID   - GitLab 项目 ID 或路径 encoded (默认 SupEntra%2FSupEntra_ai_workflow)
#   DRY_RUN             - 1 则只打印命令不执行
# ============================================================================

set -euo pipefail

# ─── 配色 ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${CYAN}[INFO]${NC} $*"; }
ok()   { echo -e "${GREEN}[ OK ]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[FAIL]${NC} $*" >&2; }
step() { echo -e "\n${BOLD}${CYAN}━━━━━━ $* ━━━━━━${NC}"; }

# ─── 配置 ────────────────────────────────────────────────────────────────
GITLAB_HOST="${GITLAB_HOST:-10.50.200.10}"
GITLAB_PORT="${GITLAB_PORT:-82}"
GITLAB_SCHEME="${GITLAB_SCHEME:-http}"
GITLAB_API_BASE="${GITLAB_SCHEME}://${GITLAB_HOST}:${GITLAB_PORT}"
GITLAB_PROJECT_ID="${GITLAB_PROJECT_ID:-SupEntra%2FSupEntra_ai_workflow}"
GITLAB_TARGET_BRANCH="${GITLAB_TARGET_BRANCH:-master}"
GITLAB_SOURCE_BRANCH="${GITLAB_SOURCE_BRANCH:-dev}"
GITHUB_TARGET_BRANCH="${GITHUB_TARGET_BRANCH:-main}"
GITHUB_SOURCE_BRANCH="${GITHUB_SOURCE_BRANCH:-dev}"
ORIGIN_REMOTE="${ORIGIN_REMOTE:-origin}"
GITHUB_REMOTE="${GITHUB_REMOTE:-github}"
CLI_PKG_DIR="packages/cli"
DRY_RUN="${DRY_RUN:-0}"

# ─── DRY RUN 包装 ────────────────────────────────────────────────────────
run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    echo -e "${YELLOW}[DRY]${NC} $*"
  else
    eval "$@"
  fi
}

# ─── 1. 环境校验 ─────────────────────────────────────────────────────────
step "1/7 环境校验"

# 进入项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"
log "项目根: $PROJECT_ROOT"

# 当前分支必须是 dev
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "$GITLAB_SOURCE_BRANCH" ]]; then
  err "当前分支是 $CURRENT_BRANCH, 必须在 $GITLAB_SOURCE_BRANCH 分支执行"
  exit 1
fi
ok "分支: $CURRENT_BRANCH"

# 工作区必须干净 (DRY_RUN 时仅警告)
if ! git diff-index --quiet HEAD --; then
  if [[ "$DRY_RUN" == "1" ]]; then
    warn "工作区有未提交变更 (DRY_RUN 已跳过校验)"
  else
    err "工作区有未提交变更, 请先 commit 或 stash"
    git status --short
    exit 1
  fi
else
  ok "工作区干净"
fi

# 读取/确认版本号
if [[ -z "${VERSION:-}" ]]; then
  CURRENT_VERSION=$(node -p "require('./$CLI_PKG_DIR/package.json').version")
  VERSION="$CURRENT_VERSION"
  log "从 package.json 读取版本号: $VERSION"
fi
ok "版本号: v$VERSION"

# 校验 tag 不存在 (除非 SKIP_TAG=1)
if [[ "${SKIP_TAG:-0}" != "1" ]]; then
  if git rev-parse "v$VERSION" >/dev/null 2>&1; then
    err "tag v$VERSION 已存在, 请先 bump 版本号或删除旧 tag"
    err "如已手动打过 tag, 请设置 SKIP_TAG=1 跳过"
    exit 1
  fi
  ok "tag v$VERSION 可用"
else
  if git rev-parse "v$VERSION" >/dev/null 2>&1; then
    warn "tag v$VERSION 已存在 (SKIP_TAG=1 已跳过校验)"
  fi
fi

# 校验 GitLab token (若不跳过 MR)
if [[ -z "${GITLAB_TOKEN:-}" ]]; then
  warn "GITLAB_TOKEN 未设置 — 将跳过创建 MR, 仅 push dev 分支"
  warn "请手动在 GitLab 上创建 MR: $GITLAB_SOURCE_BRANCH → $GITLAB_TARGET_BRANCH"
  SKIP_MR=1
else
  SKIP_MR=0
  ok "GITLAB_TOKEN 已配置"
fi

# COMMIT_MSG 默认值
COMMIT_MSG="${COMMIT_MSG:-chore: release v$VERSION}"
log "merge/tag 消息: $COMMIT_MSG"

# ─── 2. push dev 到 origin (GitLab) ──────────────────────────────────────
step "2/7 push dev → $ORIGIN_REMOTE (GitLab)"
run "git push $ORIGIN_REMOTE $GITLAB_SOURCE_BRANCH"
ok "已 push dev 到 $ORIGIN_REMOTE"

# ─── 3. push dev 到 github ───────────────────────────────────────────────
if [[ "${SKIP_GITHUB:-0}" != "1" ]]; then
  step "3/7 push dev → $GITHUB_REMOTE (GitHub)"
  run "git push $GITHUB_REMOTE $GITHUB_SOURCE_BRANCH"
  ok "已 push dev 到 $GITHUB_REMOTE"
else
  warn "3/7 跳过 GitHub push (SKIP_GITHUB=1)"
fi

# ─── 4. 创建 GitLab MR (dev → master) ───────────────────────────────────
step "4/7 创建 GitLab MR: $GITLAB_SOURCE_BRANCH → $GITLAB_TARGET_BRANCH"

if [[ "$SKIP_MR" == "1" ]]; then
  warn "跳过 (无 GITLAB_TOKEN). 请手动创建 MR:"
  warn "  $GITLAB_API_BASE/$(echo $GITLAB_PROJECT_ID | sed 's/%2F/\//g')/-/merge_requests/new?merge_request[source_branch]=$GITLAB_SOURCE_BRANCH&merge_request[target_branch]=$GITLAB_TARGET_BRANCH"
else
  MR_PAYLOAD=$(cat <<EOF
{
  "source_branch": "$GITLAB_SOURCE_BRANCH",
  "target_branch": "$GITLAB_TARGET_BRANCH",
  "title": "$COMMIT_MSG",
  "description": "Auto-created by release.sh\n\nVersion: v$VERSION\nFrom: $GITLAB_SOURCE_BRANCH\nTo: $GITLAB_TARGET_BRANCH",
  "remove_source_branch": false,
  "squash": false
}
EOF
)

  if [[ "$DRY_RUN" == "1" ]]; then
    echo -e "${YELLOW}[DRY]${NC} curl POST $GITLAB_API_BASE/api/v4/projects/$GITLAB_PROJECT_ID/merge_requests"
    echo "$MR_PAYLOAD"
  else
    MR_RESPONSE=$(curl -sS -k \
      --request POST \
      --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
      --header "Content-Type: application/json" \
      --data "$MR_PAYLOAD" \
      "$GITLAB_API_BASE/api/v4/projects/$GITLAB_PROJECT_ID/merge_requests")

    MR_URL=$(echo "$MR_RESPONSE" | node -e "
      let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
        try{const j=JSON.parse(s);
          if(j.web_url)console.log(j.web_url);
          else if(j.message)console.log('ERROR: '+JSON.stringify(j.message));
          else console.log('UNKNOWN: '+s);
        }catch(e){console.log('PARSE_ERROR: '+s);}
      });" 2>/dev/null || echo "$MR_RESPONSE")

    if [[ "$MR_URL" =~ ^http ]]; then
      ok "MR 已创建: $MR_URL"
    elif echo "$MR_URL" | grep -q "already exists"; then
      warn "MR 已存在 (这是正常的, 继续后续步骤)"
    else
      err "MR 创建失败: $MR_URL"
      err "请手动到 GitLab 创建 MR 后继续"
      read -p "回车继续, 或 Ctrl+C 中止: " _
    fi
  fi
fi

# ─── 5. 合并 dev → main 并 push github ───────────────────────────────────
if [[ "${SKIP_GITHUB:-0}" != "1" ]]; then
  step "5/7 合并 $GITHUB_SOURCE_BRANCH → $GITHUB_TARGET_BRANCH (GitHub)"
  run "git fetch $GITHUB_REMOTE $GITHUB_TARGET_BRANCH"
  run "git checkout $GITHUB_TARGET_BRANCH"
  run "git pull $GITHUB_REMOTE $GITHUB_TARGET_BRANCH"
  run "git merge $GITHUB_SOURCE_BRANCH --no-ff -m '$COMMIT_MSG'"
  run "git push $GITHUB_REMOTE $GITHUB_TARGET_BRANCH"
  run "git checkout $GITLAB_SOURCE_BRANCH"
  ok "已合并 + push $GITHUB_TARGET_BRANCH"
else
  warn "5/7 跳过 GitHub merge (SKIP_GITHUB=1)"
fi

# ─── 6. 打 tag ───────────────────────────────────────────────────────────
if [[ "${SKIP_TAG:-0}" != "1" ]]; then
  step "6/7 打 tag v$VERSION"
  run "git tag -a v$VERSION -m '$COMMIT_MSG'"
  run "git push $ORIGIN_REMOTE v$VERSION"
  if [[ "${SKIP_GITHUB:-0}" != "1" ]]; then
    run "git push $GITHUB_REMOTE v$VERSION"
  fi
  ok "tag v$VERSION 已推送"
else
  warn "6/7 跳过打 tag (SKIP_TAG=1)"
fi

# ─── 7. npm publish ──────────────────────────────────────────────────────
if [[ "${SKIP_NPM:-0}" != "1" ]]; then
  step "7/7 npm publish $CLI_PKG_DIR"
  if [[ "$DRY_RUN" != "1" ]]; then
    if ! npm whoami --registry https://registry.npmjs.org >/dev/null 2>&1; then
      err "未登录 npm, 请先执行: npm login --registry https://registry.npmjs.org"
      exit 1
    fi
    log "npm 用户: $(npm whoami --registry https://registry.npmjs.org)"
  fi
  run "(cd $CLI_PKG_DIR && npm publish --access public)"
  ok "npm publish 完成"
else
  warn "7/7 跳过 npm publish (SKIP_NPM=1)"
fi

# ─── 完成 ────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}✓ Release v$VERSION 完成${NC}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}后续手动操作:${NC}"
if [[ "$SKIP_MR" != "1" ]]; then
  echo "  • 在 GitLab 上审阅并合并 MR (dev → master)"
fi
echo "  • 验证 npm: npm view @vickzhang/bailu-cli version"
echo "  • 验证 GitHub: gh release create v$VERSION --generate-notes (可选)"
echo ""
