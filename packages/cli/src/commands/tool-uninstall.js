/**
 * 工具卸载命令
 *
 * 从 AI 工具中卸载白鹿工作流配置
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const ora = require('ora');
const Table = require('cli-table3');
const boxen = require('boxen');
const { getAllTools, getInstalledToolKeys, isToolInstalled } = require('../config/tools');

/**
 * 从指定工具卸载白鹿工作流
 * @param {string} toolKey - 工具标识
 * @param {Object} toolConfig - 工具配置
 * @returns {Promise<boolean>}
 */
async function uninstallFromTool(toolKey, toolConfig) {
  const toolDir = toolConfig.getUserDir(os.homedir());
  const compConfig = toolConfig.components || {};

  const spinner = ora({
    text: `正在从 ${toolConfig.name} 卸载...`,
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    for (const [compName, compInfo] of Object.entries(compConfig)) {
      if (!compInfo.supported) continue;

      const targetDir = path.join(toolDir, compInfo.dir || compName);
      if (!await fs.pathExists(targetDir)) continue;

      const files = await fs.readdir(targetDir);
      for (const file of files) {
        if (file.startsWith('bailu-')) {
          const filePath = path.join(targetDir, file);
          const stat = await fs.stat(filePath);
          if (stat.isDirectory()) {
            await fs.remove(filePath);
          } else {
            await fs.remove(filePath);
          }
        }
      }
    }

    spinner.succeed(`已从 ${toolConfig.name} 卸载`);
    return true;
  } catch (error) {
    spinner.fail(`从 ${toolConfig.name} 卸载失败：${error.message}`);
    return false;
  }
}

/**
 * 执行工具卸载
 * @param {Array<string>} tools - 工具标识列表
 */
async function toolUninstall(tools = []) {
  console.log('');
  console.log(chalk.cyan('🦌 白鹿工作流 - 工具卸载'));
  console.log('');

  const allTools = getAllTools();

  // 如果没有指定工具，卸载所有已检测的工具
  if (tools.length === 0) {
    tools = getInstalledToolKeys();
  }

  let uninstalledCount = 0;
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
    if (!fs.existsSync(toolDir)) {
      table.push([
        `${toolConfig.emoji} ${chalk.white(toolConfig.name)}`,
        chalk.yellow('⚠️  未检测到'),
        chalk.gray('跳过')
      ]);
      skippedCount++;
      continue;
    }

    const result = await uninstallFromTool(toolKey, toolConfig);
    if (result) {
      table.push([
        `${toolConfig.emoji} ${chalk.white(toolConfig.name)}`,
        chalk.green('✅ 已卸载'),
        chalk.gray(toolDir)
      ]);
      uninstalledCount++;
    } else {
      table.push([
        `${toolConfig.emoji} ${chalk.white(toolConfig.name)}`,
        chalk.red('❌ 失败'),
        chalk.gray('卸载失败')
      ]);
      failedCount++;
    }
  }

  console.log(table.toString());
  console.log('');

  // 统计信息
  const statsBox = boxen(
    chalk.white(`卸载完成！\n\n`) +
    chalk.green(`✅ 已卸载：${uninstalledCount}\n`) +
    chalk.yellow(`⚠️  跳过：${skippedCount}\n`) +
    chalk.red(`❌ 失败：${failedCount}`),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: uninstalledCount > 0 ? 'green' : 'yellow',
      title: '📊 卸载统计',
      titleAlignment: 'center'
    }
  );
  console.log(statsBox);
  console.log('');
}

module.exports = toolUninstall;
