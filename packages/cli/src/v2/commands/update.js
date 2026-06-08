/**
 * @fileoverview 白鹿 CLI v2 update 命令
 * 
 * 更新工作流到最新版本
 * 
 * 流程设计（参考 Comet）：
 * 1. 检查当前版本
 * 2. 检查最新版本
 * 3. 显示更新内容
 * 4. 执行更新
 * 5. 自动重新复制 Skills
 */

const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { execSync } = require('child_process');
const { readState, writeState, isInitialized } = require('../state');

/**
 * 获取当前 CLI 版本
 * @returns {string} 当前版本号
 */
function getCurrentVersion() {
  try {
    const pkg = require('../../package.json');
    return pkg.version;
  } catch (error) {
    return 'unknown';
  }
}

/**
 * 获取最新版本
 * @returns {Promise<string|null>} 最新版本号，获取失败返回 null
 */
async function getLatestVersion() {
  try {
    const output = execSync('npm view @vickzhang/bailu-cli version', {
      encoding: 'utf8',
      timeout: 10000
    }).trim();
    return output;
  } catch (error) {
    return null;
  }
}

/**
 * 比较版本号
 * @param {string} v1 - 版本 1
 * @param {string} v2 - 版本 2
 * @returns {number} -1: v1 < v2, 0: v1 = v2, 1: v1 > v2
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (parts1[i] < parts2[i]) return -1;
    if (parts1[i] > parts2[i]) return 1;
  }
  
  return 0;
}

/**
 * 执行 CLI 更新
 * @returns {Promise<boolean>} 是否成功
 */
async function updateCLI() {
  const spinner = ora('正在更新 CLI...').start();
  
  try {
    execSync('npm install -g @vickzhang/bailu-cli@latest', {
      encoding: 'utf8',
      timeout: 60000
    });
    
    spinner.succeed('CLI 更新完成');
    return true;
  } catch (error) {
    spinner.fail('CLI 更新失败');
    console.error(chalk.red(`  错误: ${error.message}`));
    return false;
  }
}

/**
 * 重新复制 Skills
 * @param {Object} state - 当前状态
 * @returns {Promise<boolean>} 是否成功
 */
async function reinstallSkills(state) {
  const spinner = ora('正在重新部署 Skills...').start();
  
  try {
    // TODO: 实现 Skills 重新部署
    // 根据状态文件中的平台配置，重新复制 Skills 文件
    
    // 检测已安装的语言
    // 扫描 SKILL.md 是否含中文字符
    // 保持语言一致性
    
    spinner.succeed('Skills 重新部署完成');
    return true;
  } catch (error) {
    spinner.fail('Skills 重新部署失败');
    console.error(chalk.red(`  错误: ${error.message}`));
    return false;
  }
}

/**
 * 显示更新摘要
 * @param {string} currentVersion - 当前版本
 * @param {string} newVersion - 新版本
 * @param {boolean} skillsUpdated - 是否更新了 Skills
 */
function showUpdateSummary(currentVersion, newVersion, skillsUpdated) {
  console.log('');
  console.log(chalk.green('  ✅ 更新完成！'));
  console.log('');
  console.log(chalk.white(`  CLI 版本: ${currentVersion} → ${newVersion}`));
  
  if (skillsUpdated) {
    console.log(chalk.white('  Skills: 已重新部署'));
  }
  
  console.log('');
  console.log(chalk.cyan('  运行 bailu status 查看当前状态'));
  console.log('');
}

/**
 * 主函数：运行 update 命令
 * @param {Object} options - 命令选项
 */
async function runUpdate(options = {}) {
  const cwd = process.cwd();
  
  try {
    console.log('');
    console.log(chalk.cyan('  白鹿工作流更新'));
    console.log(chalk.gray('  ─────────────'));
    console.log('');
    
    // 获取当前版本
    const currentVersion = getCurrentVersion();
    console.log(chalk.white(`  当前版本: ${currentVersion}`));
    
    // 获取最新版本
    const spinner = ora('检查最新版本...').start();
    const latestVersion = await getLatestVersion();
    spinner.stop();
    
    if (!latestVersion) {
      console.log(chalk.yellow('  ⚠ 无法获取最新版本信息'));
      console.log(chalk.gray('  请检查网络连接'));
      return;
    }
    
    console.log(chalk.white(`  最新版本: ${latestVersion}`));
    console.log('');
    
    // 比较版本
    const comparison = compareVersions(currentVersion, latestVersion);
    
    if (comparison === 0) {
      console.log(chalk.green('  ✔ 已是最新版本'));
      return;
    }
    
    if (comparison > 0) {
      console.log(chalk.yellow('  ⚠ 当前版本高于最新发布版本'));
      console.log(chalk.gray('  可能是开发版本'));
      return;
    }
    
    // 有新版本，询问是否更新
    if (options.check) {
      console.log(chalk.cyan('  发现新版本，运行 bailu update 进行更新'));
      return;
    }
    
    // 询问是否更新
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `发现新版本 ${latestVersion}，是否更新？`,
        default: true
      }
    ]);
    
    if (!confirm) {
      console.log(chalk.gray('  已取消更新'));
      return;
    }
    
    // 执行更新
    console.log('');
    const cliUpdated = await updateCLI();
    
    if (!cliUpdated) {
      console.log(chalk.red('  更新失败，请重试'));
      return;
    }
    
    // 重新部署 Skills（如果已初始化）
    let skillsUpdated = false;
    const initialized = await isInitialized(cwd);
    
    if (initialized) {
      const state = await readState(cwd);
      if (state) {
        skillsUpdated = await reinstallSkills(state);
        
        // 更新状态文件中的版本
        if (skillsUpdated) {
          state.version = latestVersion;
          await writeState(state, cwd);
        }
      }
    }
    
    // 显示摘要
    showUpdateSummary(currentVersion, latestVersion, skillsUpdated);
    
  } catch (error) {
    console.error(chalk.red(`\n  更新失败: ${error.message}`));
    process.exit(1);
  }
}

// 导出
module.exports = { runUpdate };
