/**
 * 统一安装命令
 *
 * 智能识别参数类型，统一工作流部署入口：
 *   bailu install              # 部署所有工作流到所有工具
 *   bailu install qoder        # 部署所有工作流到 Qoder
 *   bailu install dev          # 部署 dev 工作流到所有工具
 *   bailu install dev qoder    # 部署 dev 工作流到 Qoder
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const chalk = require('chalk');
const ora = require('ora');
const Table = require('cli-table3');
const boxen = require('boxen');
const gradient = require('../utils/gradient');
const { getAllTools, getInstalledToolKeys, getToolConfig } = require('../config/tools');
const {
  findLocalWorkflow,
  loadManifest,
  getInstaller,
  warnUnsupportedComponents,
  recordInstallation
} = require('./install');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

/**
 * 已注册的工作流名称（用于智能识别）
 */
const KNOWN_WORKFLOWS = ['dev', 'base', 'ops'];

/**
 * 判断参数是工作流名还是工具名
 * @param {string} arg - 命令行参数
 * @returns {'workflow'|'tool'|'unknown'} 参数类型
 */
function identifyArg(arg) {
  if (KNOWN_WORKFLOWS.includes(arg)) {
    return 'workflow';
  }
  const allTools = getAllTools();
  if (allTools[arg]) {
    return 'tool';
  }
  return 'unknown';
}

/**
 * 获取已安装的工作流列表
 * @returns {Promise<Object>} 工作流映射 { name: info }
 */
async function getInstalledWorkflows() {
  const installedPath = path.join(BAILU_HOME, 'installed.json');

  if (!await fs.pathExists(installedPath)) {
    return {};
  }

  try {
    const data = await fs.readJson(installedPath);
    return data.workflows || {};
  } catch {
    return {};
  }
}

/**
 * 安装指定工作流到指定工具
 * @param {string} workflowName - 工作流名称
 * @param {string} toolKey - 工具标识
 * @returns {Promise<{success: boolean, details: string, result?: Object}>}
 */
async function installWorkflowToTool(workflowName, toolKey) {
  // 查找工作流目录
  let workflowDir;
  try {
    workflowDir = await findLocalWorkflow(workflowName);
  } catch (error) {
    console.log(chalk.red(`  [查找] 失败: ${error.message}`));
    return { success: false, details: `查找失败: ${error.message}` };
  }

  if (!workflowDir) {
    console.log(chalk.yellow(`  [查找] 工作流目录未找到: ${workflowName}`));
    return { success: false, details: '工作流目录未找到' };
  }
  console.log(chalk.gray(`  [查找] 工作流目录: ${workflowDir}`));

  // 加载 manifest
  let manifest;
  try {
    manifest = await loadManifest(workflowDir);
    console.log(chalk.gray(`  [manifest] 加载成功，components: ${Object.keys(manifest.components || {}).join(', ') || '(空)'}`));
  } catch (error) {
    console.log(chalk.red(`  [manifest] 加载失败: ${error.message}`));
    return { success: false, details: `manifest 加载失败: ${error.message}` };
  }

  // 获取安装器并执行安装
  try {
    const installer = getInstaller(toolKey);
    console.log(chalk.gray(`  [installer] 类型: ${installer.constructor.name}, homeDir: ${installer.homeDir}`));

    // 检查工具是否已安装
    if (!installer.isInstalled()) {
      console.log(chalk.yellow(`  [检测] 工具配置目录不存在: ${installer.homeDir}`));
      return { success: false, details: '工具未检测到' };
    }
    console.log(chalk.gray(`  [检测] 工具已安装 ✓`));

    // 检查不支持的组件
    const unsupported = installer.getUnsupportedComponents(manifest.components || {});
    if (unsupported.length > 0) {
      warnUnsupportedComponents(installer.name, unsupported);
    }

    // 执行安装
    const result = await installer.installWorkflow(workflowDir, manifest);
    result.agent = toolKey;

    // 记录安装信息
    await recordInstallation(workflowName, manifest, result);
    console.log(chalk.gray(`  [记录] 已写入 ~/.bailu/installed.json`));

    return { success: true, details: summarizeResult(result), result };
  } catch (error) {
    console.log(chalk.red(`  [安装] 异常: ${error.message}`));
    if (error.stack) {
      console.log(chalk.gray(error.stack.split('\n').slice(1, 4).join('\n')));
    }
    return { success: false, details: `安装失败: ${error.message}` };
  }
}

