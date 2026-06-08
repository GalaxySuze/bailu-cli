/**
 * @fileoverview 白鹿 CLI v2 status 命令
 * 
 * 查看当前状态和下一步指引
 * 
 * 设计原则：
 * - 回答"我在哪，下一步做什么"
 * - 简洁清晰，一目了然
 * - 支持 --json 输出
 */

const chalk = require('chalk');
const { readState, isInitialized } = require('../state');
const { getPlatformDefinition } = require('../platforms');

/**
 * 显示状态信息
 * @param {Object} state - 状态对象
 */
function showStatus(state) {
  console.log('');
  console.log(chalk.cyan('  白鹿工作流状态'));
  console.log(chalk.gray('  ─────────────'));
  console.log('');
  
  // 基本信息
  console.log(chalk.white(`  版本: ${state.version}`));
  console.log(chalk.white(`  安装范围: ${state.scope === 'project' ? '当前项目' : '全局'}`));
  console.log(chalk.white(`  语言: ${state.language === 'zh' ? '中文' : 'English'}`));
  console.log(chalk.white(`  安装时间: ${state.installedAt}`));
  console.log('');
  
  // 平台状态
  const platformEntries = Object.entries(state.platforms || {});
  
  if (platformEntries.length > 0) {
    console.log(chalk.white('  已安装平台：'));
    
    platformEntries.forEach(([platformId, platformState]) => {
      const platform = getPlatformDefinition(platformId);
      if (platform && platformState.installed) {
        const skillCount = (platformState.skills || []).length;
        const agentCount = (platformState.agents || []).length;
        const commandCount = (platformState.commands || []).length;
        
        console.log(chalk.green(`    ✔ ${platform.name}`));
        console.log(chalk.gray(`      Skills: ${skillCount}, Agents: ${agentCount}, Commands: ${commandCount}`));
      }
    });
  } else {
    console.log(chalk.yellow('  尚未安装任何平台'));
  }
  
  console.log('');
  
  // 工作流状态
  const workflowEntries = Object.entries(state.workflows || {});
  
  if (workflowEntries.length > 0) {
    console.log(chalk.white('  已安装工作流：'));
    
    workflowEntries.forEach(([workflowId, workflowState]) => {
      console.log(chalk.green(`    ✔ ${workflowId} (v${workflowState.version})`));
    });
  }
  
  console.log('');
}

/**
 * 显示下一步指引
 * @param {Object} state - 状态对象
 */
function showNextSteps(state) {
  console.log(chalk.cyan('  🎯 下一步：'));
  console.log('');
  
  const platformEntries = Object.entries(state.platforms || {});
  const hasInstalledPlatforms = platformEntries.some(([, s]) => s.installed);
  
  if (hasInstalledPlatforms) {
    // 已安装，显示使用指引
    console.log(chalk.white('    在 Claude Code 或 Qoder 中运行：'));
    console.log(chalk.cyan('      /bailu-sdd-start  — 启动完整 SDD 研发流程'));
    console.log(chalk.cyan('      /bailu-hotfix     — 快速修复（跳过规划）'));
    console.log(chalk.cyan('      /bailu-tweak      — 小改动（跳过规划和设计）'));
    console.log('');
    console.log(chalk.white('    CLI 命令：'));
    console.log(chalk.cyan('      bailu update      — 更新工作流'));
    console.log(chalk.cyan('      bailu doctor      — 环境诊断'));
    console.log(chalk.cyan('      bailu reset       — 重置配置'));
  } else {
    // 未安装，显示安装指引
    console.log(chalk.white('    运行以下命令开始安装：'));
    console.log(chalk.cyan('      bailu init        — 交互式初始化'));
  }
  
  console.log('');
}

/**
 * 以 JSON 格式输出状态
 * @param {Object} state - 状态对象
 */
function showStatusAsJson(state) {
  const output = {
    version: state.version,
    scope: state.scope,
    language: state.language,
    installedAt: state.installedAt,
    platforms: state.platforms || {},
    workflows: state.workflows || {},
    nextSteps: []
  };
  
  const platformEntries = Object.entries(state.platforms || {});
  const hasInstalledPlatforms = platformEntries.some(([, s]) => s.installed);
  
  if (hasInstalledPlatforms) {
    output.nextSteps = [
      '/bailu-sdd-start — 启动完整 SDD 研发流程',
      '/bailu-hotfix — 快速修复',
      '/bailu-tweak — 小改动',
      'bailu update — 更新工作流',
      'bailu doctor — 环境诊断'
    ];
  } else {
    output.nextSteps = ['bailu init — 交互式初始化'];
  }
  
  console.log(JSON.stringify(output, null, 2));
}

/**
 * 主函数：运行 status 命令
 */
async function runStatus() {
  const cwd = process.cwd();
  
  try {
    // 检查是否已初始化
    const initialized = await isInitialized(cwd);
    
    if (!initialized) {
      console.log('');
      console.log(chalk.yellow('  尚未初始化白鹿工作流'));
      console.log('');
      console.log(chalk.white('  运行以下命令开始：'));
      console.log(chalk.cyan('    bailu init'));
      console.log('');
      return;
    }
    
    // 读取状态
    const state = await readState(cwd);
    
    if (!state) {
      console.log(chalk.red('  读取状态文件失败'));
      return;
    }
    
    // 检查是否需要 JSON 输出
    const options = process.argv.includes('--json');
    
    if (options) {
      showStatusAsJson(state);
    } else {
      showStatus(state);
      showNextSteps(state);
    }
    
  } catch (error) {
    console.error(chalk.red(`\n  获取状态失败: ${error.message}`));
    process.exit(1);
  }
}

// 导出
module.exports = { runStatus };
