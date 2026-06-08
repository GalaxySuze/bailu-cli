/**
 * @fileoverview 白鹿 CLI v2 init 命令
 * 
 * 交互式初始化向导，整个产品的核心入口
 * 
 * 流程设计（参考 Comet 10 步）：
 * 1. Banner 展示
 * 2. 显示工作目录
 * 3. 环境检测
 * 4. 旧版迁移清理（如有）
 * 5. 选择安装范围
 * 6. 选择语言
 * 7. 选择目标平台
 * 8. 冲突检测与解决
 * 9. 三阶段安装
 * 10. 完成摘要
 */

const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const path = require('path');
const { readState, writeState, createInitialState, isInitialized } = require('../state');
const { detectAllPlatforms, getDetectedPlatforms, getPlatformDefinition } = require('../platforms');

/**
 * 显示 Banner
 */
function showBanner() {
  console.log(chalk.cyan(`
   ██████╗  █████╗ ██╗██╗   ██╗
   ██╔══██╗██╔══██╗██║██║   ██║
   ██████╔╝███████║██║██║   ██║
   ██╔══██╗██╔══██║██║██║   ██║
   ██████╔╝██║  ██║██║╚██████╔╝
   ╚═════╝ ╚═╝  ╚═╝╚═╝ ╚═════╝
           白鹿工作流 · 林深见鹿
  `));
}

/**
 * 检测环境
 * @param {string} cwd - 工作目录
 * @returns {Promise<Object>} 环境信息
 */
async function detectEnvironment(cwd) {
  const spinner = ora('正在检测环境...').start();
  
  try {
    // 检测 Node.js
    const nodeVersion = process.version;
    
    // 检测 Git
    let gitVersion = null;
    try {
      const { execSync } = require('child_process');
      gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
    } catch (error) {
      // Git 未安装
    }
    
    // 检测平台
    const platforms = await detectAllPlatforms(cwd);
    
    spinner.succeed('环境检测完成');
    
    return {
      nodeVersion,
      gitVersion,
      platforms
    };
  } catch (error) {
    spinner.fail('环境检测失败');
    throw error;
  }
}

/**
 * 显示环境检测结果
 * @param {Object} env - 环境信息
 */
function showEnvironment(env) {
  console.log('');
  console.log(chalk.green(`  ✔ Node.js ${env.nodeVersion}`));
  
  if (env.gitVersion) {
    console.log(chalk.green(`  ✔ ${env.gitVersion}`));
  } else {
    console.log(chalk.yellow('  ⚠ Git 未安装（建议安装以获得完整功能）'));
  }
  
  console.log('');
  
  // 显示检测到的平台
  const detected = env.platforms.filter(p => p.detected);
  const notDetected = env.platforms.filter(p => !p.detected);
  
  if (detected.length > 0) {
    console.log(chalk.green('  检测到的 AI 工具：'));
    detected.forEach(p => {
      const versionStr = p.version ? ` (v${p.version})` : '';
      console.log(chalk.green(`    ✔ ${p.name}${versionStr}`));
    });
  }
  
  if (notDetected.length > 0) {
    console.log(chalk.gray('\n  未检测到：'));
    notDetected.forEach(p => {
      console.log(chalk.gray(`    ○ ${p.name}`));
    });
  }
}

/**
 * 检查旧版配置
 * @param {string} cwd - 工作目录
 * @returns {Promise<Object>} 旧版配置检查结果
 */
async function checkLegacyConfig(cwd) {
  // TODO: 实现旧版配置检测
  // 检查是否存在旧版 bailu CLI 配置
  // 返回 { hasLegacy: boolean, filesToRemove: string[], filesToReview: string[] }
  return {
    hasLegacy: false,
    filesToRemove: [],
    filesToReview: []
  };
}

/**
 * 显示旧版迁移提示
 * @param {Object} legacy - 旧版配置检查结果
 */
function showLegacyMigration(legacy) {
  if (!legacy.hasLegacy) {
    return;
  }
  
  console.log('');
  console.log(chalk.yellow('  ⚠ 检测到旧版白鹿 CLI 配置'));
  
  if (legacy.filesToRemove.length > 0) {
    console.log(chalk.yellow('\n  以下文件将被自动清理（不含用户自定义内容）：'));
    legacy.filesToRemove.forEach(file => {
      console.log(chalk.yellow(`    • ${file}`));
    });
  }
  
  if (legacy.filesToReview.length > 0) {
    console.log(chalk.yellow('\n  需要你注意（可能包含自定义内容，不会自动删除）：'));
    legacy.filesToReview.forEach(file => {
      console.log(chalk.yellow(`    • ${file}`));
    });
  }
}

