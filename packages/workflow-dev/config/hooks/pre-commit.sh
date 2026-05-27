#!/bin/bash

# Pre-commit hook — 提交前代码检查
# 在 git commit 前自动运行，确保代码质量

set -e

echo "🔍 白鹿工作流 — 提交前检查..."

# 检查是否有未暂存的更改
if ! git diff --quiet; then
  echo "⚠️  存在未暂存的更改，请先 stage 或 stash"
  exit 1
fi

# 运行 lint（如果项目配置了）
if [ -f "package.json" ]; then
  if grep -q '"lint"' package.json; then
    echo "📝 运行 Linter..."
    npm run lint
  fi
fi

# 运行类型检查（如果是 TypeScript 项目）
if [ -f "tsconfig.json" ]; then
  echo "🔧 运行类型检查..."
  npx tsc --noEmit
fi

# 检查提交信息格式
COMMIT_MSG_FILE="$1"
if [ -f "$COMMIT_MSG_FILE" ]; then
  COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")
  if ! echo "$COMMIT_MSG" | grep -qE "^(feat|fix|docs|style|refactor|perf|test|chore|revert)(\(.+\))?: .{1,}"; then
    echo "❌ 提交信息格式不符合规范！"
    echo "   期望格式: <type>(<scope>): <description>"
    echo "   示例: feat(auth): 添加用户登录功能"
    exit 1
  fi
fi

echo "✅ 提交前检查通过！"
