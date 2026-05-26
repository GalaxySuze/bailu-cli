/**
 * 卸载命令
 * 
 * 从 AI 工具中卸载白鹿工作流配置
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ClaudeInstaller = require('../installer/claude');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

/**
 * 获取已安装的工作流信息
 * @param {string} workflowName - 工作流名称
 * @returns {Promise<Object|null>} 安装信息
 */
async function getInstalledWorkflow(workflowName) {
  const installedPath = path.join(BAILU_HOME, 'installed.json');
  
  if (!await fs.pathExists(installedPath)) {
    return null;
  }

  const installed = await fs.readJson(installedPath);
  return installed.workflows[workflowName] || null;
}

/**
 * 移除安装记录
 * @param {string} workflowName - 工作流名称
 */
async function removeInstallationRecord(workflowName) {
  const installedPath = path.join(BAILU_HOME, 'installed.json');
  
  if (!await fs.pathExists(installedPath)) {
    return;
  }

  const installed = await fs.readJson(installedPath);
  delete installed.workflows[workflowName];
  await fs.writeJson(installedPath, installed, { spaces: 2 });
}

/**
 * 获取安装器
 * @param {string} agent - AI 工具名称
 * @returns {Object} 安装器实例
 */
function getInstaller(agent) {
  switch (agent) {
    case 'claude':
      return new ClaudeInstaller();
    default:
      throw new Error(`不支持的 AI 工具: ${agent}`);
  }
}

/**
 * 执行卸载命令
 * @param {string} workflowName - 工作流名称
 * @param {Object} options - 选项
 */
async function uninstall(workflowName, options = {}) {
  const { clean = false } = options;

  console.log('');
  console.log(chalk.cyan('🦌 白鹿工作流 - 卸载'));
  console.log('');

  // 1. 检查是否已安装
  const installInfo = await getInstalledWorkflow(workflowName);
  
  if (!installInfo) {
    console.log(chalk.yellow(`工作流 ${workflowName} 未安装`));
    return;
  }

  console.log(chalk.white(`工作流: ${installInfo.displayName || workflowName}`));
  console.log(chalk.white(`版本: ${installInfo.version}`));
  console.log(chalk.white(`安装时间: ${new Date(installInfo.installed_at).toLocaleString()}`));
  console.log('');

  // 2. 确认卸载
  if (!clean) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `确定要卸载工作流 ${workflowName} 吗？`,
        default: false
      }
    ]);

    if (!confirm) {
      console.log(chalk.gray('已取消卸载'));
      return;
    }
  }

  // 3. 获取安装器
  const agent = installInfo.target_agent || 'claude';
  const installer = getInstaller(agent);

  // 4. 构建 manifest（从安装记录中恢复）
  const manifest = {
    name: workflowName,
    version: installInfo.version,
    displayName: installInfo.displayName,
    components: installInfo.components || {}
  };

  // 5. 执行卸载
  try {
    await installer.uninstallWorkflow(manifest);

    // 6. 移除安装记录
    await removeInstallationRecord(workflowName);

    console.log('');
    console.log(chalk.green(`✨ 工作流 ${workflowName} 卸载完成！`));
    console.log('');

  } catch (error) {
    console.error(chalk.red(`卸载失败: ${error.message}`));
  }
}

module.exports = uninstall;
