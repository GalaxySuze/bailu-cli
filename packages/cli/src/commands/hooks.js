/**
 * Hooks 管理命令
 */

const chalk = require('chalk');
const Table = require('cli-table3');
const HooksManager = require('../hooks/manager');

const manager = new HooksManager();

/**
 * 列出 hooks
 */
async function list() {
  console.log('');
  console.log(chalk.cyan('🦌 白鹿工作流 - Hooks'));
  console.log('');

  const hooks = await manager.listHooks();

  if (hooks.length === 0) {
    console.log(chalk.gray('  暂无已安装的 hooks'));
    console.log('');
    console.log(chalk.white('💡 创建 hook:'));
    console.log(chalk.cyan('  bailu hooks create <name>'));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan('名称'),
      chalk.cyan('类型'),
      chalk.cyan('Git Hook'),
      chalk.cyan('大小'),
      chalk.cyan('修改时间')
    ],
    style: { head: [], border: ['gray'] },
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤'
    }
  });

  for (const hook of hooks) {
    table.push([
      chalk.white(hook.name),
      chalk.gray(hook.type),
      hook.isGitHook ? chalk.green('✅') : chalk.gray('⬜'),
      chalk.gray(`${hook.size} B`),
      chalk.gray(new Date(hook.modified).toLocaleDateString())
    ]);
  }

  console.log(table.toString());
  console.log('');
}

/**
 * 安装 hook 到项目
 * @param {string} hookName - hook 名称
 */
async function install(hookName) {
  console.log('');
  console.log(chalk.cyan(`🦌 安装 hook: ${hookName}`));
  console.log('');

  try {
    const result = await manager.installHookToProject(hookName);
    console.log(chalk.green(`✅ ${result.hook} 已安装到 ${result.path}`));
  } catch (error) {
    console.error(chalk.red(`❌ 安装失败: ${error.message}`));
  }

  console.log('');
}

/**
 * 卸载 hook
 * @param {string} hookName - hook 名称
 */
async function uninstall(hookName) {
  console.log('');
  console.log(chalk.cyan(`🦌 卸载 hook: ${hookName}`));
  console.log('');

  try {
    const result = await manager.uninstallHookFromProject(hookName);
    if (result.success) {
      console.log(chalk.green(`✅ ${result.hook} 已卸载`));
    } else {
      console.log(chalk.yellow(`⚠️  ${result.message}`));
    }
  } catch (error) {
    console.error(chalk.red(`❌ 卸载失败: ${error.message}`));
  }

  console.log('');
}

/**
 * 查看项目 hooks 状态
 */
async function status() {
  console.log('');
  console.log(chalk.cyan('🦌 项目 Hooks 状态'));
  console.log('');

  const status = await manager.getProjectHooksStatus();

  if (!status.isGitRepo) {
    console.log(chalk.yellow('⚠️  当前目录不是 Git 仓库'));
    console.log('');
    return;
  }

  console.log(chalk.white(`Git Hooks 目录: ${status.gitHooksDir}`));
  console.log('');

  if (status.hooks.length === 0) {
    console.log(chalk.gray('  暂无已安装的 hooks'));
  } else {
    const table = new Table({
      head: [
        chalk.cyan('名称'),
        chalk.cyan('可执行'),
        chalk.cyan('大小'),
        chalk.cyan('修改时间')
      ],
      style: { head: [], border: ['gray'] },
      chars: {
        'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
        'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
        'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
        'right': '│', 'right-mid': '┤'
      }
    });

    for (const hook of status.hooks) {
      table.push([
        chalk.white(hook.name),
        hook.isExecutable ? chalk.green('✅') : chalk.red('❌'),
        chalk.gray(`${hook.size} B`),
        chalk.gray(new Date(hook.modified).toLocaleDateString())
      ]);
    }

    console.log(table.toString());
  }

  console.log('');
}

module.exports = { list, install, uninstall, status };
