/**
 * @fileoverview 白鹿 CLI v2 安装器
 * 
 * 简化设计：
 * - 只支持 Claude Code + Qoder 编辑器
 * - 清单驱动安装（manifest.json 控制安装内容）
 * - 三阶段安装流程
 * 
 * 清单驱动原则：新增/删除 Skill 只改 manifest.json，不改安装逻辑
 * 参考 Comet CLI 的设计模式
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPlatformDefinition } = require('./platforms');

/**
 * 清单文件路径
 */
const MANIFEST_PATH = path.join(__dirname, '../../assets/manifest.json');

/**
 * 读取清单文件
 * @returns {Promise<Object>} 清单内容
 */
async function readManifest() {
  try {
    if (await fs.pathExists(MANIFEST_PATH)) {
      return await fs.readJson(MANIFEST_PATH);
    }
  } catch (error) {
    console.error(chalk.red(`读取清单文件失败: ${error.message}`));
  }
  
  return null;
}

/**
 * 阶段 1：部署 Skills（清单驱动）
 * 
 * 按 manifest.json components.skills 列表逐一复制，
 * 只复制清单中出现的 Skill，不扫描目录
 * 
 * @param {string} platformId - 平台 ID
 * @param {string} scope - 安装范围 (project/global)
 * @param {string} language - 语言 (zh/en)
 * @param {string} cwd - 工作目录
 * @returns {Promise<Object>} 安装结果
 */
async function installSkills(platformId, scope, language, cwd) {
  const platform = getPlatformDefinition(platformId);
  if (!platform) {
    throw new Error(`未知平台: ${platformId}`);
  }
  
  // 读取清单
  const manifest = await readManifest();
  if (!manifest || !manifest.components || !manifest.components.skills) {
    return { success: false, message: '清单文件无效或缺少 skills 配置', installed: [] };
  }
  
  const skillList = manifest.components.skills;
  
  // 确定目标目录
  const targetDir = scope === 'global' 
    ? platform.globalSkillsDir.replace('~', require('os').homedir())
    : path.join(cwd, platform.skillsDir);
  
  // 确定源目录（根据语言）
  const sourceDir = language === 'zh' 
    ? path.join(__dirname, '../../assets/skills-zh')
    : path.join(__dirname, '../../assets/skills');
  
  // 按清单复制 Skills
  const installed = [];
  let hasSource = false;
  
  for (const skillName of skillList) {
    const srcPath = path.join(sourceDir, skillName, 'SKILL.md');
    const destPath = path.join(targetDir, skillName, 'SKILL.md');
    
    // 检查 SKILL.md 是否存在
    if (!(await fs.pathExists(srcPath))) {
      console.error(chalk.yellow(`    ⚠ 技能 ${skillName} 的 SKILL.md 不存在，跳过`));
      continue;
    }
    hasSource = true;
    
    try {
      await fs.ensureDir(path.join(targetDir, skillName));
      await fs.copy(srcPath, destPath, { overwrite: true });
      
      // 同时复制 references/ 子目录（如果存在）
      const refSrc = path.join(sourceDir, skillName, 'references');
      if (await fs.pathExists(refSrc)) {
        const refDest = path.join(targetDir, skillName, 'references');
        await fs.ensureDir(refDest);
        await fs.copy(refSrc, refDest, { overwrite: true });
      }
      
      installed.push(skillName);
    } catch (error) {
      console.error(chalk.red(`    ✖ 复制失败 ${skillName}: ${error.message}`));
    }
  }
  
  if (!hasSource) {
    return { success: false, message: `源目录不存在: ${sourceDir}`, installed: [] };
  }
  
  return {
    success: true,
    installed,
    targetDir
  };
}

/**
 * 阶段 2：配置 Agent 和 Commands
 * @param {string} platformId - 平台 ID
 * @param {string} scope - 安装范围
 * @param {string} cwd - 工作目录
 * @returns {Promise<Object>} 安装结果
 */
