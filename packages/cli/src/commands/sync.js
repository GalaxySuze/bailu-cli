/**
 * 团队同步命令
 */

const chalk = require('chalk');
const SyncManager = require('../sync/manager');

const manager = new SyncManager();

/**
 * 初始化团队仓库
 * @param {string} repoUrl - 仓库地址
 * @param {Object} options - 选项
 */
async function init(repoUrl, options = {}) {
  console.log('');
  console.log(chalk.cyan('🦌 初始化团队同步'));
  console.log('');

  try {
    const result = await manager.init(repoUrl, options);
    console.log(chalk.green(`✅ 团队仓库已配置`));
    console.log(chalk.white(`   仓库: ${result.repo}`));
    console.log(chalk.white(`   分支: ${result.branch}`));
  } catch (error) {
    console.error(chalk.red(`❌ 初始化失败: ${error.message}`));
  }

  console.log('');
}

/**
 * 从远程拉取更新
 */
async function pull() {
  console.log('');
  console.log(chalk.cyan('🦌 拉取团队配置'));
  console.log('');

  try {
    const result = await manager.pull();
    console.log(chalk.green(`✅ ${result.message}`));
    console.log(chalk.white(`   最后同步: ${new Date(result.lastSync).toLocaleString()}`));
  } catch (error) {
    console.error(chalk.red(`❌ 拉取失败: ${error.message}`));
  }

  console.log('');
}

/**
 * 推送本地更改
 * @param {string} message - 提交信息
 */
async function push(message) {
  console.log('');
  console.log(chalk.cyan('🦌 推送本地配置'));
  console.log('');

  try {
    const result = await manager.push(message);
    console.log(chalk.green(`✅ ${result.message}`));
  } catch (error) {
    console.error(chalk.red(`❌ 推送失败: ${error.message}`));
  }

  console.log('');
}

/**
 * 对比本地和远程差异
 */
async function diff() {
  console.log('');
  console.log(chalk.cyan('🦌 对比配置差异'));
  console.log('');

  try {
    const result = await manager.diff();

    if (result.added.length > 0) {
      console.log(chalk.green('本地新增:'));
      result.added.forEach(name => console.log(chalk.green(`  + ${name}`)));
    }

    if (result.removed.length > 0) {
      console.log(chalk.red('远程新增:'));
      result.removed.forEach(name => console.log(chalk.red(`  - ${name}`)));
    }

    if (result.modified.length > 0) {
      console.log(chalk.yellow('版本不同:'));
      result.modified.forEach(item => {
        console.log(chalk.yellow(`  ~ ${item.name} (本地: ${item.localVersion}, 远程: ${item.remoteVersion})`));
      });
    }

    if (result.upToDate.length > 0) {
      console.log(chalk.gray(`已同步: ${result.upToDate.length} 个`));
    }

    if (result.added.length === 0 && result.removed.length === 0 && result.modified.length === 0) {
      console.log(chalk.green('✅ 所有配置已同步'));
    }
  } catch (error) {
    console.error(chalk.red(`❌ 对比失败: ${error.message}`));
  }

  console.log('');
}

/**
 * 查看同步状态
 */
async function status() {
  console.log('');
  console.log(chalk.cyan('🦌 同步状态'));
  console.log('');

  const status = await manager.getStatus();

  if (!status.configured) {
    console.log(chalk.yellow('⚠️  未配置团队仓库'));
    console.log('');
    console.log(chalk.white('初始化团队同步:'));
    console.log(chalk.cyan('  bailu sync init <repo-url>'));
    console.log('');
    return;
  }

  console.log(chalk.white(`仓库: ${status.repo}`));
  console.log(chalk.white(`分支: ${status.branch}`));
  console.log(chalk.white(`本地工作流: ${status.localWorkflows} 个`));
  console.log(chalk.white(`最后同步: ${status.lastSync ? new Date(status.lastSync).toLocaleString() : '从未'}`));
  console.log('');
}

module.exports = { init, pull, push, diff, status };
