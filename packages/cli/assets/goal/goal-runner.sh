#!/usr/bin/env bash
# ============================================================================
# 白鹿 Goal Runner
# ----------------------------------------------------------------------------
# 由 launchd 定时唤醒，负责：
#   1. 锁文件 / 防并发
#   2. Claude CLI 可用性检测
#   3. 读取项目 .goal/state.json 决策是否执行
#   4. 单次执行超时控制
#   5. macOS 通知
#   6. 全量日志
#
# 它不负责理解业务，不修改业务代码。所有"做事"由 Claude 执行器完成。
#
# 配置（可通过环境变量覆盖）：
#   BAILU_GOAL_PROJECT   目标项目根目录，必填（plist 里写绝对路径）
#   BAILU_GOAL_TIMEOUT   单次执行上限，秒，默认 1500
#   BAILU_GOAL_HOME      runner 状态目录，默认 ~/.bailu-goal
#   CLAUDE_BIN           claude 可执行文件名/路径，默认 claude
#   BAILU_GOAL_PROMPT    传给 claude -p 的 prompt，默认走 /bailu-goal slash
#   BAILU_GOAL_DRY_RUN   1 = 只打印决策不调用 claude（调试用）
# ============================================================================

set -u

# ----------------------------------------------------------------------------
# 默认配置
# ----------------------------------------------------------------------------
BAILU_GOAL_HOME="${BAILU_GOAL_HOME:-${HOME}/.bailu-goal}"
BAILU_GOAL_TIMEOUT="${BAILU_GOAL_TIMEOUT:-1500}"
CLAUDE_BIN="${CLAUDE_BIN:-claude}"
BAILU_GOAL_DRY_RUN="${BAILU_GOAL_DRY_RUN:-0}"

# 默认 prompt：走 slash 命令，最大化复用 Claude 侧 Skill / Command 资产
BAILU_GOAL_PROMPT="${BAILU_GOAL_PROMPT:-/bailu-goal}"

mkdir -p "$BAILU_GOAL_HOME"
LOG_FILE="$BAILU_GOAL_HOME/goal-runner.log"
LOCK_FILE="$BAILU_GOAL_HOME/goal-runner.lock"

# ----------------------------------------------------------------------------
# 日志助手
# ----------------------------------------------------------------------------
log() {
  local ts
  ts="$(date '+%Y-%m-%dT%H:%M:%S%z')"
  printf '[%s] %s\n' "$ts" "$*" | tee -a "$LOG_FILE"
}

notify() {
  local title="$1"
  local body="$2"
  # DRY_RUN 模式下只记日志不发真实通知（否则测试会干扰用户）
  if [ "${BAILU_GOAL_DRY_RUN:-0}" = "1" ]; then
    log "[NOTIFY] ${title}: ${body}"
    return
  fi
  if command -v osascript >/dev/null 2>&1; then
    osascript -e "display notification \"${body//\"/\\\"}\" with title \"${title//\"/\\\"}\"" \
      >/dev/null 2>&1 || true
  fi
}

die() {
  log "ERROR: $*"
  exit 1
}

# ----------------------------------------------------------------------------
# 0. 参数校验
# ----------------------------------------------------------------------------
if [ -z "${BAILU_GOAL_PROJECT:-}" ]; then
  die "BAILU_GOAL_PROJECT 未设置（应由 plist 显式注入项目根目录）"
fi

PROJECT_DIR="$BAILU_GOAL_PROJECT"
GOAL_DIR="$PROJECT_DIR/.goal"
STATE_FILE="$GOAL_DIR/state.json"

if [ ! -d "$GOAL_DIR" ]; then
  die ".goal/ 目录不存在：${GOAL_DIR}（先运行 bailu goal init）"
fi
if [ ! -f "$STATE_FILE" ]; then
  die ".goal/state.json 不存在：$STATE_FILE"
fi

