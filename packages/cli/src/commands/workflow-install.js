/**
 * 工作流安装命令
 * 
 * 从 Git 仓库拉取并安装指定的工作流到配置中心
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const ora = require('ora');
const boxen = require('boxen');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

/**
 * 读取工作流注册表
 */
async function getRegistry() {
  const registryPath = path.join(__dirname, '../workflows/registry.json');
  if (await fs.pathExists(registryPath)) {
    return await fs.readJson(registryPath);
  }
  return {};
}

/**
 * 从 Git 仓库拉取工作流
 * @param {string} workflowName - 工作流名称
 * @param {Object} entry - 注册表条目
 * @returns {Promise<string>} 工作流本地目录路径
 */
async function fetchWorkflowFromGit(workflowName, entry) {
  const { execSync } = require('child_process');
  const destDir = path.join(BAILU_HOME, 'workflows', workflowName);
  const tempDir = path.join(os.tmpdir(), `bailu-workflow-${workflowName}-${Date.now()}`);

  try {
    execSync(
      `git clone --depth 1 --filter=blob:none --sparse "${entry.repo}" "${tempDir}"`,
      { stdio: 'pipe' }
    );
    execSync(
      `git -C "${tempDir}" sparse-checkout set "${entry.subdir}"`,
      { stdio: 'pipe' }
    );

    const srcDir = path.join(tempDir, entry.subdir);
    if (!await fs.pathExists(srcDir)) {
      throw new Error(`仓库中找不到子目录: ${entry.subdir}`);
    }

    await fs.ensureDir(path.dirname(destDir));
    await fs.copy(srcDir, destDir, { overwrite: true });
    return destDir;
  } finally {
    await fs.remove(tempDir).catch(() => {});
  }
}

/**
 * 更新已安装工作流记录
 */
async function updateInstalledRecord(workflowName, entry) {
  const installedPath = path.join(BAILU_HOME, 'installed.json');

  let installed = { version: '1.0.0', workflows: {} };
  if (await fs.pathExists(installedPath)) {
    installed = await fs.readJson(installedPath);
  }

  installed.workflows[workflowName] = {
    version: '1.0.0',
    displayName: entry.displayName || workflowName,
    installed_at: new Date().toISOString()
  };

  await fs.writeJson(installedPath, installed, { spaces: 2 });
}

/**
 * 执行工作流安装
 */
async function workflowInstall(name) {
  console.log('');
  console.log(chalk.cyan('🦌 白鹿工作流 - 安装工作流'));
  console.log('');

  // 从注册表查找工作流
  const registry = await getRegistry();
  const entry = registry[name];

  if (!entry) {
    console.error(chalk.red(`❌ 未知的工作流：${name}`));
    console.log('');
    console.log('可用的工作流：');
    for (const [key, regEntry] of Object.entries(registry)) {
      console.log(`  - ${chalk.cyan(key)}: ${regEntry.description}`);
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
      text: `正在从 Git 仓库拉取 "${name}" 工作流...`,
      spinner: 'dots',
      color: 'cyan'
    }).start();

    const destDir = await fetchWorkflowFromGit(name, entry);
    spinner.succeed(`工作流 "${name}" 拉取成功 → ${destDir}`);

    // 更新记录
    await updateInstalledRecord(name, entry);

    console.log('');
    const successBox = boxen(
      chalk.white(`${entry.displayName || name} 安装成功！\n\n`) +
      chalk.yellow('下一步：\n') +
      chalk.white(`1. ${chalk.cyan('bailu tool install')}    安装到 AI 工具\n`) +
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
