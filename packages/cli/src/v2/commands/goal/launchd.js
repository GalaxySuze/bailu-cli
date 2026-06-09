/**
 * @fileoverview bailu goal install-launchd / uninstall-launchd
 *
 * 安装：
 *  1. 把 goal-runner.sh 复制到 ~/.bailu-goal/
 *  2. 渲染 launchd.plist.template → ~/Library/LaunchAgents/<label>.plist
 *  3. launchctl load
 *
 * 卸载：
 *  1. launchctl unload
 *  2. 删 plist 文件
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const { execFileSync } = require('child_process');
const { confirm } = require('@inquirer/prompts');
const {
  getGoalPaths,
  getRunnerPaths,
  getLaunchdPaths,
  getAssetsGoalDir
} = require('../../goal/paths');

/**
 * XML 特殊字符转义（plist <string> 内容必须转义）
 * @param {string} value
 * @returns {string}
 */
function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 渲染 plist 模板
 * @param {Object} ctx
 * @returns {Promise<string>}
 */
async function renderPlist(ctx) {
  const src = path.join(getAssetsGoalDir(), 'launchd.plist.template');
  let tpl = await fs.readFile(src, 'utf8');
  Object.entries(ctx).forEach(([k, v]) => {
    // 所有占位值做 XML 转义（防止路径含 & < > 等字符破坏 plist）
    tpl = tpl.split(`__${k}__`).join(escapeXml(String(v)));
  });
  return tpl;
}

/**
 * 安装 launchd 服务
 * @param {Object} options
 */