async function installAgentAndCommands(platformId, scope, cwd) {
  const platform = getPlatformDefinition(platformId);
  if (!platform) {
    throw new Error(`未知平台: ${platformId}`);
  }
  
  // 读取清单，获取 agents/commands 列表
  const manifest = await readManifest();
  const agentList = (manifest && manifest.components && manifest.components.agents) || [];
  const commandList = (manifest && manifest.components && manifest.components.commands) || [];
  
  // 确定基础目录（用于 skills 和 commands）
  const baseDir = scope === 'global'
    ? platform.globalSkillsDir.replace('~', require('os').homedir()).replace('/skills', '')
    : path.join(cwd, platform.skillsDir.replace('/skills', ''));
  
  // Agents 始终装到全局目录
  // 原因：Claude Code 的 /agents 命令只扫描 ~/.claude/agents/，
  //       不扫描项目级 .claude/agents/，装到项目级会导致用户在
  //       Claude Code 中看不到白鹿的 agent
  const globalBase = platform.globalSkillsDir.replace('~', require('os').homedir()).replace('/skills', '');
  
  // 安装 Agents（始终全局）
  const installedAgents = [];
  const agentDir = path.join(globalBase, 'agents');
  
  for (const agentName of agentList) {
    const agentSource = path.join(__dirname, `../../assets/agents/${agentName}.md`);
    if (await fs.pathExists(agentSource)) {
      await fs.ensureDir(agentDir);
      await fs.copy(agentSource, path.join(agentDir, `${agentName}.md`), { overwrite: true });
      installedAgents.push(`${agentName}.md`);
    }
  }
  
  // 安装 Commands
  const installedCommands = [];
  const commandsDir = path.join(baseDir, 'commands');
  
  for (const cmdName of commandList) {
    const cmdSource = path.join(__dirname, `../../assets/commands/${cmdName}.md`);
    if (await fs.pathExists(cmdSource)) {
      await fs.ensureDir(commandsDir);
      await fs.copy(cmdSource, path.join(commandsDir, `${cmdName}.md`), { overwrite: true });
      installedCommands.push(`${cmdName}.md`);
    }
  }
  
  return {
    success: true,
    agents: installedAgents,
    commands: installedCommands
  };
}

/**
 * MCP 服务器配置定义
 * 从 manifest.json 读取
 * @returns {Promise<Object>} MCP 配置模板
 */
async function getMcpConfigs() {
  const manifest = await readManifest();
  if (manifest && manifest.mcpConfigs) {
    return manifest.mcpConfigs;
  }
  return {};
}

/**
 * 获取 Claude Code 的 MCP 配置文件路径
 * @param {string} scope - 安装范围
 * @param {string} cwd - 工作目录
 * @returns {Promise<string>} 配置文件路径
 */
async function getMcpSettingsPath(scope, cwd) {
  if (scope === 'global') {
    // 全局：~/.claude.json
    const homedir = require('os').homedir();
    return path.join(homedir, '.claude.json');
  }
  
  // 项目级：.claude/settings.local.json
  return path.join(cwd, '.claude', 'settings.local.json');
}

/**
 * 安全写入 MCP 配置（先备份后写入，不覆盖已有配置）
 * @param {string} filePath - 配置文件路径
 * @param {Object} mcpConfigs - 要写入的 MCP 配置
 * @returns {Promise<Object>} 写入结果
 */
async function writeMcpConfig(filePath, mcpConfigs) {
  let existing = {};
  
  // 读取已有配置
  if (await fs.pathExists(filePath)) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      existing = JSON.parse(content);
    } catch (error) {
      return { success: false, message: `读取配置文件失败: ${error.message}` };
    }
  }
  
  // 检查已有 MCP 服务，不重复添加
  const existingMcp = existing.mcpServers || {};
  const installed = [];
  const skipped = [];
  
  for (const [name, config] of Object.entries(mcpConfigs)) {
    if (existingMcp[name]) {
      skipped.push(name);
      continue;
    }
    existingMcp[name] = {
      command: config.command,
      args: config.args || [],
      env: config.env || {}
    };
    installed.push(name);
  }
  
  if (installed.length === 0) {
    return { success: true, installed: [], skipped, message: '所有 MCP 服务已存在，跳过' };
  }
  
  // 备份原文件
  if (await fs.pathExists(filePath)) {
    const backupPath = `${filePath}.bak`;
    await fs.copy(filePath, backupPath);
  }
  
  // 写入
  existing.mcpServers = existingMcp;
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(existing, null, 2), 'utf8');
  
  return { success: true, installed, skipped, message: `添加了 ${installed.length} 个 MCP 服务` };
}

