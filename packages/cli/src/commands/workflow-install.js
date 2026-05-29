/**
 * 工作流安装命令
 *
 * 从 Git 仓库（HTTPS）拉取并安装指定的工作流到配置中心。
 * 通过 GIT_ASKPASS 注入凭据，凭据不出现在 URL 或 git 日志中。
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const ora = require('ora');
const boxen = require('boxen');

const { getCredentials, createAskPassScript, loadCredentials, saveCredentials, promptCredentials } = require('../utils/credentials');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

/**
 * 读取工作流注册表
 * @returns {Promise<Object>}
 */
async function getRegistry() {
  const registryPath = path.join(__dirname, '../workflows/registry.json');
  if (await fs.pathExists(registryPath)) {
    return await fs.readJson(registryPath);
  }
  return {};
}

/**
 * 从 Git 仓库（HTTPS）拉取工作流
 *
 * 使用 GIT_ASKPASS 脚本提供凭据，git 调用该脚本获取
 * username/password，凭据不会嵌入 URL。
 *
 * @param {string} workflowName - 工作流名称
 * @param {Object} entry - 注册表条目
 * @returns {Promise<string>} 工作流本地目录路径
 */
async function fetchWorkflowFromGit(workflowName, entry) {
  const { execSync } = require('child_process');
  const destDir = path.join(BAILU_HOME, 'workflows', workflowName);
  const tempDir = path.join(os.tmpdir(), `bailu-workflow-${workflowName}-${Date.now()}`);

  // 获取凭据（已保存则直接读取，否则交互提示）
  const creds = await getCredentials();
  const { scriptPath, cleanup } = await createAskPassScript(creds.username, creds.password);

  try {
    // 通过 GIT_ASKPASS 注入凭据，关闭 SSH 尝试
    const gitEnv = {
      ...process.env,
      GIT_ASKPASS: scriptPath,
      // 禁止 git 弹出系统 GUI 凭据对话框
      GIT_TERMINAL_PROMPT: '0'
    };

    execSync(
      `git clone --depth 1 --filter=blob:none --sparse "${entry.repo}" "${tempDir}"`,
      { stdio: 'pipe', env: gitEnv }
    );
    execSync(
      `git -C "${tempDir}" sparse-checkout set "${entry.subdir}"`,
      { stdio: 'pipe', env: gitEnv }
    );

    const srcDir = path.join(tempDir, entry.subdir);
    if (!await fs.pathExists(srcDir)) {
      throw new Error(`仓库中找不到子目录: ${entry.subdir}`);
    }

    await fs.ensureDir(path.dirname(destDir));
    await fs.copy(srcDir, destDir, { overwrite: true });
    return destDir;
  } finally {
    // 无论成功失败，都清理临时文件
    await cleanup();
    await fs.remove(tempDir).catch(() => {});
  }
}

/**
 * 更新已安装工作流记录
 * @param {string} workflowName
 * @param {Object} entry
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
 * @param {string} name - 工作流名称
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

    // 在启动 spinner 之前，先确保凭据已就绪
    // 否则 spinner 会与交互式输入冲突，导致卡住
    const savedCreds = await loadCredentials();
    if (!savedCreds) {
      console.log(chalk.yellow('🔐 首次使用需要配置 GitLab 凭据'));
      console.log(chalk.gray('   凭据仅用于 git clone，不会出现在日志中'));
      console.log('');

      const creds = await promptCredentials();
      await saveCredentials(creds.username, creds.password);
      console.log(chalk.green('   ✅ 凭据已保存到 ~/.bailu/auth.json，后续无需再次输入'));
      console.log('');
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
      chalk.white(`${entry.displayName || name} 拉取成功！\n\n`) +
      chalk.yellow('下一步：\n') +
      chalk.white(`1. ${chalk.cyan('bailu install')}           部署到所有 AI 工具\n`) +
      chalk.white(`2. ${chalk.cyan('bailu install qoder')}     部署到 Qoder\n`) +
      chalk.white(`3. ${chalk.cyan('bailu status')}             查看状态`),
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
    // 区分凭据错误和其他错误，给出更有帮助的提示
    const msg = error.message || '';
    if (msg.includes('Authentication failed') || msg.includes('could not read Username')) {
      console.error(chalk.red('❌ 凭据验证失败，请检查用户名和密码'));
      console.log(chalk.yellow('  提示：运行 `bailu auth clear` 清除已保存的凭据后重试'));
    } else {
      console.error(chalk.red('安装失败：'), msg);
    }
    process.exit(1);
  }
}

module.exports = workflowInstall;
