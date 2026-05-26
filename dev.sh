#!/bin/bash
# ============================================================
# 白鹿工作流 开发环境启动脚本
# ============================================================
# 使用方式：
#   ./dev.sh publish --dry-run    # 预览发布
#   ./dev.sh publish              # 发布
#   ./dev.sh status               # 查看状态
# ============================================================

# 激活nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 设置开发环境变量
export BAILU_DEV=true

# 运行bailu命令
node ~/Code/AIAgent/bailu-cli/packages/cli/bin/bailu.js "$@"
