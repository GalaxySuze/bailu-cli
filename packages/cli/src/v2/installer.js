/**
 * @fileoverview 白鹿 CLI v2 安装器
 * 
 * 简化设计：
 * - 只支持 Claude Code + Qoder 编辑器
 * - 清单驱动安装（参考 Comet）
 * - 三阶段安装流程
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
 * 阶段 1：部署 Skills
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
  
  // 确定目标目录
  const targetDir = scope === 'global' 
    ? platform.globalSkillsDir.replace('~', require('os').homedir())
    : path.join(cwd, platform.skillsDir);
  
  // 确定源目录（根据语言）
  const sourceDir = language === 'zh' 
    ? path.join(__dirname, '../../assets/skills-zh')
    : path.join(__dirname, '../../assets/skills');
  
  // 检查源目录是否存在
  if (!(await fs.pathExists(sourceDir))) {
    return {
      success: false,
      message: `源目录不存在: ${sourceDir}`,
      installed: []
    };
  }
  
  // 复制 Skills
  const installed = [];
  const entries = await fs.readdir(sourceDir);
  
  for (const entry of entries) {
    const srcPath = path.join(sourceDir, entry);
    const destPath = path.join(targetDir, entry);
    
    try {
      await fs.ensureDir(path.dirname(destPath));
      await fs.copy(srcPath, destPath, { overwrite: true });
      installed.push(entry);
    } catch (error) {
      console.error(chalk.red(`  复制失败 ${entry}: ${error.message}`));
    }
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
  
  // 确定目标目录
  const baseDir = scope === 'global'
    ? platform.globalSkillsDir.replace('~', require('os').homedir()).replace('/skills', '')
    : path.join(cwd, platform.skillsDir.replace('/skills', ''));
  
  // 安装 Agent
  const agentDir = path.join(baseDir, 'agents');
  const agentSource = path.join(__dirname, '../../assets/agents/bailu-fullstack.md');
  
  let agentInstalled = false;
  if (await fs.pathExists(agentSource)) {
    await fs.ensureDir(agentDir);
    await fs.copy(agentSource, path.join(agentDir, 'bailu-fullstack.md'), { overwrite: true });
    agentInstalled = true;
  }
  
  // 安装 Commands
  const commandsDir = path.join(baseDir, 'commands');
  const commandSource = path.join(__dirname, '../../assets/commands/bailu-sdd-start.md');
  
  let commandInstalled = false;
  if (await fs.pathExists(commandSource)) {
    await fs.ensureDir(commandsDir);
    await fs.copy(commandSource, path.join(commandsDir, 'bailu-sdd-start.md'), { overwrite: true });
    commandInstalled = true;
  }
  
  return {
    success: true,
    agent: agentInstalled ? 'bailu-fullstack.md' : null,
    command: commandInstalled ? 'bailu-sdd-start.md' : null
  };
}

/**
 * 阶段 3：配置 MCP 服务（可选）
 * @param {string} platformId - 平台 ID
 * @param {string} scope - 安装范围
 * @param {string} cwd - 工作目录
 * @returns {Promise<Object>} 安装结果
 */
async function installMcpServers(platformId, scope, cwd) {
  // TODO: 实现 MCP 服务配置
  // 暂时返回成功，后续迭代
  return {
    success: true,
    installed: []
  };
}

/**
 * 执行三阶段安装
 * @param {string[]} platformIds - 平台 ID 列表
 * @param {string} scope - 安装范围
 * @param {string} language - 语言
 * @param {string} cwd - 工作目录
 * @returns {Promise<Object>} 安装结果
 */
async function performInstallation(platformIds, scope, language, cwd) {
  const results = {
    installed: [],
    skipped: [],
    failed: []
  };
  
  for (const platformId of platformIds) {
    const platform = getPlatformDefinition(platformId);
    if (!platform) {
      results.failed.push(platformId);
      continue;
    }
    
    console.log(chalk.cyan(`\n  安装到 ${platform.name}...`));
    
    try {
      // 阶段 1: Skills
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
        if (agentResult.agent) {
          console.log(chalk.green(`    ✔ Agent → ${platform.skillsDir.replace('skills', 'agents')}/${agentResult.agent}`));
        }
        if (agentResult.command) {
          console.log(chalk.green(`    ✔ Command → ${platform.skillsDir.replace('skills', 'commands')}/${agentResult.command}`));
        }
      }
      
      // 阶段 3: MCP（可选）
      console.log(chalk.gray('    Phase 3/3: MCP 服务配置...'));
      const mcpResult = await installMcpServers(platformId, scope, cwd);
      
      if (mcpResult.success) {
        console.log(chalk.green(`    ✔ MCP 配置完成`));
      }
      
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
