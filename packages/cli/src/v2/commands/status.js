/**
 * @fileoverview 白鹿 CLI v2 status 命令
 * 
 * 查看当前状态和下一步指引
 * 
 * 设计原则：
 * - 回答"我在哪，下一步做什么"
 * - 简洁清晰，一目了然
 * - 支持 --json 输出
 * 
 * PRD 3.3 输出要素：
 * - 项目路径
 * - 工作流版本
 * - 已安装平台 + 各组件计数
 * - SDD 当前阶段（如有 .sdd/sdd-context.md）
 * - MCP 配置状态
 * - 上次更新时间
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const { readState, isInitialized } = require('../state');
const { getPlatformDefinition } = require('../platforms');

/**
 * 读取 SDD 当前阶段
 * 
 * 扫描 .sdd/sdd-context.md，从中提取当前阶段标识（如 D1/D2/D3/D4/D5/D6/D7）
 * 找不到则返回 null
 * 
 * @param {string} cwd - 工作目录
 * @returns {Promise<{stage: string, file: string}|null>} 当前阶段，找不到返回 null
 */
async function readSddStage(cwd) {
  const sddContextPath = path.join(cwd, '.sdd', 'sdd-context.md');
  
  if (!(await fs.pathExists(sddContextPath))) {
    return null;
  }
  
  try {
    const content = await fs.readFile(sddContextPath, 'utf8');
    
    // 匹配常见格式：
    //   当前阶段：D3
    //   current_stage: D3
    //   ## 当前阶段：D3 - xxx
    //   - stage: D3
    const patterns = [
      /current[_-]stage\s*[:=]\s*(D[1-7])/i,
      /当前阶段\s*[：:]\s*(D[1-7])/,
      /^##?\s*(?:当前阶段|Stage)\s*[：:]\s*(D[1-7])/im,
      /^-?\s*stage\s*[:=]\s*(D[1-7])/im
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return { stage: match[1].toUpperCase(), file: '.sdd/sdd-context.md' };
      }
    }
    
    // 都没匹配，但文件存在，说明可能刚启动
    return { stage: '未知', file: '.sdd/sdd-context.md' };
  } catch (error) {
    return null;
  }
}

/**
 * 阶段对应的中文名称
 */
const SDD_STAGE_NAMES = {
  D1: '需求规划',
  D2: '技术设计',
  D3: '技术评审',
  D4: '编码实现',
  D5: '代码审查',
  D6: '测试收尾',
  D7: '发布部署'
};

/**
 * 显示状态信息
 * @param {Object} state - 状态对象
 * @param {string} cwd - 工作目录
 * @param {Object|null} sddStage - SDD 阶段信息
 */
function showStatus(state, cwd, sddStage) {
  console.log('');
  console.log(chalk.cyan('  白鹿工作流状态'));
  console.log(chalk.gray('  ─────────────'));
  console.log('');
  
  // 基本信息
  console.log(chalk.white(`  项目路径: ${cwd}`));
  console.log(chalk.white(`  CLI 版本: ${state.version}`));
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
        const updatedAt = platformState.installedAt || '未知';
        
        console.log(chalk.green(`    ✔ ${platform.name}`));
        console.log(chalk.gray(`      Skills: ${skillCount}, Agents: ${agentCount}, Commands: ${commandCount}`));
        console.log(chalk.gray(`      上次更新: ${updatedAt}`));
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
      console.log(chalk.green(`    ✔ ${workflowId} (v${workflowState.version || state.version})`));
    });
    console.log('');
  }
  
  // MCP 状态
  const mcpEntries = Object.entries(state.mcp || {});
  if (mcpEntries.length > 0) {
    const enabled = mcpEntries.filter(([, v]) => v).map(([k]) => k);
    if (enabled.length > 0) {
      console.log(chalk.white(`  MCP 服务: ${enabled.join(', ')}`));
      console.log('');
    }
  }
  
  // SDD 进度
  if (sddStage) {
    const stageName = SDD_STAGE_NAMES[sddStage.stage] || '';
    const stageDisplay = stageName ? `${sddStage.stage} - ${stageName}` : sddStage.stage;
    console.log(chalk.cyan(`  📍 SDD 当前阶段: ${stageDisplay}`));
    console.log(chalk.gray(`     文件: ${sddStage.file}`));
    console.log('');
  }
}

