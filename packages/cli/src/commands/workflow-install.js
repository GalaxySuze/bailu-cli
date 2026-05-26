/**
 * 工作流安装命令
 * 
 * 安装指定的工作流到配置中心
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const ora = require('ora');
const boxen = require('boxen');
const { execSync } = require('child_process');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

// 内置工作流列表
const BUILTIN_WORKFLOWS = {
  dev: {
    name: '开发工作流',
    package: '@vickzhang/bailu-workflow-dev',
    description: '适用于团队开发'
  },
  ops: {
    name: '运营工作流',
    package: '@vickzhang/bailu-workflow-ops',
    description: '适用于个人运营'
  },
  base: {
    name: '基础配置',
    package: '@vickzhang/bailu-workflow-base',
    description: '基础工作流配置'
  }
};

/**
 * 从npm包安装工作流配置
 */
async function installFromNpm(workflowName) {
  const workflow = BUILTIN_WORKFLOWS[workflowName];
  if (!workflow) {
    throw new Error(`未知的工作流：${workflowName}`);
  }

  // 检查npm包是否已安装
  let packagePath;
  try {
    const npmRoot = execSync('npm root -g').toString().trim();
    packagePath = path.join(npmRoot, workflow.package);
  } catch {
    throw new Error(`无法找到 ${workflow.package} 包`);
  }

  // 检查包是否存在
  if (!await fs.pathExists(packagePath)) {
    throw new Error(`${workflow.package} 未安装，请先运行：npm install -g ${workflow.package}`);
  }

  // 复制配置
  const configSrc = path.join(packagePath, 'config');
  const configDest = path.join(BAILU_HOME, 'config', 'workflows', workflowName);
  
  if (await fs.pathExists(configSrc)) {
    await fs.ensureDir(configDest);
    await fs.copy(configSrc, configDest);
  }
}

/**
 * 从本地配置安装工作流
 */
async function installFromLocal(workflowName) {
  const localConfigPath = path.join(BAILU_HOME, 'config', 'workflows', `${workflowName}-workflow.yaml`);
  
  if (!await fs.pathExists(localConfigPath)) {
    throw new Error(`本地配置不存在：${localConfigPath}`);
  }

  // 本地配置已经存在，无需额外操作
  return true;
}

/**
 * 更新已安装工作流记录
 */
async function updateInstalledRecord(workflowName) {
  const installedPath = path.join(BAILU_HOME, 'installed.json');
  
  let installed = { version: '1.0.0', workflows: {} };
  if (await fs.pathExists(installedPath)) {
    installed = await fs.readJson(installedPath);
  }

  installed.workflows[workflowName] = {
    version: '1.0.0',
    installed_at: new Date().toISOString()
  };

  await fs.writeJson(installedPath, installed, { spaces: 2 });
}

/**
 * 执行工作流安装
 */
async function workflowInstall(name) {
  console.log('');
  console.log(chalk.cyan(`🦌 白鹿工作流 - 安装工作流`));
  console.log('');

  // 检查工作流是否存在
  const workflow = BUILTIN_WORKFLOWS[name];
  if (!workflow) {
    console.error(chalk.red(`❌ 未知的工作流：${name}`));
    console.log('');
    console.log('可用的工作流：');
    for (const [key, wf] of Object.entries(BUILTIN_WORKFLOWS)) {
      console.log(`  - ${key}: ${wf.description}`);
    }
    process.exit(1);
  }

  try {
    // 检查配置中心是否存在
    if (!await fs.pathExists(BAILU_HOME)) {
      console.log(chalk.yellow('配置中心不存在，正在初始化...'));
      await require('./init')();
    }

    const spinner = ora({
      text: `正在安装 ${workflow.name}...`,
      spinner: 'dots',
      color: 'cyan'
    }).start();

    // 尝试从本地配置安装
    const localResult = await installFromLocal(name);
    
    if (localResult) {
      spinner.succeed(`${workflow.name} 已从本地配置安装`);
    } else {
      // 从npm包安装
      await installFromNpm(name);
      spinner.succeed(`${workflow.name} 已从npm包安装`);
    }

    // 更新记录
    await updateInstalledRecord(name);

    console.log('');
    const successBox = boxen(
      chalk.white(`${workflow.name} 安装成功！\n\n`) +
      chalk.yellow('下一步：\n') +
      chalk.white(`1. ${chalk.cyan('bailu tool install')}    安装到AI工具\n`) +
      chalk.white(`2. ${chalk.cyan('bailu status')}          查看状态`),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
        title: '✅ 安装成功',
        titleAlignment: 'center'
      }
    );
    console.log(successBox);

  } catch (error) {
    console.error(chalk.red('安装失败：'), error.message);
    process.exit(1);
  }
}

module.exports = workflowInstall;
