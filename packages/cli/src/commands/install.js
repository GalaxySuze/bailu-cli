/**
 * 安装命令
 * 
 * 将白鹿工作流配置安装到 AI 工具中
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');
const ClaudeInstaller = require('../installer/claude');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

/**
 * 读取工作流 manifest.json
 * @param {string} workflowDir - 工作流目录
 * @returns {Promise<Object>} manifest 内容
 */
async function loadManifest(workflowDir) {
  const manifestPath = path.join(workflowDir, 'manifest.json');
  
  if (!await fs.pathExists(manifestPath)) {
    throw new Error(`找不到 manifest.json: ${manifestPath}`);
  }
  
  return await fs.readJson(manifestPath);
}

/**
 * 从本地路径查找工作流
 * @param {string} workflowName - 工作流名称
 * @returns {Promise<string|null>} 工作流目录路径
 */
async function findLocalWorkflow(workflowName) {
  // 1. 检查当前目录
  const currentDir = path.join(process.cwd(), workflowName);
  if (await fs.pathExists(path.join(currentDir, 'manifest.json'))) {
    return currentDir;
  }

  // 2. 检查 .bailu/workflows 目录
  const bailuDir = path.join(BAILU_HOME, 'workflows', workflowName);
  if (await fs.pathExists(path.join(bailuDir, 'manifest.json'))) {
    return bailuDir;
  }

  // 3. 检查 GitHub 仓库本地克隆
  const githubDir = path.join(os.homedir(), 'Code', 'GitHub', 'bailu-workflows', 'workflows', workflowName);
  if (await fs.pathExists(path.join(githubDir, 'manifest.json'))) {
    return githubDir;
  }

  // 4. 检查 packages 目录（开发模式）
  const packagesDir = path.resolve(__dirname, '../../../../packages');
  const workflowDirs = [
    path.join(packagesDir, `workflow-${workflowName}`),
    path.join(packagesDir, `bailu-workflow-${workflowName}`),
  ];

  for (const dir of workflowDirs) {
    const configDir = path.join(dir, 'config');
    if (await fs.pathExists(path.join(configDir, 'manifest.json'))) {
      return configDir;
    }
  }

  // 本地未找到，尝试从注册表拉取
  try {
    const fetched = await fetchWorkflowFromRegistry(workflowName);
    if (fetched) return fetched;
  } catch (fetchError) {
    // 拉取失败，继续返回 null
  }

  return null;
}

/**
 * 从 git 注册表拉取工作流
 * @param {string} workflowName - 工作流名称
 * @returns {Promise<string|null>} 工作流 config 目录路径
 */
async function fetchWorkflowFromRegistry(workflowName) {
  const registryPath = path.join(__dirname, '../workflows/registry.json');
  if (!await fs.pathExists(registryPath)) return null;

  const registry = await fs.readJson(registryPath);
  const entry = registry[workflowName];
  if (!entry) return null;

  const destDir = path.join(os.homedir(), '.bailu', 'workflows', workflowName);
  const tempDir = path.join(os.tmpdir(), `bailu-workflow-${workflowName}-${Date.now()}`);

  const spinner = ora(`正在从远程仓库拉取工作流 "${workflowName}"...`).start();
  try {
    // 使用 git sparse checkout 只拉取指定子目录
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
    spinner.succeed(`工作流 "${workflowName}" 拉取成功 → ${destDir}`);
    return destDir;
  } catch (error) {
    spinner.fail(`拉取失败: ${error.message}`);
    throw error;
  } finally {
    await fs.remove(tempDir).catch(() => {});
  }
}

/**
 * 获取安装器
 * @param {string} agent - AI 工具名称
 * @returns {Object} 安装器实例
 */
function getInstaller(agent) {
  switch (agent) {
    case 'claude':
      return new ClaudeInstaller();
    // 后续支持其他工具
    // case 'codex':
    //   return new CodexInstaller();
    // case 'hanako':
    //   return new HanakoInstaller();
    default:
      throw new Error(`不支持的 AI 工具: ${agent}`);
  }
}

/**
 * 记录安装信息
 * @param {string} workflowName - 工作流名称
 * @param {Object} manifest - manifest 内容
 * @param {Object} result - 安装结果
 */
async function recordInstallation(workflowName, manifest, result) {
  const installedPath = path.join(BAILU_HOME, 'installed.json');
  
  let installed = { workflows: {} };
  if (await fs.pathExists(installedPath)) {
    installed = await fs.readJson(installedPath);
  }

  installed.workflows[workflowName] = {
    version: manifest.version,
    displayName: manifest.displayName || manifest.name,
    installed_at: new Date().toISOString(),
    target_agent: result.agent,
    components: result.components
  };

  await fs.ensureDir(BAILU_HOME);
  await fs.writeJson(installedPath, installed, { spaces: 2 });
}

/**
 * 显示安装结果
 * @param {string} workflowName - 工作流名称
 * @param {Object} result - 安装结果
 */
