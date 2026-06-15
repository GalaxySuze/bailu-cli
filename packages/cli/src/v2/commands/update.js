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
const { confirm } = require('@inquirer/prompts');
const { execSync } = require('child_process');
const { readState, writeState, isInitialized } = require('../state');
const { performInstallation } = require('../installer');

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
 * 重新部署 Skills（基于状态文件记录的平台和语言）
 * 
 * 实现思路：
 * 1. 从 .bailu.yaml 读出已安装的平台列表、范围、语言
 * 2. 复用 installer.js 的清单驱动 performInstallation，它会覆盖写入
 * 3. 使用 result.details 更新状态文件，保持实际安装列表与状态同步
 * 
 * 与 init 不同：不走交互式选择、不检测冲突（默认覆盖，因为是同一人装过的）
 * 
 * @param {Object} state - 当前状态
 * @param {string} cwd - 工作目录
 * @returns {Promise<{success: boolean, details: Object}>} 重新部署结果
 */
async function reinstallSkills(state, cwd) {
  // 从状态文件提取已安装平台列表
  const platformIds = Object.entries(state.platforms || {})
    .filter(([, p]) => p.installed)
    .map(([id]) => id);
  
  if (platformIds.length === 0) {
    console.log(chalk.yellow('  ⚠ 未找到已安装的平台，跳过 Skills 重新部署'));
    return { success: false, details: {} };
  }
  
  const scope = state.scope || 'project';

  // 老用户脏数据兜底：v2.x 起锁定中文版 Skills，
  // 若 state.yml 仍记录为 'en'（之前误选或老版本遗留），
  // 在重安装时强制纠正为 'zh'，避免继续拉取残缺的英文版。
  // 同时将纠正后的值写回 state，下次 update 不再提醒。
  let language = state.language || 'zh';
  if (language !== 'zh') {
    console.log(chalk.yellow(
      `  ⚠ 检测到 state 中语言为 "${language}"，英文版 Skills 已下线，自动切换为中文版`
    ));
    language = 'zh';
    state.language = 'zh';
  }
  
  console.log('');
  console.log(chalk.cyan(`  重新部署 Skills 到 ${platformIds.length} 个平台、语言: ${language === 'zh' ? '中文' : 'English'}`));
  
  try {
    // 复用清单驱动安装逻辑（內部会输出 Phase 1/2/3 进度）
    // 重新部署默认跳过 MCP 交互（传 yes:true），避免 update 时突发询问
    const result = await performInstallation(platformIds, scope, language, cwd, { yes: true });
    
    if (result.failed.length > 0) {
      console.log(chalk.yellow(`  ⚠ ${result.failed.length} 个平台重新部署失败`));
      return { success: false, details: result.details };
    }
    
    return { success: true, details: result.details };
  } catch (error) {
    console.error(chalk.red(`  ✖ Skills 重新部署失败: ${error.message}`));
    return { success: false, details: {} };
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
    const confirmed = await confirm({
      message: `发现新版本 ${latestVersion}，是否更新？`,
      default: true
    });
    
    if (!confirmed) {
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
        const reinstallResult = await reinstallSkills(state, cwd);
        skillsUpdated = reinstallResult.success;
        
        // 更新状态文件中的版本号和安装详情
        if (skillsUpdated) {
          state.version = latestVersion;
          // 同步更新每个平台的实际安装列表
          for (const [platformId, detail] of Object.entries(reinstallResult.details)) {
            if (state.platforms[platformId]) {
              state.platforms[platformId].skills = detail.skills || [];
              state.platforms[platformId].agents = detail.agents || [];
              state.platforms[platformId].commands = detail.commands || [];
              state.platforms[platformId].installedAt = new Date().toISOString().split('T')[0];
            }
          }
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
