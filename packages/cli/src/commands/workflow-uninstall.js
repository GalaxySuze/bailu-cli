/**
 * 工作流卸载命令
 * 
 * 卸载指定的工作流
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

/**
 * 更新已安装工作流记录
 */
async function removeInstalledRecord(workflowName) {
  const installedPath = path.join(BAILU_HOME, 'installed.json');

  if (await fs.pathExists(installedPath)) {
    const installed = await fs.readJson(installedPath);
    delete installed.workflows[workflowName];
    await fs.writeJson(installedPath, installed, { spaces: 2 });
  }
}

/**
 * 删除工作流配置
 */
async function removeWorkflowConfig(workflowName) {
  const workflowDir = path.join(BAILU_HOME, 'config', 'workflows', workflowName);

  if (await fs.pathExists(workflowDir)) {
    await fs.remove(workflowDir);
    console.log(chalk.green('✓ 工作流配置已删除'));
  }
}

/**
 * 执行工作流卸载
 */
async function workflowUninstall(name) {
  console.log(chalk.cyan(`正在卸载工作流：${name}`));
  console.log('');

  try {
    // 检查配置中心是否存在
    if (!await fs.pathExists(BAILU_HOME)) {
      console.error(chalk.red('错误：白鹿工作流配置中心不存在'));
      process.exit(1);
    }

    // 检查工作流是否已安装
    const installedPath = path.join(BAILU_HOME, 'installed.json');
    if (await fs.pathExists(installedPath)) {
      const installed = await fs.readJson(installedPath);
      if (!installed.workflows[name]) {
        console.warn(chalk.yellow(`工作流 "${name}" 未安装`));
        process.exit(0);
      }
    }

    // 删除配置
    await removeWorkflowConfig(name);

    // 更新记录
    await removeInstalledRecord(name);

    console.log('');
    console.log(chalk.green(`✓ 工作流 "${name}" 卸载成功！`));
    console.log('');

  } catch (error) {
    console.error(chalk.red('卸载失败：'), error.message);
    process.exit(1);
  }
}

module.exports = workflowUninstall;
