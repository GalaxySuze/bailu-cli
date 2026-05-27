#!/bin/bash

# Post-task hook — 任务完成后处理
# 在开发任务完成后运行，用于知识沉淀和清理

set -e

echo "📝 白鹿工作流 — 任务完成处理..."

# 检查 TODO.md 是否需要更新
if [ -f "TODO.md" ]; then
  echo "📋 TODO.md 存在，请确认是否需要更新"
fi

# 运行测试覆盖率检查（如果项目配置了）
if [ -f "package.json" ]; then
  if grep -q '"test:coverage"' package.json; then
    echo "📊 运行测试覆盖率检查..."
    npm run test:coverage
  fi
fi

# 检查是否有未提交的文档变更
if [ -d "docs" ]; then
  echo "📚 docs 目录存在，请确认文档是否需要更新"
fi

# 决策追溯 — 记录关键决策到知识库
DECISIONS_DIR="$HOME/.bailu/knowledge-base/projects/$(basename "$PWD")/decisions"
if [ -d "$DECISIONS_DIR" ]; then
  echo "🧠 决策记录目录: $DECISIONS_DIR"
fi

echo "✅ 任务完成处理结束！"
