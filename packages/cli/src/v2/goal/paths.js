/**
 * @fileoverview 白鹿 Goal 模块 · 路径与目录解析
 *
 * .goal/ 目录所有路径在这里集中管理，避免散落字符串。
 * 与 .bailu.yaml 不同，.goal/ 是按项目走的"无人值守任务事实源"。
 */

const path = require('path');
const os = require('os');

/**
 * 获取项目 .goal/ 目录
 * @param {string} [cwd] 项目根目录
 * @returns {string}
 */
function getGoalDir(cwd = process.cwd()) {
  return path.join(cwd, '.goal');
}

/**
 * 获取 .goal/ 下所有约定文件的绝对路径
 * @param {string} [cwd] 项目根目录
 * @returns {Object}
 */
function getGoalPaths(cwd = process.cwd()) {
  const dir = getGoalDir(cwd);
  return {
    dir,
    current: path.join(dir, 'current.md'),
    state: path.join(dir, 'state.json'),
    progress: path.join(dir, 'progress.md'),
    blockers: path.join(dir, 'blockers.md'),
    verification: path.join(dir, 'verification.log'),
    handoff: path.join(dir, 'handoff.md'),
    snapshots: path.join(dir, 'snapshots')
  };
}

/**
 * 获取 runner 全局目录（~/.bailu-goal/）
 * 这里放：
 * - goal-runner.sh（自 cli/assets/goal/ 复制）
 * - goal-runner.log（runner 全量日志）
 * - last-claude-output.log（Claude 最近一次 stdout/stderr）
 * - goal-runner.lock（锁目录）
 *
 * @returns {string}
 */
function getRunnerHome() {
  return path.join(os.homedir(), '.bailu-goal');
}

/**
 * 获取 runner 全局目录下所有约定路径
 * @returns {Object}
 */
function getRunnerPaths() {
  const home = getRunnerHome();
  return {
    home,
    runnerSh: path.join(home, 'goal-runner.sh'),
    runnerLog: path.join(home, 'goal-runner.log'),
    lastClaudeOutput: path.join(home, 'last-claude-output.log'),
    launchdOut: path.join(home, 'launchd.out.log'),
    launchdErr: path.join(home, 'launchd.err.log'),
    lock: path.join(home, 'goal-runner.lock')
  };
}

/**
 * 获取项目专属的 launchd plist 路径
 *
 * 用 project path 的 sha1 短串拼 label，避免多项目互踩。
 *
 * @param {string} [cwd] 项目根目录
 * @returns {{label: string, plistPath: string}}
 */
function getLaunchdPaths(cwd = process.cwd()) {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha1').update(cwd).digest('hex').slice(0, 8);
  const label = `com.bailu.goal-runner.${hash}`;
  const plistPath = path.join(
    os.homedir(),
    'Library',
    'LaunchAgents',
    `${label}.plist`
  );
  return { label, plistPath };
}

/**
 * cli 包内置的 goal 资产目录
 * @returns {string}
 */
function getAssetsGoalDir() {
  return path.join(__dirname, '..', '..', '..', 'assets', 'goal');
}

module.exports = {
  getGoalDir,
  getGoalPaths,
  getRunnerHome,
  getRunnerPaths,
  getLaunchdPaths,
  getAssetsGoalDir
};