/**
 * 汇总安装结果
 * @param {Object} result - 安装结果
 * @returns {string} 汇总文本
 */
function summarizeResult(result) {
  const parts = [];
  const components = result.components || {};

  if (components.skills?.length > 0) parts.push(`${components.skills.length} skills`);
  if (components.agents?.length > 0) parts.push(`${components.agents.length} agents`);
  if (components.mcpServers?.length > 0) parts.push(`${components.mcpServers.length} mcp`);
  if (components.commands?.length > 0) parts.push(`${components.commands.length} commands`);
  if (components.rules?.length > 0) parts.push(`${components.rules.length} rules`);

  return parts.length > 0 ? parts.join(', ') : '无组件';
}

/**
 * 解析命令行参数，确定目标工作流和工具
 * @param {string|undefined} target - 第一个位置参数
 * @param {string|undefined} tool - 第二个位置参数
 * @param {Object} options - 选项对象
 * @returns {{ workflows: string[], tools: string[] }}
 */
function resolveTargets(target, tool, options) {
  let workflows = null;  // null 表示"所有工作流"
  let tools = null;      // null 表示"所有工具"

  // --to / --agent 选项优先
  const toolOption = options.to || options.agent;

  if (target === undefined && tool === undefined) {
    // bailu install → 所有工作流 → 所有工具
    return { workflows: null, tools: null };
  }

  if (target !== undefined && tool === undefined) {
    // 单参数：智能识别
    const type = identifyArg(target);

    if (type === 'workflow') {
      // bailu install dev → dev → 工具由 --to/--agent 或全部
      workflows = [target];
      tools = toolOption ? [toolOption] : null;
    } else if (type === 'tool') {
      // bailu install qoder → 所有工作流 → qoder
      workflows = null;
      tools = [target];
    } else {
      // 未知参数，当作工作流名尝试
      workflows = [target];
      tools = toolOption ? [toolOption] : null;
    }

    return { workflows, tools };
  }

  // 双参数：bailu install dev qoder
  const targetType = identifyArg(target);
  const toolType = identifyArg(tool);

  if (targetType === 'workflow' && toolType === 'tool') {
    workflows = [target];
    tools = [tool];
  } else if (targetType === 'tool' && toolType === 'workflow') {
    // 反过来的情况：bailu install qoder dev
    workflows = [tool];
    tools = [target];
  } else {
    // 默认按 (workflow, tool) 处理
    workflows = [target];
    tools = tool ? [tool] : null;
  }

  // --to 选项覆盖工具
  if (toolOption) {
    tools = [toolOption];
  }

  return { workflows, tools };
}

/**
 * 执行统一安装命令
 * @param {string|undefined} target - 第一个位置参数
 * @param {string|undefined} tool - 第二个位置参数
 * @param {Object} options - 选项对象
 */
