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
const { confirm, select, checkbox } = require('@inquirer/prompts');
const path = require('path');
const os = require('os');
const { readState, writeState, createInitialState, isInitialized } = require('../state');
const { detectAllPlatforms, getDetectedPlatforms, getPlatformDefinition } = require('../platforms');
const { performInstallation, detectConflicts: detectConflictsFromInstaller } = require('../installer');

/**
 * 显示 Banner
 * ASCII art 采用 ANSI Shadow 字体，5 列字母 B-A-I-L-U
 */
function showBanner() {
  console.log(chalk.cyan(`
  ██████╗  █████╗ ██╗██╗     ██╗   ██╗
  ██╔══██╗██╔══██╗██║██║     ██║   ██║
  ██████╔╝███████║██║██║     ██║   ██║
  ██╔══██╗██╔══██║██║██║     ██║   ██║
  ██████╔╝██║  ██║██║███████╗╚██████╔╝
  ╚═════╝ ╚═╝  ╚═╝╚═╝╚══════╝ ╚═════╝
  `));
  console.log(chalk.cyan('  白鹿工作流 · 林深见鹿 · 在复杂的规则森林中，发现优雅的解决方案'));
  console.log();
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
    
    // 检测当前目录是否 Git 仓库
    // PRD 9.4 要求：检测 Git 仓库状态，但不阻断安装
    let isGitRepo = false;
    if (gitVersion) {
      try {
        const { execSync } = require('child_process');
        execSync('git rev-parse --is-inside-work-tree', {
          encoding: 'utf8',
          cwd,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        isGitRepo = true;
      } catch (error) {
        // 不是 Git 仓库，保持 false
      }
    }
    
    // 检测平台
    const platforms = await detectAllPlatforms(cwd);
    
    spinner.succeed('环境检测完成');
    
    return {
      nodeVersion,
      gitVersion,
      isGitRepo,
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
    
    // Git 仓库检测提示
    if (env.isGitRepo) {
      console.log(chalk.green('  ✔ 当前目录是 Git 仓库'));
    } else {
      console.log(chalk.yellow('  ⚠ 当前目录不是 Git 仓库（建议 git init 以便追溯工作流变更）'));
    }
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
 * 旧版白鹿 CLI 文件模式
 * 用于检测旧版安装
 * 
 * 注意：v2 manifest 已不包含 bailu-hotfix 和 bailu-tweak，
 * 仅保留真实存在的 SDD Skills
 */
const LEGACY_PATTERNS = {
  // Skills 目录模式
  skills: [
    'bailu-dev-workflow',
    'bailu-init',
    'bailu-sdd-start',
    'bailu-sdd-d1-planning',
    'bailu-sdd-d2-tech-design',
    'bailu-sdd-d3-tech-review',
    'bailu-sdd-d4-coding',
    'bailu-sdd-d4-git-branch',
    'bailu-sdd-d5-code-review',
    'bailu-sdd-d6-test-closure',
    'bailu-sdd-d7-publish',
    'bailu-sdd-openspec-workflow'
  ],
  // Agents 文件模式
  agents: [
    'architect',
    'planner',
    'developer',
    'reviewer',
    'tester'
  ],
  // Commands 文件模式
  commands: [
    'bailu-dev',
    'bailu-init',
    'bailu-sdd-start'
  ]
};

/**
 * 检查旧版配置
 * @param {string} cwd - 工作目录
 * @returns {Promise<Object>} 旧版配置检查结果
 */
async function checkLegacyConfig(cwd) {
  const fs = require('fs-extra');
  
  const result = {
    hasLegacy: false,
    legacyVersion: null,
    filesToRemove: [],
    filesToReview: []
  };
  
  // 检查各平台目录
  const platformDirs = [
    { id: 'claude-code', dir: '.claude' },
    { id: 'qoder', dir: '.qoder' }
  ];
  
  for (const platformEntry of platformDirs) {
    const platformDir = path.join(cwd, platformEntry.dir);
    
    if (!(await fs.pathExists(platformDir))) {
      continue;
    }
    
    // 获取完整的平台定义（包含 globalSkillsDir）
    const platform = getPlatformDefinition(platformEntry.id);
    if (!platform) continue;
    
    // 检查 Skills
    const skillsDir = path.join(platformDir, 'skills');
    if (await fs.pathExists(skillsDir)) {
      const entries = await fs.readdir(skillsDir);
      
      for (const entry of entries) {
        // 检查是否匹配旧版模式
        const isLegacy = LEGACY_PATTERNS.skills.some(pattern => 
          entry === pattern || entry.startsWith(pattern + '-')
        );
        
        if (isLegacy) {
          result.filesToRemove.push(`${platformEntry.dir}/skills/${entry}/`);
          result.hasLegacy = true;
        }
      }
    }
    
    // 检查 Agents（始终扫描全局 ~/.claude/agents/，因为 v2.1.0 起 agents 装在全局）
    const globalBase = platform.globalSkillsDir.replace('~', os.homedir()).replace('/skills', '');
    const agentDirGlobal = path.join(globalBase, 'agents');
    for (const agentDir of [path.join(platformDir, 'agents'), agentDirGlobal]) {
      if (await fs.pathExists(agentDir)) {
        const entries = await fs.readdir(agentDir);
        
        for (const entry of entries) {
          const isLegacy = LEGACY_PATTERNS.agents.some(pattern => 
            entry === `${pattern}.md` || entry.startsWith('bailu-')
          );
          
          if (isLegacy) {
            result.filesToRemove.push(path.join(agentDir, entry));
            result.hasLegacy = true;
          }
        }
      }
    }
    
    // 检查 Commands
    const commandsDir = path.join(platformDir, 'commands');
    if (await fs.pathExists(commandsDir)) {
      const entries = await fs.readdir(commandsDir);
      
      for (const entry of entries) {
        const isLegacy = LEGACY_PATTERNS.commands.some(pattern => 
          entry === `${pattern}.md` || entry.startsWith('bailu-')
        );
        
        if (isLegacy) {
          result.filesToRemove.push(`${platformEntry.dir}/commands/${entry}`);
          result.hasLegacy = true;
        }
      }
    }
  }
  
  // 检查需要用户注意的文件
  const reviewFiles = [
    { path: '~/.claude/CLAUDE.md', marker: '## 白鹿工作流系统' },
    { path: '~/.qoder/AGENTS.md', marker: '## 白鹿工作流系统' }
  ];
  
  for (const reviewFile of reviewFiles) {
    const expandedPath = reviewFile.path.replace('~', require('os').homedir());
    
    if (await fs.pathExists(expandedPath)) {
      const content = await fs.readFile(expandedPath, 'utf8');
      
      if (content.includes(reviewFile.marker)) {
        result.filesToReview.push(reviewFile.path);
        result.hasLegacy = true;
      }
    }
  }
  
  return result;
}

/**
 * 显示旧版迁移提示
 * @param {Object} legacy - 旧版配置检查结果
 * @param {Object} options - 命令选项
 * @returns {Promise<boolean>} 是否继续
 */
async function showLegacyMigration(legacy, options) {
  if (!legacy.hasLegacy) {
    return true;
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
    console.log(chalk.gray('    新版不再写入全局指令文件，工作流通过 Skills 入口触发。'));
    console.log(chalk.gray('    建议手动删除旧版路由规则段落，避免与新版冲突。'));
  }
  
  console.log('');
  
  // 如果有 --yes 或 --skip-existing，跳过确认
  if (options.yes || options.skipExisting) {
    return true;
  }
  
  // 询问是否清理
  const confirmed = await confirm({
    message: '是否清理上述旧版文件？',
    default: true
  });
  
  return confirmed;
}

/**
 * 执行旧版清理
 * @param {Object} legacy - 旧版配置检查结果
 * @param {string} cwd - 工作目录
 * @returns {Promise<boolean>} 是否成功
 */
async function performLegacyCleanup(legacy, cwd) {
  const fs = require('fs-extra');
  const os = require('os');
  
  if (!legacy.hasLegacy || legacy.filesToRemove.length === 0) {
    return true;
  }
  
  const spinner = ora('正在清理旧版文件...').start();
  
  try {
    // 创建备份目录
    const backupDir = path.join(cwd, '.bailu-backup');
    await fs.ensureDir(backupDir);
    
    // 备份并删除文件
    for (const file of legacy.filesToRemove) {
      const srcPath = path.join(cwd, file);
      const destPath = path.join(backupDir, file);
      
      if (await fs.pathExists(srcPath)) {
        // 备份
        await fs.ensureDir(path.dirname(destPath));
        await fs.copy(srcPath, destPath);
        
        // 删除
        await fs.remove(srcPath);
      }
    }
    
    spinner.succeed('旧版文件已清理（备份在 .bailu-backup/）');
    return true;
  } catch (error) {
    spinner.fail('清理旧版文件失败');
    console.error(chalk.red(`  错误: ${error.message}`));
    return false;
  }
}

/**
 * 选择安装范围
 * @param {Object} options - 命令选项
 * @returns {Promise<string>} 选择的范围
 */
async function selectScope(options) {
  // 如果有 --yes 参数，使用默认值
  if (options.yes || options.scope) {
    return options.scope || 'project';
  }
  
  return await select({
    message: '安装范围：',
    choices: [
      { name: '当前项目（推荐）', value: 'project' },
      { name: '全局（~/.claude/ 等 home 目录）', value: 'global' }
    ],
    default: 'project'
  });
}

/**
 * 选择语言
 * @param {Object} options - 命令选项
 * @returns {Promise<string>} 选择的语言
 */
async function selectLanguage(options) {
  // 如果有 --yes 参数，使用默认值
  if (options.yes || options.lang) {
    return options.lang || 'zh';
  }
  
  return await select({
    message: 'Skills 语言：',
    choices: [
      { name: '中文', value: 'zh' },
      { name: 'English', value: 'en' }
    ],
    default: 'zh'
  });
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
  
  // 如果有 --yes 参数，自动选择所有检测到的平台
  if (options.yes) {
    return detectedPlatforms.map(p => p.id);
  }
  
  // 如果有多个平台，让用户选择
  return await checkbox({
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
  });
}

/**
 * 检测冲突
 * @param {string[]} platformIds - 选择的平台 ID 列表
 * @param {string} scope - 安装范围
 * @param {string} cwd - 工作目录
 * @returns {Promise<Object>} 冲突检测结果
 */
async function detectConflictsLocal(platformIds, scope, cwd) {
  const fs = require('fs-extra');
  const os = require('os');
  
  const result = {
    hasConflicts: false,
    conflicts: {}
  };
  
  for (const platformId of platformIds) {
    const platform = getPlatformDefinition(platformId);
    if (!platform) continue;
    
    // 确定基础目录
    const baseDir = scope === 'global'
      ? platform.globalSkillsDir.replace('~', os.homedir()).replace('/skills', '')
      : path.join(cwd, platform.skillsDir.replace('/skills', ''));
    
    const platformConflicts = {
      skills: false,
      agents: false,
      commands: false
    };
    
    // 检查 Skills
    const skillsDir = path.join(baseDir, 'skills');
    if (await fs.pathExists(skillsDir)) {
      const entries = await fs.readdir(skillsDir);
      platformConflicts.skills = entries.some(e => e.startsWith('bailu-'));
    }
    
    // 检查 Agents（始终检查全局 ~/.claude/agents/）
    const globalBase = platform.globalSkillsDir.replace('~', os.homedir()).replace('/skills', '');
    const agentsDir = path.join(globalBase, 'agents');
    if (await fs.pathExists(agentsDir)) {
      const entries = await fs.readdir(agentsDir);
      platformConflicts.agents = entries.some(e => e.startsWith('bailu-'));
    }
    
    // 检查 Commands
    const commandsDir = path.join(baseDir, 'commands');
    if (await fs.pathExists(commandsDir)) {
      const entries = await fs.readdir(commandsDir);
      platformConflicts.commands = entries.some(e => e.startsWith('bailu-'));
    }
    
    // 如果有任何冲突
    if (platformConflicts.skills || platformConflicts.agents || platformConflicts.commands) {
      result.conflicts[platformId] = platformConflicts;
      result.hasConflicts = true;
    }
  }
  
  return result;
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
  
  // 显示冲突详情
  console.log('');
  console.log(chalk.yellow('  ⚠ 检测到已有白鹿工作流安装：'));
  
  for (const [platformId, platformConflicts] of Object.entries(conflicts.conflicts)) {
    const platform = getPlatformDefinition(platformId);
    if (!platform) continue;
    
    const conflictTypes = [];
    if (platformConflicts.skills) conflictTypes.push('Skills');
    if (platformConflicts.agents) conflictTypes.push('Agents');
    if (platformConflicts.commands) conflictTypes.push('Commands');
    
    console.log(chalk.yellow(`    ${platform.name}: ${conflictTypes.join(', ')}`));
  }
  
  console.log('');
  
  // 询问用户
  const strategy = await select({
    message: '如何处理已有安装？',
    choices: [
      { name: '全部覆盖（Overwrite all）', value: 'overwrite' },
      { name: '全部跳过（Skip all）', value: 'skip' },
      { name: '逐个选择（Choose per component）', value: 'per-component' }
    ],
    default: 'skip'
  });
  
  // 如果选择逐个选择
  if (strategy === 'per-component') {
    return await resolveConflictsPerComponent(conflicts);
  }
  
  return { strategy };
}

/**
 * 逐个解决冲突
 * @param {Object} conflicts - 冲突检测结果
 * @returns {Promise<Object>} 解决方案
 */
async function resolveConflictsPerComponent(conflicts) {
  const decisions = {};
  
  for (const [platformId, platformConflicts] of Object.entries(conflicts.conflicts)) {
    const platform = getPlatformDefinition(platformId);
    if (!platform) continue;
    
    decisions[platformId] = {};
    
    // 询问每个冲突组件
    for (const [component, hasConflict] of Object.entries(platformConflicts)) {
      if (!hasConflict) continue;
      
      const componentName = component === 'skills' ? 'Skills' 
        : component === 'agents' ? 'Agents' 
        : 'Commands';
      
      const decision = await select({
        message: `${platform.name} 已有 ${componentName} 安装，如何处理？`,
        choices: [
          { name: '覆盖（Overwrite）', value: 'overwrite' },
          { name: '跳过（Skip）', value: 'skip' }
        ],
        default: 'skip'
      });
      
      decisions[platformId][component] = decision;
    }
  }
  
  return { strategy: 'per-component', decisions };
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
async function performInstallationWrapper(platformIds, scope, language, conflictResolution, cwd, options = {}) {
  const spinner = ora('正在安装白鹿工作流...').start();
  
  try {
    spinner.stop();
    
    // 执行三阶段安装（透传 options 以支持 --yes 跳过 MCP 交互）
    const result = await performInstallation(platformIds, scope, language, cwd, options);
    
    return result;
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
    const shouldContinue = await showLegacyMigration(legacy, options);
    
    if (!shouldContinue) {
      console.log(chalk.gray('  已取消初始化'));
      return;
    }
    
    // 4. 清理旧版文件
    if (legacy.hasLegacy) {
      await performLegacyCleanup(legacy, cwd);
    }
    
    // 5. 选择安装范围
    const scope = await selectScope(options);
    
    // 6. 选择语言
    const language = await selectLanguage(options);
    
    // 7. 选择目标平台
    const detectedPlatforms = env.platforms.filter(p => p.detected);
    
    if (detectedPlatforms.length === 0) {
      console.log(chalk.red('\n  未检测到任何 AI 工具，请先安装 Claude Code 或 Qoder 编辑器'));
      console.log(chalk.gray('  Claude Code: https://claude.ai/code'));
      console.log(chalk.gray('  Qoder: https://qoder.ai'));
      return;
    }
    
    const selectedPlatforms = await selectPlatforms(detectedPlatforms, options);
    
    // 8. 检测冲突
    const conflicts = await detectConflictsLocal(selectedPlatforms, scope, cwd);
    const conflictResolution = await resolveConflicts(conflicts, options);
    
    // 9. 执行安装
    const result = await performInstallationWrapper(
      selectedPlatforms,
      scope,
      language,
      conflictResolution,
      cwd,
      options
    );
    
    // 10. 保存状态
    // 使用 result.details 填充实际安装的文件列表，而非空数组
    // 传入 cwd 让 createInitialState 能填充 project.name/path
    const state = createInitialState({ scope, language, projectPath: cwd });
    state.platforms = {};
    
    // MCP 状态：从任一平台的 details 汇总（全局 MCP 是平台无关的）
    const installedMcpServers = new Set();
    
    selectedPlatforms.forEach(platformId => {
      const isInstalled = result.installed.includes(platformId);
      const detail = (result.details && result.details[platformId]) || {};
      
      state.platforms[platformId] = {
        installed: isInstalled,
        skills: detail.skills || [],
        agents: detail.agents || [],
        commands: detail.commands || [],
        installedAt: new Date().toISOString().split('T')[0]
      };
      
      // 汇总 MCP
      (detail.mcp || []).forEach(name => installedMcpServers.add(name));
    });
    
    // 状态文件顶层 mcp 节点
    if (installedMcpServers.size > 0) {
      state.mcp = {};
      installedMcpServers.forEach(name => {
        state.mcp[name] = true;
      });
    }
    
    await writeState(state, cwd);
    
    // 11. 显示完成摘要
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
