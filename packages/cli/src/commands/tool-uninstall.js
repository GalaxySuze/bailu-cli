/**
 * 工具卸载命令
 *
 * 从 AI 工具中卸载白鹿工作流配置
 * 基于 installed.json 中记录的组件信息，调用对应安装器的卸载方法
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const ora = require('ora');
const Table = require('cli-table3');
const boxen = require('boxen');
const { getAllTools, getInstalledToolKeys } = require('../config/tools');
const { getInstaller } = require('./install');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

/**
 * 获取已安装的工作流列表
 * @returns {Promise<Object>} 工作流映射 { name: info }
 */
async function getInstalledWorkflows() {
  const installedPath = path.join(BAILU_HOME, 'installed.json');

  if (!await fs.pathExists(installedPath)) {
    return {};
  }

  try {
    const data = await fs.readJson(installedPath);
    return data.workflows || {};
  } catch {
    return {};
  }
}

/**
 * 从指定工具卸载所有已安装的工作流
 * @param {string} toolKey - 工具标识
 * @param {Object} toolConfig - 工具配置
 * @param {Object} installedWorkflows - 已安装工作流映射
 * @returns {Promise<boolean>}
 */
async function uninstallFromTool(toolKey, toolConfig, installedWorkflows) {
  const spinner = ora({
    text: `正在从 ${toolConfig.name} 卸载...`,
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    const installer = getInstaller(toolKey);

    for (const [workflowName, installInfo] of Object.entries(installedWorkflows)) {
      // 构造 manifest 对象，只包含已安装到该工具的工作流
      const agents = installInfo.target_agents ||
        (installInfo.target_agent ? [installInfo.target_agent] : []);

      // 跳过未安装到此工具的工作流
      if (agents.length > 0 && !agents.includes(toolKey)) {
        continue;
      }

      const manifest = {
        name: workflowName,
        version: installInfo.version,
        displayName: installInfo.displayName,
        components: installInfo.components || {}
      };

      try {
        await installer.uninstallWorkflow(manifest);
      } catch (error) {
        console.error(chalk.gray(`   ${workflowName} 卸载失败: ${error.message}`));
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

  // 获取已安装的工作流，用于卸载
  const installedWorkflows = await getInstalledWorkflows();

  if (Object.keys(installedWorkflows).length === 0) {
    console.log(chalk.yellow('⚠️  没有已安装的工作流，无需卸载'));
    console.log('');
    return;
  }

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

    const result = await uninstallFromTool(toolKey, toolConfig, installedWorkflows);
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
