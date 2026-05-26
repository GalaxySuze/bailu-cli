/**
 * 工具安装命令（美化版）
 * 
 * 安装白鹿工作流到AI工具
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const ora = require('ora');
const Table = require('cli-table3');
const boxen = require('boxen');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

// 支持的AI工具（跨平台）
function getSupportedTools() {
  const home = os.homedir();
  const platform = os.platform();
  
  const getDir = (name) => {
    if (platform === 'win32') {
      return path.join(home, 'AppData', 'Roaming', name);
    }
    return path.join(home, `.${name}`);
  };

  return {
    claude: { name: 'Claude Code', dir: getDir('claude'), emoji: '🤖' },
    codex: { name: 'Codex', dir: getDir('codex'), emoji: '📝' },
    qoder: { name: 'Qoder', dir: getDir('qoder'), emoji: '🔍' },
    trae: { name: 'Trae', dir: getDir('trae'), emoji: '🎯' },
    hermes: { name: 'Hermes', dir: getDir('hermes'), emoji: '⚡' },
    openclaw: { name: 'Openclaw', dir: getDir('openclaw'), emoji: '🐾' },
    cursor: { name: 'Cursor', dir: getDir('cursor'), emoji: '🖱️' },
    windsurf: { name: 'Windsurf', dir: getDir('windsurf'), emoji: '🏄' }
  };
}

/**
 * 检测工具是否已安装
 */
function isToolInstalled(toolDir) {
  return fs.existsSync(toolDir);
}

/**
 * 安装工作流到指定工具
 */
async function installToTool(toolName, tool) {
  const spinner = ora({
    text: `正在安装到 ${tool.name}...`,
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    // 创建目录
    await fs.ensureDir(path.join(tool.dir, 'skills'));
    await fs.ensureDir(path.join(tool.dir, 'commands'));

    // 复制已安装的工作流配置
    const workflowsDir = path.join(BAILU_HOME, 'config', 'workflows');
    if (await fs.pathExists(workflowsDir)) {
      const workflows = await fs.readdir(workflowsDir);
      
      for (const workflow of workflows) {
        const workflowDir = path.join(workflowsDir, workflow);
        const stat = await fs.stat(workflowDir);
        
        if (stat.isDirectory()) {
          // 复制skills
          const skillsDir = path.join(workflowDir, 'skills');
          if (await fs.pathExists(skillsDir)) {
            await fs.copy(skillsDir, path.join(tool.dir, 'skills'), { overwrite: true });
          }

          // 复制commands
          const commandsDir = path.join(workflowDir, 'commands');
          if (await fs.pathExists(commandsDir)) {
            await fs.copy(commandsDir, path.join(tool.dir, 'commands'), { overwrite: true });
          }
        }
      }
    }

    spinner.succeed(`已安装到 ${tool.name}`);
    return true;
  } catch (error) {
    spinner.fail(`安装到 ${tool.name} 失败：${error.message}`);
    return false;
  }
}

/**
 * 执行工具安装
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

  const supportedTools = getSupportedTools();

  // 如果没有指定工具，安装到所有已检测的工具
  if (tools.length === 0) {
    tools = Object.keys(supportedTools);
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

  for (const toolName of tools) {
    const tool = supportedTools[toolName];
    if (!tool) {
      table.push([
        chalk.white(toolName),
        chalk.red('❌ 不支持'),
        chalk.gray('未知工具')
      ]);
      failedCount++;
      continue;
    }

    if (!isToolInstalled(tool.dir)) {
      table.push([
        `${tool.emoji} ${chalk.white(tool.name)}`,
        chalk.yellow('⚠️  未检测到'),
        chalk.gray('跳过')
      ]);
      skippedCount++;
      continue;
    }

    const result = await installToTool(toolName, tool);
    if (result) {
      table.push([
        `${tool.emoji} ${chalk.white(tool.name)}`,
        chalk.green('✅ 已安装'),
        chalk.gray(tool.dir)
      ]);
      installedCount++;
    } else {
      table.push([
        `${tool.emoji} ${chalk.white(tool.name)}`,
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