# ----------------------------------------------------------------------------
# 1. 锁文件（mkdir 原子性，比 flock 跨平台更稳）
# ----------------------------------------------------------------------------
if ! mkdir "$LOCK_FILE" 2>/dev/null; then
  # 锁已存在；检查是否陈旧（超时 * 2 视为死锁）
  if [ -f "$LOCK_FILE/pid" ]; then
    local_pid="$(cat "$LOCK_FILE/pid" 2>/dev/null || true)"
    if [ -n "$local_pid" ] && kill -0 "$local_pid" 2>/dev/null; then
      log "SKIP: 已有 runner 在执行 (pid=$local_pid)"
      exit 0
    fi
  fi
  log "WARN: 检测到陈旧锁，清理后继续"
  rm -rf "$LOCK_FILE"
  mkdir "$LOCK_FILE" || die "无法获取锁"
fi
echo "$$" > "$LOCK_FILE/pid"

cleanup() {
  rm -rf "$LOCK_FILE"
}
trap cleanup EXIT INT TERM

# ----------------------------------------------------------------------------
# 2. Claude CLI 可用性检测（DRY_RUN 下只警告不拦截）
# ----------------------------------------------------------------------------
if ! command -v "$CLAUDE_BIN" >/dev/null 2>&1; then
  if [ "$BAILU_GOAL_DRY_RUN" = "1" ]; then
    log "WARN: 找不到 Claude CLI: ${CLAUDE_BIN}（DRY_RUN 继续演示决策）"
  else
    log "ERROR: 找不到 Claude CLI: $CLAUDE_BIN"
    notify "白鹿 Goal Runner" "Claude CLI 不可用，已暂停本次唤醒"
    exit 0
  fi
fi

# ----------------------------------------------------------------------------
# 3. 状态读写工具
#    关键设计：shell 内嵌 Node 不直接拼字符串到 JS 代码（防注入），
#    统一通过环境变量传文件路径和键值。
# ----------------------------------------------------------------------------

# 读取 .goal/state.json 的 status 字段
read_status() {
  STATE_FILE="${STATE_FILE}" node -e '
    const fs = require("fs");
    try {
      const s = JSON.parse(fs.readFileSync(process.env.STATE_FILE, "utf8"));
      process.stdout.write(String(s.status || "UNKNOWN"));
    } catch (_e) {
      process.stdout.write("UNKNOWN");
    }
  ' 2>/dev/null
}

# 读取任意字段
# 用法：read_state_field <key>
read_state_field() {
  local key="$1"
  STATE_FILE="${STATE_FILE}" STATE_KEY="${key}" node -e '
    const fs = require("fs");
    try {
      const s = JSON.parse(fs.readFileSync(process.env.STATE_FILE, "utf8"));
      const v = s[process.env.STATE_KEY];
      process.stdout.write(v == null ? "" : String(v));
    } catch (_e) {
      process.stdout.write("");
    }
  ' 2>/dev/null
}

# 写入字段（字符串值）；传空字符串写 null
# 用法：write_state_string <key> <string-value>
write_state_string() {
  local key="$1"
  local value="$2"
  STATE_FILE="${STATE_FILE}" STATE_KEY="${key}" STATE_VAL="${value}" node -e '
    const fs = require("fs");
    const s = JSON.parse(fs.readFileSync(process.env.STATE_FILE, "utf8"));
    const v = process.env.STATE_VAL;
    s[process.env.STATE_KEY] = v === "" ? null : v;
    s.updatedAt = new Date().toISOString();
    fs.writeFileSync(process.env.STATE_FILE, JSON.stringify(s, null, 2) + "\n");
  '
}

STATUS="$(read_status)"
log "唤醒：project=${PROJECT_DIR} status=${STATUS}"

