/**
 * 初始化命令（美化版）
 * 
 * 初始化白鹿工作流配置中心
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const ora = require('ora');
const boxen = require('boxen');
const gradient = require('gradient-string');
const figlet = require('figlet');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

/**
 * 生成ASCII艺术标题
 */
function generateTitle() {
  return new Promise((resolve, reject) => {
    figlet('Bailu Init', {
      font: 'Small',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

/**
 * 执行初始化
 */
async function init() {
  try {
    // 生成标题
    const title = await generateTitle();
    const gradientTitle = gradient.pastel.multiline(title);
    
    console.log('');
    console.log(gradientTitle);
    console.log('');

    // 创建目录结构
    const dirs = [
      'config/skills',
      'config/commands',
      'config/agents',
      'config/hooks',
      'config/templates',
      'config/workflows',
      'adapters'
    ];

    const spinner = ora({
      text: '正在初始化白鹿工作流...',
      spinner: 'dots',
      color: 'cyan'
    }).start();

    for (const dir of dirs) {
      const fullPath = path.join(BAILU_HOME, dir);
      await fs.ensureDir(fullPath);
    }

    spinner.succeed('目录结构创建完成');

    // 创建注册表
    const registryPath = path.join(BAILU_HOME, 'registry.json');
    if (!await fs.pathExists(registryPath)) {
      await fs.writeJson(registryPath, {
        version: '1.0.0',
        installed_at: new Date().toISOString(),
        tools: {}
      }, { spaces: 2 });
      console.log(chalk.green('   ✓ 注册表创建完成'));
    }

    // 创建已安装工作流记录
    const installedPath = path.join(BAILU_HOME, 'installed.json');
    if (!await fs.pathExists(installedPath)) {
      await fs.writeJson(installedPath, {
        version: '1.0.0',
        workflows: {}
      }, { spaces: 2 });
      console.log(chalk.green('   ✓ 工作流记录创建完成'));
    }

    console.log('');

    // 成功信息
    const successBox = boxen(
      chalk.white('白鹿工作流初始化完成！\n\n') +
      chalk.yellow('下一步：\n') +
      chalk.white(`1. ${chalk.cyan('bailu workflow install dev')}    安装开发工作流\n`) +
      chalk.white(`2. ${chalk.cyan('bailu tool install')}            安装到AI工具\n`) +
      chalk.white(`3. ${chalk.cyan('bailu status')}                  查看状态`),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
        title: '✅ 初始化成功',
        titleAlignment: 'center'
      }
    );
    console.log(successBox);

  } catch (error) {
    console.error(chalk.red('初始化失败：'), error.message);
    process.exit(1);
  }
}

module.exports = init;
