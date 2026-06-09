/**
 * @fileoverview bailu goal status
 *
 * 人类友好地展示当前 .goal/ 的核心信息：
 * - state.json 的 status + 关键字段
 * - progress.md 末尾 N 行
 * - blockers.md 是否非空
 * - Claude CLI 是否可用
 * - launchd 是否安装
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { execFileSync } = require('child_process');
const { getGoalPaths, getLaunchdPaths } = require('../../goal/paths');
const { readState, STATUS_LABEL } = require('../../goal/state');

/**
 * 安全地 tail 一个文本文件
 * @param {string} file
 * @param {number} lines
 * @returns {Promise<string>}
 */
async function tailFile(file, lines = 40) {
  if (!(await fs.pathExists(file))) return '';
  const content = await fs.readFile(file, 'utf8');
  const arr = content.split('\n');
  return arr.slice(Math.max(0, arr.length - lines)).join('\n');
}

/**
 * 检测 claude 是否可用
 * @returns {{available: boolean, version: string|null, bin: string}}
 */
function detectClaude() {
  const bin = process.env.CLAUDE_BIN || 'claude';
  try {
    const out = execFileSync(bin, ['--version'], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { available: true, version: out.trim(), bin };
  } catch (_e) {
    return { available: false, version: null, bin };
  }
}

/**
 * 检测 launchd 服务是否安装
 * @param {string} cwd
 * @returns {{installed: boolean, loaded: boolean, label: string, plistPath: string}}
 */
function detectLaunchd(cwd) {
  const { label, plistPath } = getLaunchdPaths(cwd);
  const installed = fs.existsSync(plistPath);
  let loaded = false;
  if (installed) {
    try {
      const out = execFileSync('launchctl', ['list'], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      loaded = out.includes(label);
    } catch (_e) {
      loaded = false;
    }
  }
  return { installed, loaded, label, plistPath };
}

/**
 * 入口：bailu goal status
 * @param {Object} options
 */
async function runGoalStatus(options = {}) {
  const cwd = process.cwd();
  const paths = getGoalPaths(cwd);

  if (!(await fs.pathExists(paths.dir))) {
    console.log(chalk.yellow('  ⚠ 当前目录还没有 .goal/，请先运行 bailu goal init'));
    if (options.json) {
      console.log(JSON.stringify({ initialized: false }, null, 2));
    }
    return;
  }

  const state = await readState(cwd);
  const claude = detectClaude();
  const launchd = detectLaunchd(cwd);
  const blockersContent = (await fs.pathExists(paths.blockers))
    ? (await fs.readFile(paths.blockers, 'utf8')).trim()
    : '';
  const hasBlockers = blockersContent
    .split('\n')
    .some((l) => {
      const t = l.trim();
      if (!t) return false;
      // 跳过注释 / 引用 / 标题 / HTML 注释
      if (t.startsWith('#')) return false;
      if (t.startsWith('>')) return false;
      if (t.startsWith('<!--')) return false;
      return true;
    });

  // JSON 输出（CI 友好）
  if (options.json) {
    console.log(
      JSON.stringify(
        {
          initialized: true,
          state,
          claude,
          launchd: { installed: launchd.installed, loaded: launchd.loaded, label: launchd.label },
          hasBlockers
        },
        null,
        2
      )
    );
    return;
  }

  // 人类视图
  console.log('');
  console.log(chalk.cyan('  白鹿 Goal · 状态总览'));
  console.log(chalk.gray('  ' + '─'.repeat(60)));

  if (!state) {
    console.log(chalk.yellow('  ⚠ .goal/state.json 缺失或不可读'));
    return;
  }

  const statusColor =
    state.status === 'COMPLETED' ? chalk.green
    : ['BLOCKED', 'FAILED_NEEDS_HUMAN'].includes(state.status) ? chalk.red
    : ['RUNNABLE', 'RUNNING', 'VERIFYING', 'REVIEW_NEEDED'].includes(state.status) ? chalk.cyan
    : chalk.yellow;

  console.log(`  状态        ${statusColor(state.status)}  ${chalk.gray(STATUS_LABEL[state.status] || '')}`);
  console.log(`  执行器      ${state.agent}`);
  console.log(`  轮次        ${state.round}`);
  console.log(`  连续失败    ${state.consecutiveFailures}`);
  console.log(`  上次验证    ${state.lastVerification}`);
  console.log(`  上次开始    ${state.lastStartedAt || '—'}`);
  console.log(`  上次结束    ${state.lastFinishedAt || '—'}`);
  console.log(`  更新时间    ${state.updatedAt || '—'}`);

  console.log('');
  console.log(chalk.cyan('  环境'));
  console.log(`  Claude CLI  ${claude.available ? chalk.green('✔ ' + claude.version) : chalk.red('✘ 未找到 (' + claude.bin + ')')}`);
  console.log(`  launchd     ${launchd.installed ? (launchd.loaded ? chalk.green('✔ 已安装且 loaded') : chalk.yellow('已安装但未 load')) : chalk.gray('未安装')}`);
  if (launchd.installed) {
    console.log(chalk.gray(`              label: ${launchd.label}`));
  }

  if (hasBlockers) {
    console.log('');
    console.log(chalk.red('  ⚠ 存在阻塞，请处理 .goal/blockers.md'));
  }

  console.log('');
  console.log(chalk.cyan('  最近进度（progress.md 末尾 40 行）'));
  console.log(chalk.gray('  ' + '─'.repeat(60)));
  const tail = await tailFile(paths.progress, 40);
  if (tail.trim()) {
    tail.split('\n').forEach((l) => console.log('  ' + chalk.gray(l)));
  } else {
    console.log(chalk.gray('  （空）'));
  }

  console.log('');
  console.log(chalk.cyan('  下一步建议：'));
  switch (state.status) {
    case 'INIT':
      console.log(chalk.cyan('    1. 编辑 .goal/current.md'));
      console.log(chalk.cyan('    2. bailu goal run  跑一轮验证'));
      break;
    case 'RUNNABLE':
      console.log(chalk.cyan('    bailu goal run                 手动跑一轮'));
      console.log(chalk.cyan('    bailu goal install-launchd     进入无人值守'));
      break;
    case 'BLOCKED':
    case 'FAILED_NEEDS_HUMAN':
      console.log(chalk.cyan('    1. 查看 .goal/blockers.md 与 .goal/progress.md'));
      console.log(chalk.cyan('    2. 处理后，把 .goal/state.json.status 改回 RUNNABLE'));
      break;
    case 'COMPLETED':
      console.log(chalk.green('    🎉 目标已完成，可以 commit 并卸载 launchd：'));
      console.log(chalk.cyan('    bailu goal uninstall-launchd'));
      break;
    default:
      console.log(chalk.cyan('    bailu goal logs                查看 runner 日志'));
  }
  console.log('');
}

module.exports = { runGoalStatus };
