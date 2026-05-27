/**
 * 状态命令
 * 
 * 查看白鹿工作流已安装状态
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const chalk = require('chalk');
const Table = require('cli-table3');
const boxen = require('boxen');
const figlet = require('figlet');
const gradient = require('../utils/gradient');
const ClaudeInstaller = require('../installer/claude');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

/**
 * AI 工具配置
 */
const AI_TOOLS = {
  claude: {
    name: 'Claude Code',
    icon: '🤖',
    configDir: path.join(os.homedir(), '.claude')
  },
  hanako: {
    name: 'Hanako',
    icon: '🌸',
    configDir: path.join(os.homedir(), '.hanako')
  },
  codex: {
    name: 'Codex',
    icon: '🔮',
    configDir: path.join(os.homedir(), '.codex')
  }
};

/**
 * 获取已安装的工作流
 * @returns {Promise<Object>} 安装信息
 */
async function getInstalledWorkflows() {
  const installedPath = path.join(BAILU_HOME, 'installed.json');
  
  if (await fs.pathExists(installedPath)) {
    return await fs.readJson(installedPath);
  }

  return { workflows: {} };
}

/**
 * 检查工具是否已安装
 * @param {string} toolDir - 工具目录
 * @returns {boolean}
 */
function isToolInstalled(toolDir) {
  return fs.existsSync(toolDir);
}

/**
 * 统计已安装组件数量
 * @param {string} toolDir - 工具目录
 * @returns {Object} 统计信息
 */
function countInstalledComponents(toolDir) {
  const stats = {
    skills: 0,
    commands: 0,
    agents: 0,
    hooks: 0
  };

  try {
    // 统计 Skills
    const skillsDir = path.join(toolDir, 'skills');
    if (fs.existsSync(skillsDir)) {
      stats.skills = fs.readdirSync(skillsDir).length;
    }

    // 统计 Commands
    const commandsDir = path.join(toolDir, 'commands');
    if (fs.existsSync(commandsDir)) {
      stats.commands = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md')).length;
    }

    // 统计 Agents
    const agentsDir = path.join(toolDir, 'agents');
    if (fs.existsSync(agentsDir)) {
      stats.agents = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md')).length;
    }

    // 统计 Hooks
    const hooksDir = path.join(toolDir, 'hooks');
    if (fs.existsSync(hooksDir)) {
      stats.hooks = fs.readdirSync(hooksDir).filter(f => f.endsWith('.sh')).length;
    }
  } catch (error) {
    // 忽略错误
  }

  return stats;
}

/**
 * 显示工具状态
 */
function showToolsStatus() {
  console.log(chalk.yellow.bold('🔧 AI 工具状态'));
  console.log('');

  const table = new Table({
    head: [
      chalk.cyan('工具'),
      chalk.cyan('状态'),
      chalk.cyan('配置目录'),
      chalk.cyan('组件')
    ],
    style: { head: [], border: ['gray'] },
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤'
    }
  });

  for (const [key, tool] of Object.entries(AI_TOOLS)) {
    const isInstalled = isToolInstalled(tool.configDir);
    const status = isInstalled ? chalk.green('✅ 已安装') : chalk.red('❌ 未安装');
    const stats = isInstalled ? countInstalledComponents(tool.configDir) : null;
    const componentStr = stats
      ? chalk.gray(stats.skills + '个skill ' + stats.commands + '个cmd')
      : chalk.gray('-');
    
    table.push([
      `${tool.icon} ${chalk.white(tool.name)}`,
      status,
      chalk.gray(tool.configDir),
      componentStr
    ]);
  }

  console.log(table.toString());
  console.log('');
}

/**
 * 显示已安装工作流
 */
