/**
 * @fileoverview 白鹿 Goal 模块 · state.json 读写
 *
 * 状态机的所有合法值集中在这里，避免散落字符串。
 * runner.sh 也读同一个 state.json，但 shell 那边不依赖本文件，
 * 所以本文件改动时务必同步 goal-runner.sh 与 SKILL.md 的状态表。
 */

const fs = require('fs-extra');
const { getGoalPaths } = require('./paths');

/**
 * 合法状态枚举
 * @readonly
 */
const STATUS = Object.freeze({
  INIT: 'INIT',
  RUNNABLE: 'RUNNABLE',
  RUNNING: 'RUNNING',
  TOKEN_LOW: 'TOKEN_LOW',
  CONTEXT_NEEDS_COMPACT: 'CONTEXT_NEEDS_COMPACT',
  BLOCKED: 'BLOCKED',
  VERIFYING: 'VERIFYING',
  REVIEW_NEEDED: 'REVIEW_NEEDED',
  COMPLETED: 'COMPLETED',
  FAILED_NEEDS_HUMAN: 'FAILED_NEEDS_HUMAN'
});

/**
 * 状态的人类可读说明（用于 status 命令）
 */
const STATUS_LABEL = Object.freeze({
  INIT: '已初始化，等待首次运行',
  RUNNABLE: '可继续执行',
  RUNNING: '执行中（如长时间停留请检查是否异常退出）',
  TOKEN_LOW: 'Token / quota 不足，本轮跳过',
  CONTEXT_NEEDS_COMPACT: '上下文需要压缩 / 交接',
  BLOCKED: '已阻塞，需人工处理 .goal/blockers.md',
  VERIFYING: '正在完成门禁验证',
  REVIEW_NEEDED: '需阶段复查',
  COMPLETED: '🎉 目标已完成',
  FAILED_NEEDS_HUMAN: '自动化失败，需人工接管'
});

/**
 * 创建初始 state 对象
 * @param {Object} [opts]
 * @param {string} [opts.agent] 当前执行器
 * @returns {Object}
 */
function createInitialState(opts = {}) {
  return {
    $schema: 'https://bailu.dev/schemas/goal-state.v1.json',
    version: 1,
    status: STATUS.INIT,
    agent: opts.agent || 'claude',
    round: 0,
    lastStartedAt: null,
    lastFinishedAt: null,
    consecutiveFailures: 0,
    lastVerification: 'UNKNOWN',
    nextAction: 'continue_goal',
    notes: '',
    updatedAt: new Date().toISOString()
  };
}

/**
 * 读取 state.json
 * @param {string} [cwd]
 * @returns {Promise<Object|null>}
 */
async function readState(cwd = process.cwd()) {
  const { state } = getGoalPaths(cwd);
  if (!(await fs.pathExists(state))) return null;
  try {
    return await fs.readJson(state);
  } catch (err) {
    throw new Error(`.goal/state.json 解析失败：${err.message}`);
  }
}

/**
 * 写 state.json（同时刷新 updatedAt）
 * @param {Object} state
 * @param {string} [cwd]
 * @returns {Promise<void>}
 */
async function writeState(state, cwd = process.cwd()) {
  const { state: statePath } = getGoalPaths(cwd);
  const next = { ...state, updatedAt: new Date().toISOString() };
  await fs.writeJson(statePath, next, { spaces: 2 });
}

/**
 * 部分更新 state.json
 * @param {Object} patch 要合并的字段
 * @param {string} [cwd]
 * @returns {Promise<Object>} 更新后的完整 state
 */
async function patchState(patch, cwd = process.cwd()) {
  const cur = (await readState(cwd)) || createInitialState();
  const next = { ...cur, ...patch };
  await writeState(next, cwd);
  return next;
}

module.exports = {
  STATUS,
  STATUS_LABEL,
  createInitialState,
  readState,
  writeState,
  patchState
};
