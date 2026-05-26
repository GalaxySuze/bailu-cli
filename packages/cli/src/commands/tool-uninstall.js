/**
 * 工具卸载命令
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

// 支持的AI工具
const SUPPORTED_TOOLS = {
  claude: { name: 'Claude Code', dir: path.join(os.homedir(), '.claude') },
  codex: { name: 'Codex', dir: path.join(os.homedir(), '.codex') },
  qoder: { name: 'Qoder', dir: path.join(os.homedir(), '.qoder') },
  trae: { name: 'Trae', dir: path.join(os.homedir(), '.trae') },
  hermes: { name: 'Hermes', dir: path.join(os.homedir(), '.hermes') },
  openclaw: { name: 'Openclaw', dir: path.join(os.homedir(), '.openclaw') },
  cursor: { name: 'Cursor', dir: path.join(os.homedir(), '.cursor') },
  windsurf: { name: 'Windsurf', dir: path.join(os.homedir(), '.windsurf') }
};

/**
 * 从指定工具卸载
 */
async function uninstallFromTool(toolName) {
  const tool = SUPPORTED_TOOLS[toolName];
  if (!tool) {
    console.error(chalk.red(`不支持的工具：${toolName}`));
    return false;
  }

  if (!fs.existsSync(tool.dir)) {
    console.warn(chalk.yellow(`${tool.name} 未安装，跳过`));
    return false;
  }

  console.log(chalk.blue(`正在从 ${tool.name} 卸载...`));

  // 删除白鹿Skills
  const skillsDir = path.join(tool.dir, 'skills');
  if (fs.existsSync(skillsDir)) {
    const skills = fs.readdirSync(skillsDir);
    for (const skill of skills) {
      if (skill.startsWith('bailu-')) {
        fs.removeSync(path.join(skillsDir, skill));
      }
    }
  }

  // 删除白鹿Commands
  const commandsDir = path.join(tool.dir, 'commands');
  if (fs.existsSync(commandsDir)) {
    const commands = fs.readdirSync(commandsDir);
    for (const cmd of commands) {
      if (cmd.startsWith('bailu-')) {
        fs.removeSync(path.join(commandsDir, cmd));
      }
    }
  }

  console.log(chalk.green(`✓ 已从 ${tool.name} 卸载`));
  return true;
}

/**
 * 执行工具卸载
 */
async function toolUninstall(tools = []) {
  console.log(chalk.cyan('正在卸载白鹿工作流...'));
  console.log('');

  // 如果没有指定工具，从所有工具卸载
  if (tools.length === 0) {
    tools = Object.keys(SUPPORTED_TOOLS);
  }

  let uninstalledCount = 0;

  for (const tool of tools) {
    const result = await uninstallFromTool(tool);
    if (result) {
      uninstalledCount++;
    }
  }

  console.log('');
  console.log(chalk.green(`✓ 卸载完成！已卸载：${uninstalledCount}`));
  console.log('');
}

module.exports = toolUninstall;