# ----------------------------------------------------------------------------
# 3.5 RUNNING 陈旧检测（自动恢复）
#
#     协议修正：runner 不再主动写 RUNNING。正常情况下只有 Claude
#     在执行原子任务时才会短暂置 RUNNING。如果 runner 唤醒时看到
#     RUNNING，意味着上一轮异常退出了。
#
#     被认为陈旧（满足任一即恢复）：
#       a. lastStartedAt 缺失
#       b. lastStartedAt 距今超过 timeout * 2 秒
#     锁存活检查在第 1 节已由 mkdir 处理，这里不重复。
# ----------------------------------------------------------------------------
if [ "${STATUS}" = "RUNNING" ]; then
  last_started="$(read_state_field lastStartedAt)"
  stale=0
  stale_reason=""
  age_sec="-1"

  if [ -z "${last_started}" ]; then
    stale=1
    stale_reason="lastStartedAt 缺失"
  else
    # 用 node 算时间差，避免 mac/linux date 的差异
    age_sec="$(LAST_STARTED="${last_started}" node -e '
      const t = Date.parse(process.env.LAST_STARTED);
      if (Number.isFinite(t)) {
        process.stdout.write(String(Math.floor((Date.now() - t) / 1000)));
      } else {
        process.stdout.write("-1");
      }
    ' 2>/dev/null)"
    threshold=$(( BAILU_GOAL_TIMEOUT * 2 ))
    if [ "${age_sec}" = "-1" ] || [ "${age_sec}" -gt "${threshold}" ]; then
      stale=1
      stale_reason="RUNNING 已持续 ${age_sec}s（阈值 ${threshold}s）"
    fi
  fi

  if [ "${stale}" = "0" ]; then
    log "状态 RUNNING 且未达 stale 阈值（age=${age_sec}s），跳过本次"
    exit 0
  fi

  log "WARN: 检测到 RUNNING stale（${stale_reason}），自动恢复为 RUNNABLE"
  write_state_string status "RUNNABLE"
  write_state_string notes "runner 自动恢复：${stale_reason}"
  STATUS="RUNNABLE"
fi

# ----------------------------------------------------------------------------
# 4. 决策表
# ----------------------------------------------------------------------------
case "${STATUS}" in
  COMPLETED)
    log "目标已完成，跳过"
    notify "白鹿 Goal" "目标已完成，runner 不再执行"
    exit 0
    ;;
  BLOCKED)
    log "状态 BLOCKED，需要人工处理"
    notify "白鹿 Goal" "任务被阻塞，请查看 .goal/blockers.md"
    exit 0
    ;;
  FAILED_NEEDS_HUMAN)
    log "状态 FAILED_NEEDS_HUMAN，跳过"
    notify "白鹿 Goal" "自动化失败，需人工接管，请查看 .goal/progress.md"
    exit 0
    ;;
  TOKEN_LOW)
    log "状态 TOKEN_LOW，跳过本次唤醒"
    exit 0
    ;;
  CONTEXT_NEEDS_COMPACT)
    log "状态 CONTEXT_NEEDS_COMPACT，提醒人工接管"
    notify "白鹿 Goal" "上下文需要压缩，请人工处理"
    exit 0
    ;;
  INIT|RUNNABLE|REVIEW_NEEDED|VERIFYING)
    log "状态 ${STATUS}，准备调用 Claude 执行一轮"
    ;;
  *)
    log "未知状态：${STATUS}，跳过"
    exit 0
    ;;
esac

# ----------------------------------------------------------------------------
# 5. 调用 Claude（headless）
# ----------------------------------------------------------------------------
if [ "$BAILU_GOAL_DRY_RUN" = "1" ]; then
  log "DRY_RUN：本应执行 ${CLAUDE_BIN} -p '${BAILU_GOAL_PROMPT}' (cwd=${PROJECT_DIR})"
  exit 0
fi

