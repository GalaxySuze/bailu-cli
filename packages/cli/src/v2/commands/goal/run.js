/**
 * @fileoverview bailu goal run
 *
 * 手动跑一轮 Goal 协议。
 * 实质上是在前台一次性调用 goal-runner.sh，让 runner 走完整决策 + Claude 调用流程。
 *
 * 这样做的好处：
 * - 完全复用 launchd 路径的执行逻辑，避免"手动 vs 自动行为漂移"。
 * - 用户能在终端看到 runner 的 echo 与最终 status。
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { spawn } = require('child_process');
const { getGoalPaths, getRunnerPaths, getAssetsGoalDir } = require('../../goal/paths');

/**
 * 确保 ~/.bailu-goal/goal-runner.sh 已落盘
 */
async function ensureRunnerScript() {
  const runner = getRunnerPaths();
  await fs.ensureDir(runner.home);
  const src = path.join(getAssetsGoalDir(), 'goal-runner.sh');
  // 每次 run 都从 assets 复制最新版，避免老脚本残留
  await fs.copy(src, runner.runnerSh, { overwrite: true });
  await fs.chmod(runner.runnerSh, 0o755);
  return runner.runnerSh;
}

/**
 * 入口：bailu goal run
 * @param {Object} options
 */
async function runGoalRun(options = {}) {
  const cwd = process.cwd();
  const paths = getGoalPaths(cwd);
  const runner = getRunnerPaths();

  if (!(await fs.pathExists(paths.dir))) {
    console.log(chalk.red('  ✘ 当前目录还没有 .goal/，请先运行 bailu goal init'));
    process.exit(1);
  }

  const runnerSh = await ensureRunnerScript();

  console.log('');
  console.log(chalk.cyan('  白鹿 Goal · 手动执行一轮'));
  console.log(chalk.gray(`  runner   : ${runnerSh}`));
  console.log(chalk.gray(`  project  : ${cwd}`));
  console.log(chalk.gray(`  log      : ${runner.runnerLog}`));
  if (options.dryRun) {
    console.log(chalk.yellow('  DRY_RUN  : 不会真正调用 Claude'));
  }
  console.log('');

  const env = {
    ...process.env,
    BAILU_GOAL_PROJECT: cwd,
    BAILU_GOAL_HOME: runner.home,
    CLAUDE_BIN: process.env.CLAUDE_BIN || 'claude'
  };
  if (options.dryRun) env.BAILU_GOAL_DRY_RUN = '1';
  if (options.timeout) env.BAILU_GOAL_TIMEOUT = String(options.timeout);

  const child = spawn('/bin/bash', [runnerSh], {
    cwd,
    env,
    stdio: 'inherit'
  });

  child.on('exit', (code) => {
    console.log('');
    if (code === 0) {
      console.log(chalk.green('  ✔ runner 退出码 0'));
    } else {
      console.log(chalk.red(`  ✘ runner 退出码 ${code}`));
    }
    console.log(chalk.gray('  查看完整日志：bailu goal logs'));
    process.exit(code || 0);
  });
}

module.exports = { runGoalRun };
