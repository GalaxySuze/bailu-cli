/**
 * Claude Code 安装器
 * 
 * 负责将白鹿工作流配置安装到 Claude Code 的配置目录
 */

const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const chalk = require('chalk');
const BaseInstaller = require('./base');
const { TOOLS } = require('../config/tools');

class ClaudeInstaller extends BaseInstaller {
  constructor() {
    const toolConfig = TOOLS.claudecode;
    const homeDir = toolConfig.getUserDir(os.homedir());
    super({
      homeDir,
      name: toolConfig.name,
      toolKey: 'claudecode',
      toolConfig
    });
    
    // Claude 特有的文件路径
    this.claudeMdPath = path.join(homeDir, 'CLAUDE.md');
    this.settingsPath = path.join(homeDir, 'settings.json');
  }

  /**
   * 安装 Rules 到 CLAUDE.md
   * @param {string} sourceDir - 源目录
   * @param {Array<string>} rules - 规则列表
   * @returns {Promise<Array<string>>} 已安装的规则列表
   */
  async installRules(sourceDir, rules = []) {
    const installed = [];

    for (const rule of rules) {
      const rulePath = path.join(sourceDir, 'rules', `${rule}.md`);
      
      if (await fs.pathExists(rulePath)) {
        const content = await fs.readFile(rulePath, 'utf8');
        const header = `\n\n# ===== ${rule} =====\n\n`;
        
        await this.appendToFile(this.claudeMdPath, content, {
          separator: header,
          header: '# 白鹿工作流规则\n\n> 以下规则由白鹿工作流自动管理，请勿手动修改\n\n'
        });
        
        installed.push(rule);
      }
    }

    return installed;
  }

  /**
   * 卸载 Rules 从 CLAUDE.md
   * @param {Array<string>} rules - 规则列表
   * @returns {Promise<Array<string>>} 已卸载的规则列表
   */
  async uninstallRules(rules = []) {
    if (!await fs.pathExists(this.claudeMdPath)) {
      return [];
    }

    let content = await fs.readFile(this.claudeMdPath, 'utf8');
    const removed = [];

    for (const rule of rules) {
      const header = `# ===== ${rule} =====`;
      const headerIndex = content.indexOf(header);
      
      if (headerIndex !== -1) {
        // 查找下一个规则头或文件结尾
        const nextHeader = content.indexOf('# =====', headerIndex + header.length);
        const endIndex = nextHeader !== -1 ? nextHeader : content.length;
        
        // 移除该规则部分
        content = content.substring(0, headerIndex) + content.substring(endIndex);
        removed.push(rule);
      }
    }

    // 清理多余的空行
    content = content.replace(/\n{3,}/g, '\n\n').trim();
    
    await fs.writeFile(this.claudeMdPath, content);
    return removed;
  }

  /**
   * 安装完整工作流
   * @param {string} workflowDir - 工作流目录
   * @param {Object} manifest - manifest.json 内容
   * @returns {Promise<Object>} 安装结果
   */
  async installWorkflow(workflowDir, manifest) {
    const result = {
      workflow: manifest.name,
      version: manifest.version,
      components: {}
    };

    console.log(chalk.cyan(`\n📦 安装工作流: ${manifest.displayName || manifest.name}`));
    console.log(chalk.gray(`   版本: ${manifest.version}`));
    console.log('');

    // 1. 安装 Skills
    if (manifest.components.skills?.length > 0) {
      result.components.skills = await this.installSkills(
        workflowDir, 
        manifest.components.skills
      );
      console.log(chalk.green(`   ✅ Skills: ${result.components.skills.length} 个`));
    }

    // 2. 安装 Commands
    if (manifest.components.commands?.length > 0) {
      result.components.commands = await this.installCommands(
        workflowDir, 
        manifest.components.commands
      );
      console.log(chalk.green(`   ✅ Commands: ${result.components.commands.length} 个`));
    }

    // 3. 安装 Rules
    if (manifest.components.rules?.length > 0) {
      result.components.rules = await this.installRules(
        workflowDir, 
        manifest.components.rules
      );
      console.log(chalk.green(`   ✅ Rules: ${result.components.rules.length} 个`));
    }

    // 4. 安装 Agents
    if (manifest.components.agents?.length > 0) {
      result.components.agents = await this.installAgents(
        workflowDir, 
        manifest.components.agents
      );
      console.log(chalk.green(`   ✅ Agents: ${result.components.agents.length} 个`));
    }

    // 5. 安装 Hooks
    if (manifest.components.hooks?.length > 0) {
      result.components.hooks = await this.installHooks(
        workflowDir, 
        manifest.components.hooks
      );
      console.log(chalk.green(`   ✅ Hooks: ${result.components.hooks.length} 个`));
    }

    // 6. 安装 Memory
    if (manifest.components.memory?.length > 0) {
      result.components.memory = await this.installMemory(
        workflowDir, 
        manifest.components.memory
      );
      console.log(chalk.green(`   ✅ Memory: ${result.components.memory.length} 个`));
    }

    // 7. 安装 MCP Servers
    if (manifest.components.mcpServers?.length > 0) {
      result.components.mcpServers = await this.installMcpServers(
        workflowDir, 
        manifest.components.mcpServers
      );
      console.log(chalk.green(`   ✅ MCP Servers: ${result.components.mcpServers.length} 个`));
    }

    console.log('');
    console.log(chalk.green(`✨ 工作流 ${manifest.displayName || manifest.name} 安装完成！`));

    return result;
  }