/**
 * 选择安装范围
 * @param {Object} options - 命令选项
 * @returns {Promise<string>} 选择的范围
 */
async function selectScope(options) {
  if (options.scope) {
    return options.scope;
  }
  
  const { scope } = await inquirer.prompt([
    {
      type: 'list',
      name: 'scope',
      message: '安装范围：',
      choices: [
        { name: '当前项目（推荐）', value: 'project' },
        { name: '全局（~/.claude/ 等 home 目录）', value: 'global' }
      ],
      default: 'project'
    }
  ]);
  
  return scope;
}

/**
 * 选择语言
 * @param {Object} options - 命令选项
 * @returns {Promise<string>} 选择的语言
 */
async function selectLanguage(options) {
  if (options.lang) {
    return options.lang;
  }
  
  const { language } = await inquirer.prompt([
    {
      type: 'list',
      name: 'language',
      message: 'Skills 语言：',
      choices: [
        { name: '中文', value: 'zh' },
        { name: 'English', value: 'en' }
      ],
      default: 'zh'
    }
  ]);
  
  return language;
}

/**
 * 选择目标平台
 * @param {Object[]} detectedPlatforms - 检测到的平台
 * @param {Object} options - 命令选项
 * @returns {Promise<string[]>} 选择的平台 ID 列表
 */
async function selectPlatforms(detectedPlatforms, options) {
  // 如果只有一个平台且已检测到，自动选择
  if (detectedPlatforms.length === 1) {
    return [detectedPlatforms[0].id];
  }
  
  // 如果有多个平台，让用户选择
  const { platforms } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'platforms',
      message: '选择目标平台：',
      choices: detectedPlatforms.map(p => ({
        name: `${p.name}${p.version ? ` (v${p.version})` : ''}`,
        value: p.id,
        checked: true
      })),
      validate: (answer) => {
        if (answer.length === 0) {
          return '请至少选择一个平台';
        }
        return true;
      }
    }
  ]);
  
  return platforms;
}

/**
 * 检测冲突
 * @param {string[]} platformIds - 选择的平台 ID 列表
 * @param {string} scope - 安装范围
 * @param {string} cwd - 工作目录
 * @returns {Promise<Object>} 冲突检测结果
 */
async function detectConflicts(platformIds, scope, cwd) {
  // TODO: 实现冲突检测
  // 检查每个平台是否已有白鹿工作流安装
  // 返回 { hasConflicts: boolean, conflicts: { platformId: { skills: boolean, agents: boolean, commands: boolean } } }
  return {
    hasConflicts: false,
    conflicts: {}
  };
}

/**
 * 解决冲突
 * @param {Object} conflicts - 冲突检测结果
 * @param {Object} options - 命令选项
 * @returns {Promise<Object>} 解决方案
 */
async function resolveConflicts(conflicts, options) {
  if (!conflicts.hasConflicts) {
    return { strategy: 'none' };
  }
  
  // 如果有 --yes 或 --overwrite，默认覆盖
  if (options.yes || options.overwrite) {
    return { strategy: 'overwrite' };
  }
  
  // 如果有 --skip-existing，默认跳过
  if (options.skipExisting) {
    return { strategy: 'skip' };
  }
  
  // 询问用户
  const { strategy } = await inquirer.prompt([
    {
      type: 'list',
      name: 'strategy',
      message: '检测到已有安装，如何处理？',
      choices: [
        { name: '全部覆盖（Overwrite all）', value: 'overwrite' },
        { name: '全部跳过（Skip all）', value: 'skip' },
        { name: '逐个选择（Choose per component）', value: 'per-component' }
      ],
      default: 'skip'
    }
  ]);
  
  return { strategy };
}

/**
 * 执行安装
 * @param {string[]} platformIds - 平台 ID 列表
 * @param {string} scope - 安装范围
 * @param {string} language - 语言
 * @param {Object} conflictResolution - 冲突解决方案
 * @param {string} cwd - 工作目录
 * @returns {Promise<Object>} 安装结果
 */
