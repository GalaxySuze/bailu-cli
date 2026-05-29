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
const gradient = require('../utils/gradient');
const ClaudeInstaller = require('../installer/claude');
const ClaudeDesktopInstaller = require('../installer/claude-desktop');
const CodexInstaller = require('../installer/codex');
const TraeInstaller = require('../installer/trae');
const QoderInstaller = require('../installer/qoder');
const HanaAgentInstaller = require('../installer/hana-agent');
const HermesInstaller = require('../installer/hermes');
const { getToolConfig } = require('../config/tools');

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
    // 凭据或网络错误，向上抛出以便调用方展示原因
    throw new Error(`从远程仓库拉取 "${workflowName}" 失败: ${fetchError.message}`);
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
    // 获取凭据并创建 GIT_ASKPASS 脚本（与 workflow-install.js 保持一致）
    const { getCredentials, createAskPassScript } = require('../utils/credentials');
    const creds = await getCredentials();
    const { scriptPath, cleanup } = await createAskPassScript(creds.username, creds.password);

    const gitEnv = {
      ...process.env,
      GIT_ASKPASS: scriptPath,
      GIT_TERMINAL_PROMPT: '0'
    };

    try {
      // 使用 git sparse checkout 只拉取指定子目录
      execSync(
        `git clone --depth 1 --filter=blob:none --sparse "${entry.repo}" "${tempDir}"`,
        { stdio: 'pipe', env: gitEnv }
      );
      execSync(
        `git -C "${tempDir}" sparse-checkout set "${entry.subdir}"`,
        { stdio: 'pipe', env: gitEnv }
      );
    } finally {
      // 无论成功失败，都清理 ASKPASS 脚本
      await cleanup();
    }

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
 * 获取安装器（统一工厂）
 *
 * 支持所有已注册的 AI 工具，包括：
 * - claudecode: Claude Code CLI
 * - claude-desktop: Claude Desktop 桌面版
 * - codex: OpenAI Codex CLI
 * - trae: Trae
 * - qoder: Qoder
 * - qoder-cli: Qoder CLI
 * - hana-agent: HanaAgent (原 Hanako)
 * - hermes: Hermes
 *
 * @param {string} agent - AI 工具名称
 * @returns {Object} 安装器实例
 */
function getInstaller(agent) {
  const installerMap = {
    claudecode: () => new ClaudeInstaller(),
    'claude-desktop': () => new ClaudeDesktopInstaller(),
    codex: () => new CodexInstaller(),
    trae: () => new TraeInstaller(),
    qoder: () => new QoderInstaller(),
    'qoder-cli': () => new QoderInstaller(),
    'hana-agent': () => new HanaAgentInstaller(),
    hermes: () => new HermesInstaller(),
  };
  const factory = installerMap[agent];
  if (!factory) {
    const supported = Object.keys(installerMap).join(', ');
    throw new Error(`不支持的 AI 工具: ${agent}。支持: ${supported}`);
  }
  return factory();
}

/**
 * 输出不支持的组件警告
 * @param {string} toolName - 工具名称
 * @param {Array<{type: string, items: string[]}>} unsupported - 不支持的组件列表
 */
function warnUnsupportedComponents(toolName, unsupported) {
  if (unsupported.length === 0) return;
  const names = unsupported.map(c => `    · ${c.type} (${c.items.join(', ')})`).join('\n');
  console.log(chalk.yellow(`\n⚠️  ${toolName} 不支持以下组件，已跳过安装：\n${names}\n`));
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

  // 读取已有记录，合并 target_agents（兼容旧的 target_agent 字段）
  const existing = installed.workflows[workflowName] || {};
  const prevAgents = existing.target_agents || [];
  if (existing.target_agent && !prevAgents.includes(existing.target_agent)) {
    prevAgents.push(existing.target_agent);
  }

  const newAgent = result.agent;
  const targetAgents = prevAgents.includes(newAgent) ? prevAgents : [...prevAgents, newAgent];

  installed.workflows[workflowName] = {
    version: manifest.version,
    displayName: manifest.displayName || manifest.name,
    installed_at: new Date().toISOString(),
    target_agents: targetAgents,
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
  console.log(gradient.cristal('  🦌 白鹿工作流 — 安装工作流'));
  console.log('');

  // 1. 查找工作流目录
  const spinner = ora('查找工作流配置...').start();
  
  let workflowDir;
  try {
    workflowDir = await findLocalWorkflow(workflowName);
    
    if (!workflowDir) {
      spinner.fail(`找不到工作流: ${workflowName}`);
      console.log('');
      console.log(chalk.yellow('💡 请先拉取工作流到本地：'));
      console.log(chalk.cyan(`  bailu pull ${workflowName}`));
      console.log('');
      console.log(chalk.gray('或使用 --source 指定本地路径:'));
      console.log(chalk.cyan(`  bailu install ${workflowName} --source ./path/to/workflow`));
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

  // 3.1 检查 manifest.targetAgents 是否包含目标工具
  if (manifest.targetAgents && Array.isArray(manifest.targetAgents) && manifest.targetAgents.length > 0) {
    if (!manifest.targetAgents.includes(agent)) {
      console.log(chalk.yellow(`⚠️  工作流 "${manifest.displayName || manifest.name}" 未声明支持 ${installer.name}`));
      console.log(chalk.gray(`   manifest.targetAgents: ${manifest.targetAgents.join(', ')}`));
    }
  }

  // 3.2 检查不支持的组件
  const unsupported = installer.getUnsupportedComponents(manifest.components || {});
  if (unsupported.length > 0) {
    warnUnsupportedComponents(installer.name, unsupported);
  }

  // 4. 预览模式
  if (dryRun) {
    console.log('');
    console.log(chalk.yellow('📋 预览模式 - 以下内容将被安装:'));
    console.log('');
    const comps = manifest.components || {};
    console.log(chalk.white('目标工具:'), installer.name);
    console.log(chalk.white('Skills:'), comps.skills?.join(', ') || '无');
    console.log(chalk.white('Commands:'), comps.commands?.join(', ') || '无');
    console.log(chalk.white('Rules:'), comps.rules?.join(', ') || '无');
    console.log(chalk.white('Agents:'), comps.agents?.join(', ') || '无');
    console.log(chalk.white('Hooks:'), comps.hooks?.join(', ') || '无');
    console.log(chalk.white('Memory:'), comps.memory?.join(', ') || '无');
    console.log(chalk.white('MCP Servers:'), comps.mcpServers?.join(', ') || '无');
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

// 导出可复用函数，供 tool-install.js 等模块使用
module.exports.findLocalWorkflow = findLocalWorkflow;
module.exports.loadManifest = loadManifest;
module.exports.getInstaller = getInstaller;
module.exports.warnUnsupportedComponents = warnUnsupportedComponents;
module.exports.recordInstallation = recordInstallation;
