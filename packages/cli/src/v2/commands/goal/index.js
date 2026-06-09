/**
 * @fileoverview bailu goal 子命令注册器
 *
 * 把 init / status / run / install-launchd / uninstall-launchd / stop / logs
 * 挂到 commander 的 program 上。由 v2/index.js 在 registerCommands 里调用。
 */

const { runGoalInit } = require('./init');
const { runGoalStatus } = require('./status');
const { runGoalRun } = require('./run');
const { runInstallLaunchd, runUninstallLaunchd } = require('./launchd');
const { runGoalStop, runGoalLogs } = require('./stop-logs');

/**
 * 注册 goal 子命令
 * @param {import('commander').Command} program  顶层 commander 实例
 */
function registerGoalCommands(program) {
  const goal = program
    .command('goal')
    .description('白鹿无人值守 Goal 协议（本地 .goal/ + launchd + Claude）');

  goal
    .command('init')
    .description('在当前项目创建 .goal/ 骨架')
    .option('--force', '覆盖现有文件')
    .option('--yes', '跳过所有确认')
    .action(async (cmdOptions) => {
      const opts = { ...program.opts(), ...cmdOptions };
      await runGoalInit(opts);
    });

  goal
    .command('status')
    .description('查看 .goal/ 当前状态、环境、最近进度')
    .action(async (cmdOptions) => {
      const opts = { ...program.opts(), ...cmdOptions };
      await runGoalStatus(opts);
    });

  goal
    .command('run')
    .description('手动执行一轮 Goal 协议（走完整 runner 决策链）')
    .option('--dry-run', '不真正调用 Claude，仅打印决策')
    .option('--timeout <seconds>', '单次执行超时，秒')
    .action(async (cmdOptions) => {
      const opts = { ...program.opts(), ...cmdOptions };
      await runGoalRun(opts);
    });

  goal
    .command('install-launchd')
    .description('安装 launchd 任务，进入无人值守')
    .option('--interval <seconds>', '唤醒间隔秒数，默认 1800', '1800')
    .option('--yes', '跳过风险确认')
    .option('--dangerous', '等同于 --yes，显式承认风险')
    .action(async (cmdOptions) => {
      const opts = { ...program.opts(), ...cmdOptions };
      await runInstallLaunchd(opts);
    });

  goal
    .command('uninstall-launchd')
    .description('卸载 launchd 任务')
    .action(async (cmdOptions) => {
      const opts = { ...program.opts(), ...cmdOptions };
      await runUninstallLaunchd(opts);
    });

  goal
    .command('stop')
    .description('软暂停：把 status 写为 BLOCKED，runner 下次唤醒会跳过')
    .option('--reason <text>', '暂停原因，会追加到 .goal/blockers.md')
    .action(async (cmdOptions) => {
      const opts = { ...program.opts(), ...cmdOptions };
      await runGoalStop(opts);
    });

  goal
    .command('logs')
    .description('查看 runner 日志')
    .option('-f, --follow', '实时跟随（tail -f）')
    .option('-n, --lines <n>', '末尾行数，默认 80', '80')
    .action(async (cmdOptions) => {
      const opts = { ...program.opts(), ...cmdOptions };
      await runGoalLogs(opts);
    });

  return goal;
}

module.exports = { registerGoalCommands };
