/**
 * 工具安装命令
 *
 * 将白鹿工作流配置部署到 AI 工具
 * 使用 Installer 类确保与 `bailu install` 一致的安装行为
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const ora = require('ora');
const Table = require('cli-table3');
const boxen = require('boxen');
const { getAllTools, getInstalledToolKeys } = require('../config/tools');
const {
  findLocalWorkflow,
  loadManifest,
  getInstaller,
  warnUnsupportedComponents,
  recordInstallation
} = require('./install');

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
 * 安装指定工作流到指定工具
 * @param {string} workflowName - 工作流名称
 * @param {string} toolKey - 工具标识
 * @param {Object} toolConfig - 工具配置
 * @returns {Promise<{success: boolean, details: string}>}
 */
async function installWorkflowToTool(workflowName, toolKey, toolConfig) {
  const toolDir = toolConfig.getUserDir(os.homedir());

  // 查找工作流目录
  let workflowDir;
  try {
    workflowDir = await findLocalWorkflow(workflowName);
  } catch (error) {
    return { success: false, details: `查找失败: ${error.message}` };
  }

  if (!workflowDir) {
    return { success: false, details: '工作流目录未找到' };
  }

  // 加载 manifest
  let manifest;
  try {
    manifest = await loadManifest(workflowDir);
  } catch (error) {
    return { success: false, details: `manifest 加载失败: ${error.message}` };
  }

  // 获取安装器并执行安装
  try {
    const installer = getInstaller(toolKey);

    // 检查不支持的组件
    const unsupported = installer.getUnsupportedComponents(manifest.components || {});
    if (unsupported.length > 0) {
      warnUnsupportedComponents(installer.name, unsupported);
    }

    // 执行安装
    const result = await installer.installWorkflow(workflowDir, manifest);
    result.agent = toolKey;

    // 记录安装信息
    await recordInstallation(workflowName, manifest, result);

    return { success: true, details: `✅ ${summarizeResult(result)}` };
  } catch (error) {
    return { success: false, details: `安装失败: ${error.message}` };
  }
}

/**
 * 汇总安装结果
 * @param {Object} result - 安装结果
 * @returns {string} 汇总文本
 */
function summarizeResult(result) {
  const parts = [];
  const components = result.components || {};

  if (components.skills?.length > 0) {
    parts.push(`${components.skills.length} skills`);
  }
  if (components.agents?.length > 0) {
    parts.push(`${components.agents.length} agents`);
  }
  if (components.mcpServers?.length > 0) {
    parts.push(`${components.mcpServers.length} mcp`);
  }
  if (components.commands?.length > 0) {
    parts.push(`${components.commands.length} commands`);
  }
  if (components.rules?.length > 0) {
    parts.push(`${components.rules.length} rules`);
  }

  return parts.length > 0 ? parts.join(', ') : '无组件';
}

/**
 * 执行工具安装
 * @param {Array<string>} tools - 工具标识列表
 */
async function toolInstall(tools = []) {
  console.log('');
  console.log(chalk.cyan('🦌 白鹿工作流 - 工具安装'));
  console.log('');
  console.log(chalk.gray('💡 提示：`bailu tool install` 已弃用，推荐使用：'));
  console.log(chalk.gray('   bailu install           # 安装到所有工具'));
  console.log(chalk.gray('   bailu install qoder     # 安装到 Qoder'));
  console.log(chalk.gray('   bailu install dev --agent codex  # 一步完成拉取和部署'));
  console.log('');

  // 检查配置中心
  if (!await fs.pathExists(BAILU_HOME)) {
    console.error(chalk.red('❌ 错误：白鹿工作流配置中心不存在'));
    console.log('   请先运行：bailu init');
    process.exit(1);
  }

  // 获取已安装的工作流
  const installedWorkflows = await getInstalledWorkflows();
  const workflowNames = Object.keys(installedWorkflows);

  if (workflowNames.length === 0) {
    console.log(chalk.yellow('⚠️  未找到已安装的工作流'));
    console.log(chalk.gray('   请先运行：bailu install dev'));
    return;
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
      chalk.cyan('工作流'),
      chalk.cyan('工具'),
      chalk.cyan('结果')
    ],
    style: {
      head: [],
      border: ['gray']
    },
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤'
    }
  });

  for (const toolKey of tools) {
    const toolConfig = allTools[toolKey];

    if (!toolConfig) {
      table.push([
        chalk.gray('-'),
        chalk.white(toolKey),
        chalk.red('❌ 不支持')
      ]);
      failedCount++;
      continue;
    }

    const toolDir = toolConfig.getUserDir(os.homedir());
    if (!await fs.pathExists(toolDir)) {
      table.push([
        chalk.gray('-'),
        `${toolConfig.emoji} ${chalk.white(toolConfig.name)}`,
        chalk.yellow('⚠️  未检测到，跳过')
      ]);
      skippedCount++;
      continue;
    }

    // 对每个工作流安装到当前工具
    for (const workflowName of workflowNames) {
      const spinner = ora({
        text: `正在安装 ${workflowName} → ${toolConfig.name}...`,
        spinner: 'dots',
        color: 'cyan'
      }).start();

      const result = await installWorkflowToTool(workflowName, toolKey, toolConfig);

      if (result.success) {
        spinner.succeed(`${workflowName} → ${toolConfig.name}`);
        table.push([
          chalk.white(workflowName),
          `${toolConfig.emoji} ${chalk.white(toolConfig.name)}`,
          chalk.green(result.details)
        ]);
        installedCount++;
      } else {
        spinner.fail(`${workflowName} → ${toolConfig.name}`);
        table.push([
          chalk.white(workflowName),
          `${toolConfig.emoji} ${chalk.white(toolConfig.name)}`,
          chalk.red(result.details)
        ]);
        failedCount++;
      }
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
