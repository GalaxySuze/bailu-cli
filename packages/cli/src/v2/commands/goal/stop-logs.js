/**
 * @fileoverview bailu goal stop / logs
 *
 * stop  ：把 .goal/state.json.status 设为 BLOCKED，runner 下次唤醒会跳过。
 *         追加一行说明到 .goal/blockers.md。
 *         不直接 unload launchd，因为"暂停"和"彻底卸载"是两个语义。
 *
 * logs  ：tail -f runner 日志，或一次性 tail 末尾 N 行。
 */

const fs = require('fs-extra');
const chalk = require('chalk');
const { spawn } = require('child_process');
const { getGoalPaths, getRunnerPaths } = require('../../goal/paths');
const { patchState, STATUS } = require('../../goal/state');

/**
 * 入口：bailu goal stop
 */
async function runGoalStop(options = {}) {
  const cwd = process.cwd();
  const paths = getGoalPaths(cwd);

  if (!(await fs.pathExists(paths.state))) {
    console.log(chalk.red('  ✘ 当前目录还没有 .goal/，无需 stop'));
    return;
  }

  const reason = options.reason || '用户通过 bailu goal stop 手动暂停';
  await patchState({ status: STATUS.BLOCKED, notes: reason }, cwd);

  // 追加 blockers.md
  const stamp = new Date().toISOString();
  const entry = `\n- [${stamp}] ${reason}\n`;
  await fs.appendFile(paths.blockers, entry);

  console.log(chalk.green('  ✔ 已写入 BLOCKED，runner 下次唤醒会跳过'));
  console.log(chalk.gray('  恢复方式：编辑 .goal/state.json.status = "RUNNABLE"，或处理 blockers.md'));
}

/**
 * 入口：bailu goal logs
 */
async function runGoalLogs(options = {}) {
  const runner = getRunnerPaths();
  const file = runner.runnerLog;

  if (!(await fs.pathExists(file))) {
    console.log(chalk.yellow(`  ⚠ 日志文件不存在：${file}`));
    console.log(chalk.gray('  跑一次 bailu goal run 后会自动生成。'));
    return;
  }

  if (options.follow) {
    console.log(chalk.gray(`  tail -f ${file}（Ctrl+C 退出）`));
    const child = spawn('tail', ['-f', file], { stdio: 'inherit' });
    process.on('SIGINT', () => child.kill('SIGINT'));
    return;
  }

  const lines = parseInt(options.lines, 10) || 80;
  const child = spawn('tail', [`-${lines}`, file], { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code || 0));
}

module.exports = { runGoalStop, runGoalLogs };