/**
 * 阶段 3：配置 MCP 服务（可选）
 * 
 * 流程：
 * 1. 询问用户是否配置 GitHub + Playwright MCP
 * 2. 检测 ~/.claude.json 或 .claude/settings.local.json
 * 3. 安全写入（备份 + 不去重已有 MCP 配置）
 * 4. 记录到状态文件 mcp 节点
 * 
 * @param {string} platformId - 平台 ID
 * @param {string} scope - 安装范围
 * @param {string} cwd - 工作目录
 * @param {Object} [options] - 命令选项
 * @returns {Promise<Object>} 安装结果
 */
async function installMcpServers(platformId, scope, cwd, options = {}) {
  const mcpConfigs = await getMcpConfigs();
  
  if (Object.keys(mcpConfigs).length === 0) {
    return { success: true, installed: [], message: '无 MCP 配置定义' };
  }
  
  // --yes 模式下跳过 MCP（用户显式标记非交互）
  if (options.yes) {
    return { success: true, installed: [], skipped: true, message: '--yes 模式跳过 MCP 配置' };
  }
  
  // 交互模式：询问用户
  let installMcp = true;
  try {
    const { confirm } = require('@inquirer/prompts');
    installMcp = await confirm({
      message: `是否配置推荐 MCP 服务（${Object.keys(mcpConfigs).join(' + ')}）？`,
      default: false
    });
  } catch (error) {
    // 非交互环境跳过
    return { success: true, installed: [], skipped: true, message: '非交互环境跳过 MCP' };
  }
  
  if (!installMcp) {
    return { success: true, installed: [], skipped: true, message: '用户跳过 MCP 配置' };
  }
  
  // 写入 MCP 配置
  const mcpSettingsPath = await getMcpSettingsPath(scope, cwd);
  console.log(chalk.gray(`    配置文件: ${mcpSettingsPath.replace(require('os').homedir(), '~')}`));
  
  const result = await writeMcpConfig(mcpSettingsPath, mcpConfigs);
  
  if (result.success) {
    if (result.installed.length > 0) {
      console.log(chalk.green(`    ✔ 添加 MCP: ${result.installed.join(', ')}`));
    }
    if (result.skipped.length > 0) {
      console.log(chalk.gray(`    ○ 已存在: ${result.skipped.join(', ')}`));
    }
  }
  
  return result;
}

/**
 * 执行三阶段安装
 * @param {string[]} platformIds - 平台 ID 列表
 * @param {string} scope - 安装范围
 * @param {string} language - 语言
 * @param {string} cwd - 工作目录
 * @param {Object} [options] - 命令选项（透传给 MCP 询问逻辑）
 * @returns {Promise<Object>} 安装结果
 */