async function unifiedInstall(target, tool, options = {}) {
  console.log('');
  console.log(gradient.cristal('  🦌 白鹿工作流 — 安装'));
  console.log('');

  // 检查配置中心
  if (!await fs.pathExists(BAILU_HOME)) {
    console.error(chalk.red('❌ 错误：白鹿工作流配置中心不存在'));
    console.log('   请先运行：bailu init');
    process.exit(1);
  }

  // 如果指定了 --source，走旧的 install 路径（单工作流安装）
  if (options.source || options.dryRun) {
    const workflowName = target || 'dev';
    const agentKey = options.agent || options.to || 'claude';
    return require('./install')(workflowName, {
      agent: agentKey,
      source: options.source,
      dryRun: options.dryRun
    });
  }

  // 解析目标
  const { workflows: targetWorkflows, tools: targetTools } = resolveTargets(target, tool, options);

  // 获取已安装的工作流
  const installedWorkflows = await getInstalledWorkflows();

  // 如果指定了特定工作流，但本地未安装，则尝试从注册表拉取后安装
  if (targetWorkflows !== null) {
    const missingWorkflows = targetWorkflows.filter(name => !installedWorkflows[name]);
    if (missingWorkflows.length > 0) {
      console.log(chalk.yellow(`⚠️  工作流 "${missingWorkflows.join(', ')}" 尚未安装到本地，尝试从注册表拉取...`));
      return require('./install')(missingWorkflows[0], {
        agent: targetTools?.[0] || options.to || options.agent || 'claude'
      });
    }
  }

  const workflowNames = targetWorkflows || Object.keys(installedWorkflows);

  if (workflowNames.length === 0) {
    console.log(chalk.yellow('⚠️  未找到已安装的工作流'));
    console.log(chalk.gray('   请先拉取工作流：bailu pull dev'));
    return;
  }

  // 获取目标工具列表
  const allTools = getAllTools();
  const toolKeys = targetTools || getInstalledToolKeys();

  if (toolKeys.length === 0) {
    console.log(chalk.yellow('⚠️  未检测到任何 AI 工具'));
    console.log(chalk.gray('   支持的工具: claude, trae, qoder'));
    return;
  }

  // 预览模式
  console.log(chalk.white('📋 安装计划:'));
  console.log(chalk.gray(`   工作流: ${workflowNames.join(', ')}`));
  console.log(chalk.gray(`   目标工具: ${toolKeys.map(k => allTools[k]?.name || k).join(', ')}`));
  console.log('');

  let installedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  // 创建结果表格
  const table = new Table({
    head: [
      chalk.cyan('工作流'),
      chalk.cyan('工具'),
      chalk.cyan('结果')
    ],
    style: { head: [], border: ['gray'] },
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤'
    }
  });

  for (const toolKey of toolKeys) {
    const toolConfig = allTools[toolKey];
    if (!toolConfig) {
      console.log(chalk.red(`❌ 未知工具: ${toolKey}`));
      table.push([chalk.gray('-'), chalk.white(toolKey), chalk.red('❌ 未知工具')]);
      failedCount++;
      continue;
    }

    for (const workflowName of workflowNames) {
      // 详细日志分隔块
      console.log('');
      console.log(chalk.cyan('━'.repeat(60)));
      console.log(chalk.bold.cyan(`▶ ${workflowName} → ${toolConfig.emoji} ${toolConfig.name}`));
      console.log(chalk.gray(`  开始时间: ${new Date().toLocaleTimeString()}`));
      console.log(chalk.cyan('━'.repeat(60)));

      const startTs = Date.now();
      const result = await installWorkflowToTool(workflowName, toolKey);
      const elapsed = ((Date.now() - startTs) / 1000).toFixed(2);

      if (result.success) {
        console.log(chalk.green(`✔ 完成 ${workflowName} → ${toolConfig.name} (耗时 ${elapsed}s)`));
        console.log(chalk.gray(`  结果: ${result.details}`));
        table.push([
          chalk.white(workflowName),
          `${toolConfig.emoji} ${chalk.white(toolConfig.name)}`,
          chalk.green(result.details)
        ]);
        installedCount++;
      } else {
        const isSkip = result.details.includes('未检测到') || result.details.includes('未找到');
        if (isSkip) {
          console.log(chalk.yellow(`⚠ 跳过 ${workflowName} → ${toolConfig.name} (耗时 ${elapsed}s)`));
        } else {
          console.log(chalk.red(`✖ 失败 ${workflowName} → ${toolConfig.name} (耗时 ${elapsed}s)`));
        }
        console.log(chalk.gray(`  原因: ${result.details}`));

        table.push([
          chalk.white(workflowName),
          `${toolConfig.emoji} ${chalk.white(toolConfig.name)}`,
          isSkip ? chalk.yellow(`⚠️  ${result.details}`) : chalk.red(`❌ ${result.details}`)
        ]);

        if (isSkip) {
          skippedCount++;
        } else {
          failedCount++;
        }
      }
    }
  }

  console.log('');
  console.log(chalk.cyan('━'.repeat(60)));
  console.log(chalk.bold.white('📊 安装汇总'));
  console.log(chalk.cyan('━'.repeat(60)));
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

  // 如果全部失败，以非零退出码退出（供调用方检测）
  if (installedCount === 0 && failedCount > 0) {
    process.exitCode = 1;
  }
}

module.exports = unifiedInstall;
