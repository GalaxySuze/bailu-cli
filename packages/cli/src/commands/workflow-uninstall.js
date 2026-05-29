/**
 * 工作流卸载命令
 *
 * 从 AI 工具中卸载指定的工作流，并删除本地缓存和安装记录
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const inquirer = require('inquirer');
const ora = require('ora');
const boxen = require('boxen');
const gradient = require('../utils/gradient');
const { getInstaller } = require('./install');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

/**
 * 更新已安装工作流记录
 *
 * 核心逻辑：只从 target_agents 数组中移除指定的工具，
 * 保留其他工具的安装记录。只有当 target_agents 为空时才删除整个工作流记录。
 *
 * @param {string} workflowName - 工作流名称
 * @param {string} agent - 要卸载的工具标识（如 'claudecode', 'qoder'），或 'all' 表示卸载所有
 */
async function removeInstalledRecord(workflowName, agent) {
  const installedPath = path.join(BAILU_HOME, 'installed.json');

  if (await fs.pathExists(installedPath)) {
    const installed = await fs.readJson(installedPath);

    // 获取当前工作流的安装信息
    const workflowInfo = installed.workflows[workflowName];
    if (!workflowInfo) {
      return; // 工作流不存在，无需操作
    }

    // 如果 agent 为 'all'，删除整个工作流记录
    if (agent === 'all') {
      delete installed.workflows[workflowName];
      await fs.writeJson(installedPath, installed, { spaces: 2 });
      return;
    }

    // 获取 target_agents 数组（兼容旧格式 target_agent 字段）
    let targetAgents = workflowInfo.target_agents || [];
    if (workflowInfo.target_agent && !targetAgents.includes(workflowInfo.target_agent)) {
      targetAgents.push(workflowInfo.target_agent);
    }

    // 从数组中移除指定的 agent
    targetAgents = targetAgents.filter(a => a !== agent);

    // 清理旧的 target_agent 字段（如果存在）
    delete workflowInfo.target_agent;

    if (targetAgents.length === 0) {
      // 如果没有剩余的安装目标，删除整个工作流记录
      delete installed.workflows[workflowName];
    } else {
      // 否则只更新 target_agents 数组
      workflowInfo.target_agents = targetAgents;
    }

    await fs.writeJson(installedPath, installed, { spaces: 2 });
  }
}

/**
 * 删除工作流本地缓存
 * @param {string} workflowName - 工作流名称
 */
async function removeWorkflowCache(workflowName) {
  const cacheDir = path.join(BAILU_HOME, 'workflows', workflowName);

  if (await fs.pathExists(cacheDir)) {
    await fs.remove(cacheDir);
    console.log(chalk.green('   ✓ 工作流缓存已删除'));
  }
}

/**
 * 从 AI 工具中卸载工作流文件
 *
 * 如果指定了 agent，只从该工具卸载；否则从所有已安装的工具卸载。
 *
 * @param {string} workflowName - 工作流名称
 * @param {Object} installInfo - 安装信息（来自 installed.json）
 * @param {string} [agent] - 指定要卸载的工具标识（可选）
 * @returns {Promise<Array<string>>} 已卸载的工具列表
 */
async function uninstallFromTools(workflowName, installInfo, agent) {
  // 兼容旧字段 target_agent 和新字段 target_agents
  const agents = installInfo.target_agents ||
    (installInfo.target_agent ? [installInfo.target_agent] : ['claudecode']);

  // 如果指定了 agent，只卸载该工具；否则卸载所有工具
  const agentsToUninstall = agent ? [agent] : agents;

  const uninstalledAgents = [];

  for (const currentAgent of agentsToUninstall) {
    try {
      const installer = getInstaller(currentAgent);

      const manifest = {
        name: workflowName,
        version: installInfo.version,
        displayName: installInfo.displayName,
        components: installInfo.components || {}
      };

      await installer.uninstallWorkflow(manifest);
      uninstalledAgents.push(currentAgent);
    } catch (error) {
      console.error(chalk.red(`   ✗ ${currentAgent} 卸载失败: ${error.message}`));
    }
  }

  return uninstalledAgents;
}

/**
 * 执行工作流卸载
 *
 * 支持两种模式：
 * 1. 只卸载指定工具：bailu uninstall dev --agent qoder
 * 2. 卸载所有工具：bailu uninstall dev
 *
 * @param {string} name - 工作流名称
 * @param {Object} options - 选项
 * @param {string} [options.agent] - 指定要卸载的工具标识（可选）
 * @param {boolean} [options.clean=false] - 是否跳过确认
 */
async function workflowUninstall(name, options = {}) {
  const { clean = false, agent } = options;

  console.log('');
  console.log(gradient.cristal('  🦌 白鹿工作流 — 卸载工作流'));
  console.log('');

  try {
    // 检查配置中心是否存在
    if (!await fs.pathExists(BAILU_HOME)) {
      console.error(chalk.red('❌ 错误：白鹿工作流配置中心不存在'));
      return;
    }

    // 检查工作流是否已安装
    const installedPath = path.join(BAILU_HOME, 'installed.json');
    let installInfo = null;

    if (await fs.pathExists(installedPath)) {
      const installed = await fs.readJson(installedPath);
      installInfo = installed.workflows[name];
    }

    if (!installInfo) {
      console.log(chalk.yellow(`⚠️  工作流 "${name}" 未安装`));
      return;
    }

    // 显示工作流信息
    console.log(chalk.white(`工作流: ${installInfo.displayName || name}`));
    console.log(chalk.white(`版本: ${installInfo.version}`));
    console.log(chalk.white(`安装时间: ${new Date(installInfo.installed_at).toLocaleString()}`));

    // 兼容旧字段 target_agent 和新字段 target_agents
    const agents = installInfo.target_agents ||
      (installInfo.target_agent ? [installInfo.target_agent] : ['claudecode']);

    // 如果指定了 agent，显示将卸载的特定工具；否则显示所有工具
    const displayAgents = agent ? [agent] : agents;
    console.log(chalk.white(`将卸载的工具: ${displayAgents.join(', ')}`));
    console.log('');

    // 确认卸载
    if (!clean) {
      const confirmMessage = agent
        ? `确定要从 "${agent}" 卸载工作流 "${name}" 吗？`
        : `确定要卸载工作流 "${name}" 吗？将从所有 AI 工具中移除。`;

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: confirmMessage,
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.gray('已取消卸载'));
        return;
      }
    }

    // 1. 从 AI 工具中卸载
    const uninstalledAgents = await uninstallFromTools(name, installInfo, agent);

    // 2. 删除本地缓存（仅当卸载所有工具时才删除）
    if (!agent) {
      await removeWorkflowCache(name);
    }

    // 3. 移除安装记录（按工具移除）
    await removeInstalledRecord(name, agent || 'all');

    console.log('');
    console.log(boxen(
      chalk.white(`工作流 ${chalk.cyan(name)} 已成功卸载\n\n`) +
      chalk.gray(`原版本: ${installInfo.version}\n`) +
      chalk.gray(`已清理工具: ${uninstalledAgents.join(', ')}`),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
        title: '✅ 卸载完成',
        titleAlignment: 'center'
      }
    ));
    console.log('');

  } catch (error) {
    console.error(chalk.red('❌ 卸载失败：'), error.message);
  }
}

module.exports = workflowUninstall;