/**
 * 显示下一步指引
 * @param {Object} state - 状态对象
 * @param {Object|null} sddStage - SDD 阶段信息
 */
function showNextSteps(state, sddStage) {
  console.log(chalk.cyan('  🎯 下一步：'));
  console.log('');
  
  const platformEntries = Object.entries(state.platforms || {});
  const hasInstalledPlatforms = platformEntries.some(([, s]) => s.installed);
  
  if (!hasInstalledPlatforms) {
    // 未安装，显示安装指引
    console.log(chalk.white('    运行以下命令开始安装：'));
    console.log(chalk.cyan('      bailu init        — 交互式初始化'));
    console.log('');
    return;
  }
  
  // 如果正在 SDD 流程中，给出阶段相关提示
  if (sddStage && sddStage.stage !== '未知') {
    const stageName = SDD_STAGE_NAMES[sddStage.stage] || '';
    console.log(chalk.white(`    当前处于 ${sddStage.stage}${stageName ? '（' + stageName + '）' : ''}阶段，继续在 Claude Code / Qoder 中推进`));
    console.log('');
  }
  
  // 已安装，显示使用指引
  console.log(chalk.white('    在 Claude Code 或 Qoder 中运行：'));
  console.log(chalk.cyan('      /bailu-sdd-start  — 启动完整 SDD 研发流程'));
  console.log('');
  console.log(chalk.white('    CLI 命令：'));
  console.log(chalk.cyan('      bailu update      — 更新工作流'));
  console.log(chalk.cyan('      bailu doctor      — 环境诊断'));
  console.log(chalk.cyan('      bailu reset       — 重置配置'));
  console.log('');
}

/**
 * 以 JSON 格式输出状态
 * @param {Object} state - 状态对象
 * @param {string} cwd - 工作目录
 * @param {Object|null} sddStage - SDD 阶段信息
 */
function showStatusAsJson(state, cwd, sddStage) {
  const output = {
    projectPath: cwd,
    project: state.project || { name: path.basename(cwd), path: cwd },
    version: state.version,
    scope: state.scope,
    language: state.language,
    installedAt: state.installedAt,
    platforms: state.platforms || {},
    workflows: state.workflows || {},
    mcp: state.mcp || {},
    sdd: sddStage ? {
      currentStage: sddStage.stage,
      stageName: SDD_STAGE_NAMES[sddStage.stage] || null,
      contextFile: sddStage.file
    } : null,
    nextSteps: []
  };
  
  const platformEntries = Object.entries(state.platforms || {});
  const hasInstalledPlatforms = platformEntries.some(([, s]) => s.installed);
  
  if (hasInstalledPlatforms) {
    output.nextSteps = [
      '/bailu-sdd-start — 启动完整 SDD 研发流程',
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
 * @param {Object} [options] - 命令选项（含全局选项 --json/--scope 等）
 */
async function runStatus(options = {}) {
  const cwd = process.cwd();
  
  try {
    // 检查是否已初始化
    const initialized = await isInitialized(cwd);
    
    // 检查是否需要 JSON 输出（优先从 options 取，后兼容 process.argv）
    const isJson = options.json === true || process.argv.includes('--json');
    
    if (!initialized) {
      // 未初始化状态：根据是否 --json 决定输出格式
      if (isJson) {
        console.log(JSON.stringify({
          initialized: false,
          projectPath: cwd,
          message: '尚未初始化白鹿工作流',
          nextSteps: ['bailu init — 交互式初始化']
        }, null, 2));
      } else {
        console.log('');
        console.log(chalk.yellow('  尚未初始化白鹿工作流'));
        console.log('');
        console.log(chalk.white('  运行以下命令开始：'));
        console.log(chalk.cyan('    bailu init'));
        console.log('');
      }
      return;
    }
    
    // 读取状态
    const state = await readState(cwd);
    
    if (!state) {
      console.log(chalk.red('  读取状态文件失败'));
      return;
    }
    
    // 读取 SDD 阶段（如果存在）
    const sddStage = await readSddStage(cwd);
    
    // isJson 已在上方声明，直接使用
    
    if (isJson) {
      showStatusAsJson(state, cwd, sddStage);
    } else {
      showStatus(state, cwd, sddStage);
      showNextSteps(state, sddStage);
    }
    
  } catch (error) {
    console.error(chalk.red(`\n  获取状态失败: ${error.message}`));
    process.exit(1);
  }
}

// 导出
module.exports = { runStatus };