async function runInstallLaunchd(options = {}) {
  const cwd = process.cwd();
  const paths = getGoalPaths(cwd);
  const runner = getRunnerPaths();
  const { label, plistPath } = getLaunchdPaths(cwd);

  if (!(await fs.pathExists(paths.dir))) {
    console.log(chalk.red('  ✘ 当前目录还没有 .goal/，请先运行 bailu goal init'));
    process.exit(1);
  }

  // 1. Claude CLI 必须可用（用 execFileSync 避免命令注入）
  const claudeBin = process.env.CLAUDE_BIN || 'claude';
  try {
    const { execFileSync } = require('child_process');
    execFileSync(claudeBin, ['--version'], { stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (_e) {
    console.log(chalk.red(`  ✘ Claude CLI 不可用：${claudeBin}`));
    console.log(chalk.gray('     请先安装 Claude Code（https://claude.ai/code），'));
    console.log(chalk.gray('     或通过 CLAUDE_BIN 环境变量指定可执行文件路径。'));
    process.exit(1);
  }

  // 2. 检测 /bailu-goal command/skill 是否已安装到 .claude/
  //    runner 默认 prompt 是 /bailu-goal，如果 Claude 不认识这个 slash 命令，
  //    无人值守会变成“Claude 反复被唤醒但不懂做什么”。
  const claudeDir = path.join(cwd, '.claude');
  const missingAssets = [];
  if (!(await fs.pathExists(path.join(claudeDir, 'commands', 'bailu-goal.md')))) {
    missingAssets.push('.claude/commands/bailu-goal.md');
  }
  if (!(await fs.pathExists(path.join(claudeDir, 'skills', 'bailu-goal', 'SKILL.md')))) {
    missingAssets.push('.claude/skills/bailu-goal/SKILL.md');
  }
  if (missingAssets.length > 0) {
    console.log(chalk.red('  ✘ Claude 侧 Goal 协议资产缺失：'));
    missingAssets.forEach((f) => console.log(chalk.red(`     · ${f}`)));
    console.log(chalk.gray('     请先运行 bailu init 安装 Claude 侧 command/skill。'));
    process.exit(1);
  }
  console.log(chalk.green('  ✔ /bailu-goal command/skill 已安装'));

  // 3. 风险确认
  console.log('');
  console.log(chalk.yellow('  ⚠ 即将安装无人值守 launchd 任务'));
  console.log(chalk.yellow('     · runner 将以 --dangerously-skip-permissions 调用 Claude'));
  console.log(chalk.yellow('     · Claude 拥有当前项目目录的读写权限'));
  console.log(chalk.yellow('     · 安全边界由 .goal/current.md 与 bailu-goal Skill 兜底'));
  console.log(chalk.yellow('     · runner 不会自动 git push / npm publish / git reset --hard'));
  console.log('');

  if (!options.yes && !options.dangerous) {
    const ok = await confirm({
      message: '我已经阅读并理解上述风险，继续安装？',
      default: false
    });
    if (!ok) {
      console.log(chalk.gray('  已取消'));
      return;
    }
  }

  // 4. 准备 runner.sh
  await fs.ensureDir(runner.home);
  const runnerSrc = path.join(getAssetsGoalDir(), 'goal-runner.sh');
  await fs.copy(runnerSrc, runner.runnerSh, { overwrite: true });
  await fs.chmod(runner.runnerSh, 0o755);
  console.log(chalk.green(`  ✔ runner 脚本：${runner.runnerSh}`));

  // 5. 渲染 plist
  const interval = parseInt(options.interval, 10) || 1800;
  const plist = await renderPlist({
    LABEL: label,
    RUNNER_SH: runner.runnerSh,
    PROJECT_DIR: cwd,
    INTERVAL_SECONDS: interval,
    CLAUDE_BIN: claudeBin,
    LOG_DIR: runner.home,
    USER_PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
    HOME: os.homedir()
  });
  await fs.ensureDir(path.dirname(plistPath));
  await fs.writeFile(plistPath, plist, 'utf8');
  console.log(chalk.green(`  ✔ plist：${plistPath}`));

  // 6. launchctl load
  // 如果之前已加载，先 unload 一次避免报错
  try {
    execFileSync('launchctl', ['unload', plistPath], { stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (_e) {
    /* 之前未加载，正常 */
  }
  try {
    execFileSync('launchctl', ['load', '-w', plistPath], { stdio: 'inherit' });
    console.log(chalk.green(`  ✔ launchctl loaded: ${label}`));
  } catch (err) {
    console.log(chalk.red(`  ✘ launchctl load 失败：${err.message}`));
    process.exit(1);
  }

  console.log('');
  console.log(chalk.cyan('  无人值守已启动'));
  console.log(chalk.gray(`    唤醒间隔：${interval} 秒`));
  console.log(chalk.gray(`    日志：${runner.runnerLog}`));
  console.log('');
  console.log(chalk.cyan('  常用命令：'));
  console.log(chalk.cyan('    bailu goal status              查看状态'));
  console.log(chalk.cyan('    bailu goal logs                tail runner 日志'));
  console.log(chalk.cyan('    bailu goal stop                软暂停（写 BLOCKED）'));
  console.log(chalk.cyan('    bailu goal uninstall-launchd   彻底卸载'));
  console.log('');
}

/**
 * 卸载 launchd 服务
 * @param {Object} options
 */
async function runUninstallLaunchd(options = {}) {
  const cwd = process.cwd();
  const { label, plistPath } = getLaunchdPaths(cwd);

  if (!(await fs.pathExists(plistPath))) {
    console.log(chalk.gray(`  · 未发现 plist：${plistPath}`));
    return;
  }

  try {
    execFileSync('launchctl', ['unload', plistPath], { stdio: 'inherit' });
    console.log(chalk.green(`  ✔ launchctl unloaded: ${label}`));
  } catch (err) {
    console.log(chalk.yellow(`  ⚠ launchctl unload 报错（可能未加载）：${err.message}`));
  }

  await fs.remove(plistPath);
  console.log(chalk.green(`  ✔ 删除 plist：${plistPath}`));
}

module.exports = { runInstallLaunchd, runUninstallLaunchd, escapeXml };