async function performInstallation(platformIds, scope, language, cwd, options = {}) {
  const results = {
    installed: [],
    skipped: [],
    failed: [],
    details: {}   // 每个平台的详细安装信息
  };
  
  for (const platformId of platformIds) {
    const platform = getPlatformDefinition(platformId);
    if (!platform) {
      results.failed.push(platformId);
      continue;
    }
    
    console.log(chalk.cyan(`\n  安装到 ${platform.name}...`));
    
    try {
      // 阶段 1: Skills（清单驱动）
      console.log(chalk.gray('    Phase 1/3: 部署 Skills...'));
      const skillsResult = await installSkills(platformId, scope, language, cwd);
      
      if (skillsResult.success) {
        console.log(chalk.green(`    ✔ 复制 ${skillsResult.installed.length} 个 Skills → ${platform.skillsDir}/`));
      } else {
        throw new Error(skillsResult.message);
      }
      
      // 阶段 2: Agent & Commands
      console.log(chalk.gray('    Phase 2/3: 配置 Agent 和 Commands...'));
      const agentResult = await installAgentAndCommands(platformId, scope, cwd);
      
      if (agentResult.success) {
        agentResult.agents.forEach(a => {
          console.log(chalk.green(`    ✔ Agent → ${platform.skillsDir.replace('skills', 'agents')}/${a}`));
        });
        agentResult.commands.forEach(c => {
          console.log(chalk.green(`    ✔ Command → ${platform.skillsDir.replace('skills', 'commands')}/${c}`));
        });
      }
      
      // 阶段 3: MCP（可选，透传 options 以支持 --yes 跳过交互）
      console.log(chalk.gray('    Phase 3/3: MCP 服务配置...'));
      const mcpResult = await installMcpServers(platformId, scope, cwd, options);
      
      if (mcpResult.success) {
        if (mcpResult.skipped === true) {
          console.log(chalk.gray(`    ○ 已跳过：${mcpResult.message}`));
        } else if (!mcpResult.installed || mcpResult.installed.length === 0) {
          console.log(chalk.gray(`    ○ ${mcpResult.message || 'MCP 未变动'}`));
        }
      }
      
      // 记录平台安装详情
      results.details[platformId] = {
        skills: skillsResult.installed,
        agents: agentResult.agents,
        commands: agentResult.commands,
        mcp: Array.isArray(mcpResult.installed) ? mcpResult.installed : []
      };
      
      results.installed.push(platformId);
      
    } catch (error) {
      console.error(chalk.red(`    ✖ 安装失败: ${error.message}`));
      results.failed.push(platformId);
    }
  }
  
  return results;
}

/**
 * 检测冲突
 * @param {string[]} platformIds - 平台 ID 列表
 * @param {string} scope - 安装范围
 * @param {string} cwd - 工作目录
 * @returns {Promise<Object>} 冲突检测结果
 */
async function detectConflicts(platformIds, scope, cwd) {
  const conflicts = {};
  let hasConflicts = false;
  
  for (const platformId of platformIds) {
    const platform = getPlatformDefinition(platformId);
    if (!platform) continue;
    
    const baseDir = scope === 'global'
      ? platform.globalSkillsDir.replace('~', require('os').homedir()).replace('/skills', '')
      : path.join(cwd, platform.skillsDir.replace('/skills', ''));
    
    const skillsDir = path.join(baseDir, 'skills');
    const agentsDir = path.join(baseDir, 'agents');
    const commandsDir = path.join(baseDir, 'commands');
    
    const platformConflicts = {
      skills: false,
      agents: false,
      commands: false
    };
    
    // 检查 Skills
    if (await fs.pathExists(skillsDir)) {
      const entries = await fs.readdir(skillsDir);
      platformConflicts.skills = entries.some(e => e.startsWith('bailu-'));
    }
    
    // 检查 Agents
    if (await fs.pathExists(agentsDir)) {
      const entries = await fs.readdir(agentsDir);
      platformConflicts.agents = entries.some(e => e.startsWith('bailu-'));
    }
    
    // 检查 Commands
    if (await fs.pathExists(commandsDir)) {
      const entries = await fs.readdir(commandsDir);
      platformConflicts.commands = entries.some(e => e.startsWith('bailu-'));
    }
    
    if (platformConflicts.skills || platformConflicts.agents || platformConflicts.commands) {
      conflicts[platformId] = platformConflicts;
      hasConflicts = true;
    }
  }
  
  return { hasConflicts, conflicts };
}

// 导出
module.exports = {
  readManifest,
  installSkills,
  installAgentAndCommands,
  installMcpServers,
  performInstallation,
  detectConflicts
};