function showResult(workflowName, result) {
  const components = result.components;
  const lines = [];

  lines.push(chalk.white.bold(`工作流: ${workflowName}`));
  lines.push(chalk.gray(`目标工具: ${result.agent}`));
  lines.push('');

  if (components.skills?.length > 0) {
    lines.push(chalk.white('Skills:'));
    components.skills.forEach(s => lines.push(chalk.green(`  ✅ ${s}`)));
  }

  if (components.commands?.length > 0) {
    lines.push(chalk.white('Commands:'));
    components.commands.forEach(c => lines.push(chalk.green(`  ✅ ${c}`)));
  }

  if (components.rules?.length > 0) {
    lines.push(chalk.white('Rules:'));
    components.rules.forEach(r => lines.push(chalk.green(`  ✅ ${r}`)));
  }

  if (components.agents?.length > 0) {
    lines.push(chalk.white('Agents:'));
    components.agents.forEach(a => lines.push(chalk.green(`  ✅ ${a}`)));
  }

  if (components.hooks?.length > 0) {
    lines.push(chalk.white('Hooks:'));
    components.hooks.forEach(h => lines.push(chalk.green(`  ✅ ${h}`)));
  }

  if (components.memory?.length > 0) {
    lines.push(chalk.white('Memory:'));
    components.memory.forEach(m => lines.push(chalk.green(`  ✅ ${m}`)));
  }

  if (components.mcpServers?.length > 0) {
    lines.push(chalk.white('MCP Servers:'));
    components.mcpServers.forEach(m => lines.push(chalk.green(`  ✅ ${m}`)));
  }

  const box = boxen(lines.join('\n'), {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'green',
    title: '✨ 安装成功',
    titleAlignment: 'center'
  });

  console.log(box);
}

/**
 * 执行安装命令
 * @param {string} workflowName - 工作流名称
 * @param {Object} options - 选项
 */
async function install(workflowName, options = {}) {
  const { agent = 'claude', source, dryRun = false } = options;

  console.log('');
  console.log(chalk.cyan('🦌 白鹿工作流 - 安装'));
  console.log('');

  // 1. 查找工作流目录
  const spinner = ora('查找工作流配置...').start();
  
  let workflowDir;
  try {
    workflowDir = await findLocalWorkflow(workflowName);
    
    if (!workflowDir) {
      spinner.fail(`找不到工作流: ${workflowName}`);
      console.log('');
      console.log(chalk.yellow('可用的工作流:'));
      console.log(chalk.white('  - dev (开发工作流)'));
      console.log(chalk.white('  - ops (运营工作流)'));
      console.log('');
      console.log(chalk.gray('使用 --source 指定本地路径:'));
      console.log(chalk.cyan('  bailu install dev --source ./path/to/workflow'));
      return;
    }

    spinner.succeed(`找到工作流: ${workflowDir}`);
  } catch (error) {
    spinner.fail(error.message);
    return;
  }

  // 2. 加载 manifest
  let manifest;
  try {
    manifest = await loadManifest(workflowDir);
  } catch (error) {
    console.error(chalk.red(`错误: ${error.message}`));
    return;
  }

  // 3. 检查目标工具
  const installer = getInstaller(agent);
  
  if (!installer.isInstalled()) {
    console.log(chalk.yellow(`⚠️  未检测到 ${installer.name}，安装可能不完整`));
  }

  // 4. 预览模式
  if (dryRun) {
    console.log('');
    console.log(chalk.yellow('📋 预览模式 - 以下内容将被安装:'));
    console.log('');
    console.log(chalk.white('Skills:'), manifest.components.skills?.join(', ') || '无');
    console.log(chalk.white('Commands:'), manifest.components.commands?.join(', ') || '无');
    console.log(chalk.white('Rules:'), manifest.components.rules?.join(', ') || '无');
    console.log(chalk.white('Agents:'), manifest.components.agents?.join(', ') || '无');
    console.log(chalk.white('Hooks:'), manifest.components.hooks?.join(', ') || '无');
    console.log(chalk.white('Memory:'), manifest.components.memory?.join(', ') || '无');
    console.log(chalk.white('MCP Servers:'), manifest.components.mcpServers?.join(', ') || '无');
    console.log('');
    console.log(chalk.gray('移除 --dry-run 参数以执行安装'));
    return;
  }

  // 5. 执行安装
  try {
    const result = await installer.installWorkflow(workflowDir, manifest);
    result.agent = agent;

    // 6. 记录安装信息
    await recordInstallation(workflowName, manifest, result);

    // 7. 显示结果
    showResult(workflowName, result);

    // 8. 提示下一步
    console.log(chalk.white('💡 下一步:'));
    console.log(chalk.gray('   在 Claude Code 中使用触发词或命令即可'));
    console.log('');

  } catch (error) {
    console.error(chalk.red(`安装失败: ${error.message}`));
    console.error(error.stack);
  }
}

module.exports = install;