async function showInstalledWorkflows() {
  console.log(chalk.yellow.bold('📦 已安装工作流'));
  console.log('');

  const { workflows } = await getInstalledWorkflows();
  const workflowNames = Object.keys(workflows);

  if (workflowNames.length === 0) {
    console.log(chalk.gray('  暂无已安装的工作流'));
    console.log('');
    console.log(chalk.white('💡 安装工作流:'));
    console.log(chalk.cyan('  bailu install dev      # 安装开发工作流'));
    console.log(chalk.cyan('  bailu install base     # 安装基础配置'));
    console.log('');
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan('工作流'),
      chalk.cyan('版本'),
      chalk.cyan('目标工具'),
      chalk.cyan('安装时间'),
      chalk.cyan('组件')
    ],
    style: { head: [], border: ['gray'] },
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤'
    }
  });

  for (const [name, info] of Object.entries(workflows)) {
    const installedAt = new Date(info.installed_at).toLocaleDateString();
    
    const components = [];
    if (info.components?.skills?.length > 0) {
      components.push(`Skills:${info.components.skills.length}`);
    }
    if (info.components?.commands?.length > 0) {
      components.push(`Cmds:${info.components.commands.length}`);
    }
    if (info.components?.agents?.length > 0) {
      components.push(`Agents:${info.components.agents.length}`);
    }
    if (info.components?.rules?.length > 0) {
      components.push(`Rules:${info.components.rules.length}`);
    }

    table.push([
      chalk.white(info.displayName || name),
      chalk.gray(info.version),
      chalk.gray(info.target_agent || 'claude'),
      chalk.gray(installedAt),
      chalk.gray(components.join(' '))
    ]);
  }

  console.log(table.toString());
  console.log('');
}

/**
 * 显示组件详情
 */
async function showComponentDetails() {
  console.log(chalk.yellow.bold('📋 组件详情'));
  console.log('');

  const { workflows } = await getInstalledWorkflows();
  const workflowNames = Object.keys(workflows);

  if (workflowNames.length === 0) {
    console.log(chalk.gray('  暂无已安装的工作流'));
    console.log('');
    return;
  }

  const claudeDir = AI_TOOLS.claude.configDir;
  const stats = countInstalledComponents(claudeDir);

  const box = boxen(
    chalk.white(`Skills: ${chalk.cyan(stats.skills)} 个\n`) +
    chalk.white(`Commands: ${chalk.cyan(stats.commands)} 个\n`) +
    chalk.white(`Agents: ${chalk.cyan(stats.agents)} 个\n`) +
    chalk.white(`Hooks: ${chalk.cyan(stats.hooks)} 个`),
    {
      padding: { top: 0, bottom: 0, left: 2, right: 2 },
      margin: { top: 0, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'cyan',
      title: 'Claude Code 已安装组件',
      titleAlignment: 'center'
    }
  );

  console.log(box);
  console.log('');
}

/**
 * 显示常用命令
 */
function showCommands() {
  console.log(chalk.yellow.bold('💡 常用命令'));
  console.log('');
  console.log(chalk.white('  安装工作流:'));
  console.log(chalk.cyan('    bailu install <workflow>'));
  console.log(chalk.cyan('    bailu install dev --agent claude'));
  console.log('');
  console.log(chalk.white('  卸载工作流:'));
  console.log(chalk.cyan('    bailu uninstall <workflow>'));
  console.log('');
  console.log(chalk.white('  预览安装:'));
  console.log(chalk.cyan('    bailu install dev --dry-run'));
  console.log('');
}

/**
 * 执行状态查看
 */
async function status() {
  console.log('');
  // 显示 figlet Banner
  const banner = figlet.textSync('Bailu  CLI', { font: 'Small' });
  console.log(gradient.pastel.multiline(banner));
  console.log(chalk.cyan('  🦌 白鹿工作流 · 状态概览'));
  console.log('');

  // 1. 显示工具状态
  showToolsStatus();

  // 2. 显示已安装工作流
  await showInstalledWorkflows();

  // 3. 显示组件详情
  await showComponentDetails();

  // 4. 显示常用命令
  showCommands();
}

module.exports = status;