# runner 不再预写 status=RUNNING：
#   RUNNING 由 Claude Skill 在真正开始原子任务时写入。
#   runner 只靠锁文件防并发，不参与任务状态流转。
#   lastStartedAt 同理，由 Claude 写入。
#
#   这样做的原因：如果 runner 先把 status 改成 RUNNING，
#   Claude 被 -p 唤醒后读到 RUNNING，按 Skill 规则会认为
#   这是上一轮异常残留，直接改回 RUNNABLE 然后退出，
#   结果是什么任务都不推进。

# 超时执行：优先 gtimeout（brew coreutils），fallback 到 perl
run_with_timeout() {
  local secs="$1"; shift
  if command -v gtimeout >/dev/null 2>&1; then
    gtimeout "$secs" "$@"
  else
    perl -e '
      use strict; use warnings;
      my $t = shift @ARGV;
      my $pid = fork();
      die "fork failed: $!" unless defined $pid;
      if ($pid == 0) { exec @ARGV; exit 127; }
      local $SIG{ALRM} = sub { kill "TERM", $pid; sleep 2; kill "KILL", $pid; exit 124; };
      alarm $t;
      waitpid $pid, 0;
      exit ($? >> 8);
    ' "$secs" "$@"
  fi
}

cd "$PROJECT_DIR" || die "无法 cd 到项目目录 $PROJECT_DIR"

log "调用：${CLAUDE_BIN} -p '${BAILU_GOAL_PROMPT}' (timeout=${BAILU_GOAL_TIMEOUT}s)"

CLAUDE_OUTPUT_FILE="$BAILU_GOAL_HOME/last-claude-output.log"
: > "$CLAUDE_OUTPUT_FILE"

# 关键参数：
#   -p           headless 模式，prompt 一次性传入
#   --dangerously-skip-permissions   后台无人值守必需；安全靠 .goal/current.md 的"安全边界"兜底
run_with_timeout "$BAILU_GOAL_TIMEOUT" \
  "$CLAUDE_BIN" -p "$BAILU_GOAL_PROMPT" --dangerously-skip-permissions \
  >>"$CLAUDE_OUTPUT_FILE" 2>&1
EXIT_CODE=$?

log "Claude 退出码：$EXIT_CODE"
log "（精简日志：Claude 全量输出见 ${CLAUDE_OUTPUT_FILE}）"

# ----------------------------------------------------------------------------
# 6. 根据退出码更新最终状态
# ----------------------------------------------------------------------------
case "$EXIT_CODE" in
  0)
    log "Claude 正常退出，重新读取状态判断是否完成"
    ;;
  124)
    log "WARN: Claude 超时 (${BAILU_GOAL_TIMEOUT}s)，写 FAILED_NEEDS_HUMAN"
    write_state_string status "FAILED_NEEDS_HUMAN"
    notify "白鹿 Goal" "Claude 执行超时（${BAILU_GOAL_TIMEOUT}s），已标记 FAILED_NEEDS_HUMAN"
    ;;
  *)
    log "WARN: Claude 异常退出 (${EXIT_CODE})，写 FAILED_NEEDS_HUMAN"
    write_state_string status "FAILED_NEEDS_HUMAN"
    notify "白鹿 Goal" "Claude 异常退出（exit=${EXIT_CODE}），已标记 FAILED_NEEDS_HUMAN"
    ;;
esac

NEW_STATUS="$(read_status)"
log "完成：new_status=$NEW_STATUS"

# 如果 Claude 把状态改成了 COMPLETED，通知用户
if [ "$NEW_STATUS" = "COMPLETED" ]; then
  notify "白鹿 Goal" "目标已完成！请检查 .goal/progress.md 确认后手动提交代码。"
fi

# 如果进了 FAILED_NEEDS_HUMAN 但不是 runner 刚设的（即 Claude 自己设的），也通知
if [ "$NEW_STATUS" = "FAILED_NEEDS_HUMAN" ] && [ "$EXIT_CODE" = "0" ]; then
  notify "白鹿 Goal" "Claude 判定任务失败，请查看 .goal/progress.md"
fi