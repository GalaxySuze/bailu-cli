/**
 * 工具安装命令
 *
 * 将白鹿工作流配置同步到 AI 工具
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const ora = require('ora');
const Table = require('cli-table3');
const boxen = require('boxen');
const { getAllTools, getInstalledToolKeys, isToolInstalled } = require('../config/tools');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

/**
 * 检测工具是否已安装
 * @param {string} toolDir - 工具配置目录
 * @returns {boolean}
 */
function toolDirExists(toolDir) {
  return fs.existsSync(toolDir);
}

/**
 * 安装工作流到指定工具（扩展支持完整组件）
 * @param {string} toolKey - 工具标识
 * @param {Object} toolConfig - 工具配置
 * @returns {Promise<boolean>}
 */
async function installToTool(toolKey, toolConfig) {
  const toolDir = toolConfig.getUserDir(os.homedir());
  const compConfig = toolConfig.components || {};

  const spinner = ora({
    text: `正在安装到 ${toolConfig.name}...`,
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    // 复制已安装的工作流配置
    const workflowsDir = path.join(BAILU_HOME, 'config', 'workflows');
    if (await fs.pathExists(workflowsDir)) {
      const workflows = await fs.readdir(workflowsDir);

      for (const workflow of workflows) {
        const workflowDir = path.join(workflowsDir, workflow);
        const stat = await fs.stat(workflowDir);

        if (stat.isDirectory()) {
          // 遍历所有支持的组件
          for (const [compName, compInfo] of Object.entries(compConfig)) {
            if (!compInfo.supported) continue;

            const sourceDir = path.join(workflowDir, compName);
            if (!await fs.pathExists(sourceDir)) continue;

            const targetDir = path.join(toolDir, compInfo.dir || compName);
            await fs.ensureDir(targetDir);
            await fs.copy(sourceDir, targetDir, { overwrite: true });
          }
        }
      }
    }

    spinner.succeed(`已安装到 ${toolConfig.name}`);
    return true;
  } catch (error) {
    spinner.fail(`安装到 ${toolConfig.name} 失败：${error.message}`);
    return false;
  }
}

/**
 * 执行工具安装
 * @param {Array<string>} tools - 工具标识列表
 */
async function toolInstall(tools = []) {
  console.log('');
  console.log(chalk.cyan('🦌 白鹿工作流 - 工具安装'));
  console.log('');

  // 检查配置中心
  if (!await fs.pathExists(BAILU_HOME)) {
    console.error(chalk.red('❌ 错误：白鹿工作流配置中心不存在'));
    console.log('   请先运行：bailu init');
    process.exit(1);
  }

  const allTools = getAllTools();

  // 如果没有指定工具，安装到所有已检测的工具
  if (tools.length === 0) {
    tools = getInstalledToolKeys();
  }

  let installedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  // 创建结果表格
  const table = new Table({
    head: [
      chalk.cyan('工具'),
      chalk.cyan('状态'),
      chalk.cyan('结果')
    ],
    style: {
      head: [],
      border: ['gray']
    },
    chars: {
      'top': '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      'bottom': '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      'left': '│',
      'left-mid': '├',
      'mid': '─',
      'mid-mid': '┼',
      'right': '│',
      'right-mid': '┤'
    }
  });

  for (const toolKey of tools) {
    const toolConfig = allTools[toolKey];
    if (!toolConfig) {
      table.push([
        chalk.white(toolKey),
        chalk.red('❌ 不支持'),
        chalk.gray('未知工具')
      ]);
      failedCount++;
      continue;
    }

    const toolDir = toolConfig.getUserDir(os.homedir());
    if (!toolDirExists(toolDir)) {
      table.push([
        `${toolConfig.emoji} ${chalk.white(toolConfig.name)}`,
        chalk.yellow('⚠️  未检测到'),
        chalk.gray('跳过')
      ]);
      skippedCount++;
      continue;
    }

    const result = await installToTool(toolKey, toolConfig);
    if (result) {
      table.push([
        `${toolConfig.emoji} ${chalk.white(toolConfig.name)}`,
        chalk.green('✅ 已安装'),
        chalk.gray(toolDir)
      ]);
      installedCount++;
    } else {
      table.push([
        `${toolConfig.emoji} ${chalk.white(toolConfig.name)}`,
        chalk.red('❌ 失败'),
        chalk.gray('安装失败')
      ]);
      failedCount++;
    }
  }

  console.log(table.toString());
  console.log('');

  // 统计信息
  const statsBox = boxen(
    chalk.white(`安装完成！\n\n`) +
    chalk.green(`✅ 已安装：${installedCount}\n`) +
    chalk.yellow(`⚠️  跳过：${skippedCount}\n`) +
    chalk.red(`❌ 失败：${failedCount}`),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: installedCount > 0 ? 'green' : 'yellow',
      title: '📊 安装统计',
      titleAlignment: 'center'
    }
  );
  console.log(statsBox);
  console.log('');
}

module.exports = toolInstall;