  /**
   * 卸载完整工作流
   * @param {Object} manifest - manifest.json 内容
   * @returns {Promise<Object>} 卸载结果
   */
  async uninstallWorkflow(manifest) {
    const result = {
      workflow: manifest.name,
      components: {}
    };

    console.log(chalk.cyan(`\n🗑️  卸载工作流: ${manifest.displayName || manifest.name}`));
    console.log('');

    // 1. 卸载 Skills
    if (manifest.components.skills?.length > 0) {
      result.components.skills = await this.uninstallSkills(manifest.components.skills);
      console.log(chalk.yellow(`   ⬜ Skills: ${result.components.skills.length} 个`));
    }

    // 2. 卸载 Commands
    if (manifest.components.commands?.length > 0) {
      result.components.commands = await this.uninstallCommands(manifest.components.commands);
      console.log(chalk.yellow(`   ⬜ Commands: ${result.components.commands.length} 个`));
    }

    // 3. 卸载 Rules
    if (manifest.components.rules?.length > 0) {
      result.components.rules = await this.uninstallRules(manifest.components.rules);
      console.log(chalk.yellow(`   ⬜ Rules: ${result.components.rules.length} 个`));
    }

    // 4. 卸载 Agents
    if (manifest.components.agents?.length > 0) {
      result.components.agents = await this.uninstallAgents(manifest.components.agents);
      console.log(chalk.yellow(`   ⬜ Agents: ${result.components.agents.length} 个`));
    }

    // 5. 卸载 Hooks
    if (manifest.components.hooks?.length > 0) {
      result.components.hooks = await this.uninstallHooks(manifest.components.hooks);
      console.log(chalk.yellow(`   ⬜ Hooks: ${result.components.hooks.length} 个`));
    }

    // 6. 卸载 Memory
    if (manifest.components.memory?.length > 0) {
      result.components.memory = await this.uninstallMemory(manifest.components.memory);
      console.log(chalk.yellow(`   ⬜ Memory: ${result.components.memory.length} 个`));
    }

    // 7. 卸载 MCP Servers
    if (manifest.components.mcpServers?.length > 0) {
      result.components.mcpServers = await this.uninstallMcpServers(manifest.components.mcpServers);
      console.log(chalk.yellow(`   ⬜ MCP Servers: ${result.components.mcpServers.length} 个`));
    }

    console.log('');
    console.log(chalk.green(`✨ 工作流 ${manifest.displayName || manifest.name} 卸载完成！`));

    return result;
  }

  /**
   * 获取已安装组件状态
   * @param {Object} manifest - manifest.json 内容
   * @returns {Promise<Object>} 状态信息
   */
  async getStatus(manifest) {
    const status = {
      workflow: manifest.name,
      version: manifest.version,
      installed: true,
      components: {}
    };

    // 检查 Skills
    if (manifest.components.skills?.length > 0) {
      const skillsDir = path.join(this.homeDir, 'skills');
      status.components.skills = {
        total: manifest.components.skills.length,
        installed: 0,
        details: []
      };

      for (const skill of manifest.components.skills) {
        const skillPath = path.join(skillsDir, skill);
        if (await fs.pathExists(skillPath)) {
          status.components.skills.installed++;
          status.components.skills.details.push({ name: skill, status: 'installed' });
        } else {
          status.components.skills.details.push({ name: skill, status: 'missing' });
        }
      }
    }

    // 检查 Commands
    if (manifest.components.commands?.length > 0) {
      const commandsDir = path.join(this.homeDir, 'commands');
      status.components.commands = {
        total: manifest.components.commands.length,
        installed: 0,
        details: []
      };

      for (const cmd of manifest.components.commands) {
        const cmdPath = path.join(commandsDir, `${cmd}.md`);
        if (await fs.pathExists(cmdPath)) {
          status.components.commands.installed++;
          status.components.commands.details.push({ name: cmd, status: 'installed' });
        } else {
          status.components.commands.details.push({ name: cmd, status: 'missing' });
        }
      }
    }

    // 检查 Agents
    if (manifest.components.agents?.length > 0) {
      const agentsDir = path.join(this.homeDir, 'agents');
      status.components.agents = {
        total: manifest.components.agents.length,
        installed: 0,
        details: []
      };

      for (const agent of manifest.components.agents) {
        const agentPath = path.join(agentsDir, `${agent}.md`);
        if (await fs.pathExists(agentPath)) {
          status.components.agents.installed++;
          status.components.agents.details.push({ name: agent, status: 'installed' });
        } else {
          status.components.agents.details.push({ name: agent, status: 'missing' });
        }
      }
    }

    // 检查 Hooks
    if (manifest.components.hooks?.length > 0) {
      const hooksDir = path.join(this.homeDir, 'hooks');
      status.components.hooks = {
        total: manifest.components.hooks.length,
        installed: 0,
        details: []
      };

      for (const hook of manifest.components.hooks) {
        const hookPath = path.join(hooksDir, `${hook}.sh`);
        if (await fs.pathExists(hookPath)) {
          status.components.hooks.installed++;
          status.components.hooks.details.push({ name: hook, status: 'installed' });
        } else {
          status.components.hooks.details.push({ name: hook, status: 'missing' });
        }
      }
    }

    // 判断整体状态
    const allComponents = Object.values(status.components);
    const totalInstalled = allComponents.reduce((sum, c) => sum + c.installed, 0);
    const totalExpected = allComponents.reduce((sum, c) => sum + c.total, 0);

    if (totalInstalled === 0) {
      status.installed = false;
    } else if (totalInstalled < totalExpected) {
      status.installed = 'partial';
    }

    return status;
  }
}

module.exports = ClaudeInstaller;