async function performInstallation(platformIds, scope, language, conflictResolution, cwd) {
  const spinner = ora('正在安装白鹿工作流...').start();
  
  try {
    // TODO: 实现三阶段安装
    // Phase 1: Skills 部署
    // Phase 2: Agent & Commands 配置
    // Phase 3: MCP 服务（可选）
    
    // 模拟安装过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    spinner.succeed('安装完成');
    
    return {
      success: true,
      installed: platformIds,
      skipped: [],
      failed: []
    };
  } catch (error) {
    spinner.fail('安装失败');
    throw error;
  }
}

/**
 * 显示完成摘要
 * @param {Object} result - 安装结果
 * @param {string} language - 语言
 */
function showCompletionSummary(result, language) {
  console.log('');
  console.log(chalk.green('  ✅ 白鹿工作流安装完成！'));
  console.log('');
  
  if (result.installed.length > 0) {
    console.log(chalk.green('  已安装：'));
    result.installed.forEach(platformId => {
      const platform = getPlatformDefinition(platformId);
      if (platform) {
        console.log(chalk.green(`    ${platform.name} → ${platform.skillsDir}/`));
      }
    });
  }
  
  if (result.skipped.length > 0) {
    console.log(chalk.yellow('\n  已跳过：'));
    result.skipped.forEach(platformId => {
      const platform = getPlatformDefinition(platformId);
      if (platform) {
        console.log(chalk.yellow(`    ${platform.name}`));
      }
    });
  }
  
  if (result.failed.length > 0) {
    console.log(chalk.red('\n  失败：'));
    result.failed.forEach(platformId => {
      const platform = getPlatformDefinition(platformId);
      if (platform) {
        console.log(chalk.red(`    ${platform.name}`));
      }
    });
  }
  
  console.log('');
  console.log(chalk.cyan('  🎯 下一步：'));
  console.log(chalk.cyan('    /bailu-sdd-start  — 启动 SDD 研发流程'));
  console.log(chalk.cyan('    /bailu-hotfix     — 快速修复'));
  console.log(chalk.cyan('    /bailu-tweak      — 小改动'));
  console.log(chalk.cyan('    bailu status      — 随时查看进度'));
  console.log('');
}

/**
 * 主函数：运行 init 命令
 * @param {Object} options - 命令选项
 */
async function runInit(options = {}) {
  const cwd = process.cwd();
  
  try {
    // 1. 显示 Banner
    showBanner();
    
    console.log(chalk.gray(`  Setting up Bailu in ${cwd}`));
    console.log('');
    
    // 2. 检测环境
    const env = await detectEnvironment(cwd);
    showEnvironment(env);
    
    // 3. 检查旧版配置
    const legacy = await checkLegacyConfig(cwd);
    showLegacyMigration(legacy);
    
    // 4. 选择安装范围
    const scope = await selectScope(options);
    
    // 5. 选择语言
    const language = await selectLanguage(options);
    
    // 6. 选择目标平台
    const detectedPlatforms = env.platforms.filter(p => p.detected);
    
    if (detectedPlatforms.length === 0) {
      console.log(chalk.red('\n  未检测到任何 AI 工具，请先安装 Claude Code 或 Qoder 编辑器'));
      console.log(chalk.gray('  Claude Code: https://claude.ai/code'));
      console.log(chalk.gray('  Qoder: https://qoder.ai'));
      return;
    }
    
    const selectedPlatforms = await selectPlatforms(detectedPlatforms, options);
    
    // 7. 检测冲突
    const conflicts = await detectConflicts(selectedPlatforms, scope, cwd);
    const conflictResolution = await resolveConflicts(conflicts, options);
    
    // 8. 执行安装
    const result = await performInstallation(
      selectedPlatforms,
      scope,
      language,
      conflictResolution,
      cwd
    );
    
    // 9. 保存状态
    const state = createInitialState({ scope, language });
    state.platforms = {};
    selectedPlatforms.forEach(platformId => {
      state.platforms[platformId] = {
        installed: true,
        skills: [],
        agents: [],
        commands: [],
        installedAt: new Date().toISOString().split('T')[0]
      };
    });
    
    await writeState(state, cwd);
    
    // 10. 显示完成摘要
    showCompletionSummary(result, language);
    
  } catch (error) {
    console.error(chalk.red(`\n  初始化失败: ${error.message}`));
    
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: error.message }, null, 2));
    }
    
    process.exit(1);
  }
}

// 导出
module.exports = { runInit };
