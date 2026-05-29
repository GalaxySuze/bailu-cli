/**
 * Qoder 安装器
 *
 * 负责将白鹿工作流配置安装到 Qoder 的配置目录
 * Qoder 目录结构与 Claude Code 高度兼容：
 *   - skills → ~/.qoder/skills/
 *   - commands → ~/.qoder/commands/
 *   - agents → ~/.qoder/agents/
 *   - rules → 追加到 ~/.qoder/AGENTS.md
 *   - memory → ~/.qoder/memories/
 *   - mcpServers → 合并到 ~/.qoder.json
 *   - hooks → 不支持
 */

const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const chalk = require('chalk');
const BaseInstaller = require('./base');
const { TOOLS } = require('../config/tools');

class QoderInstaller extends BaseInstaller {
  constructor() {
    const toolConfig = TOOLS.qoder;
    const homeDir = toolConfig.getUserDir(os.homedir());
    super({
      homeDir,
      name: toolConfig.name,
      toolKey: 'qoder',
      toolConfig
    });

    this.agentsMdPath = path.join(homeDir, 'AGENTS.md');
    this.qoderJsonPath = path.join(os.homedir(), '.qoder.json');
  }

  /**
   * 安装 Rules 到 AGENTS.md
   * Qoder 使用 AGENTS.md 等同于 Claude 的 CLAUDE.md
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

        await this.appendToFile(this.agentsMdPath, content, {
          separator: header,
          header: '# 白鹿工作流规则\n\n> 以下规则由白鹿工作流自动管理，请勿手动修改\n\n'
        });

        installed.push(rule);
      }
    }

    return installed;
  }

  /**
   * 卸载 Rules 从 AGENTS.md
   * @param {Array<string>} rules - 规则列表
   * @returns {Promise<Array<string>>} 已卸载的规则列表
   */
  async uninstallRules(rules = []) {
    if (!await fs.pathExists(this.agentsMdPath)) {
      return [];
    }

    let content = await fs.readFile(this.agentsMdPath, 'utf8');
    const removed = [];

    for (const rule of rules) {
      const header = `# ===== ${rule} =====`;
      const headerIndex = content.indexOf(header);

      if (headerIndex !== -1) {
        const nextHeader = content.indexOf('# =====', headerIndex + header.length);
        const endIndex = nextHeader !== -1 ? nextHeader : content.length;
        content = content.substring(0, headerIndex) + content.substring(endIndex);
        removed.push(rule);
      }
    }

    content = content.replace(/\n{3,}/g, '\n\n').trim();
    await fs.writeFile(this.agentsMdPath, content);
    return removed;
  }

  /**
   * 安装 MCP Servers 到 ~/.qoder.json 的 mcpServers 字段
   * @param {string} sourceDir - 源目录
   * @param {Array<string>} mcpServers - MCP 服务列表
   * @returns {Promise<Array<string>>} 已安装的 MCP 服务列表
   */
  async installMcpServers(sourceDir, mcpServers = []) {
    let qoderConfig = {};
    if (await fs.pathExists(this.qoderJsonPath)) {
      qoderConfig = await this.readJson(this.qoderJsonPath);
    }

    if (!qoderConfig.mcpServers) {
      qoderConfig.mcpServers = {};
    }

    const installed = [];

    for (const mcp of mcpServers) {
      const configPath = path.join(sourceDir, 'mcp-servers', `${mcp}.json`);

      if (await fs.pathExists(configPath)) {
        const config = await this.readJson(configPath);
        qoderConfig.mcpServers[mcp] = config;
        installed.push(mcp);
      }
    }

    await this.writeJson(this.qoderJsonPath, qoderConfig);
    return installed;
  }

  /**
   * 卸载 MCP Servers 从 ~/.qoder.json
   * @param {Array<string>} mcpServers - MCP 服务列表
   * @returns {Promise<Array<string>>} 已卸载的 MCP 服务列表
   */
  async uninstallMcpServers(mcpServers = []) {
    if (!await fs.pathExists(this.qoderJsonPath)) {
      return [];
    }

    const qoderConfig = await this.readJson(this.qoderJsonPath);

    if (!qoderConfig.mcpServers) {
      return [];
    }

    const removed = [];

    for (const mcp of mcpServers) {
      if (qoderConfig.mcpServers[mcp]) {
        delete qoderConfig.mcpServers[mcp];
        removed.push(mcp);
      }
    }

    await this.writeJson(this.qoderJsonPath, qoderConfig);
    return removed;
  }

  /**
   * 安装 Memory 到 ~/.qoder/memories/（Qoder 用 memories 替代 memory）
   * @param {string} sourceDir - 源目录
   * @param {Array<string>} memory - 记忆模板列表
   * @returns {Promise<Array<string>>} 已安装的记忆模板列表
   */
  async installMemory(sourceDir, memory = []) {
    const memoriesDir = path.join(this.homeDir, 'memories');
    await this.ensureDir(memoriesDir);

    const installed = [];

    for (const mem of memory) {
      const srcPath = path.join(sourceDir, 'memory', `${mem}.md`);
      const destPath = path.join(memoriesDir, `${mem}.md`);

      if (await fs.pathExists(srcPath)) {
        await this.copyFile(srcPath, destPath);
        installed.push(mem);
      }
    }

    return installed;
  }

  /**
   * 卸载 Memory 从 ~/.qoder/memories/
   * @param {Array<string>} memory - 记忆模板列表
   * @returns {Promise<Array<string>>} 已卸载的记忆模板列表
   */
  async uninstallMemory(memory = []) {
    const memoriesDir = path.join(this.homeDir, 'memories');
    const removed = [];

    for (const mem of memory) {
      const memPath = path.join(memoriesDir, `${mem}.md`);
      if (await fs.pathExists(memPath)) {
        await fs.remove(memPath);
        removed.push(mem);
      }
    }

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
    console.log(chalk.gray(`   目标工具: ${this.name}`));
    console.log(chalk.gray(`   版本: ${manifest.version}`));
    console.log('');

    const components = manifest.components || {};

    if (components.skills?.length > 0) {
      result.components.skills = await this.installSkills(workflowDir, components.skills);
      console.log(chalk.green(`   ✅ Skills: ${result.components.skills.length} 个`));
    }

    if (components.commands?.length > 0) {
      result.components.commands = await this.installCommands(workflowDir, components.commands);
      console.log(chalk.green(`   ✅ Commands: ${result.components.commands.length} 个`));
    }

    if (components.agents?.length > 0) {
      result.components.agents = await this.installAgents(workflowDir, components.agents);
      console.log(chalk.green(`   ✅ Agents: ${result.components.agents.length} 个`));
    }

    if (components.rules?.length > 0) {
      result.components.rules = await this.installRules(workflowDir, components.rules);
      console.log(chalk.green(`   ✅ Rules: ${result.components.rules.length} 个`));
    }

    if (components.memory?.length > 0) {
      result.components.memory = await this.installMemory(workflowDir, components.memory);
      console.log(chalk.green(`   ✅ Memory: ${result.components.memory.length} 个`));
    }

    if (components.mcpServers?.length > 0) {
      result.components.mcpServers = await this.installMcpServers(workflowDir, components.mcpServers);
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
    console.log(chalk.gray(`   目标工具: ${this.name}`));
    console.log('');

    const components = manifest.components || {};

    if (components.skills?.length > 0) {
      result.components.skills = await this.uninstallSkills(components.skills);
      console.log(chalk.yellow(`   ⬜ Skills: ${result.components.skills.length} 个`));
    }

    if (components.commands?.length > 0) {
      result.components.commands = await this.uninstallCommands(components.commands);
      console.log(chalk.yellow(`   ⬜ Commands: ${result.components.commands.length} 个`));
    }

    if (components.agents?.length > 0) {
      result.components.agents = await this.uninstallAgents(components.agents);
      console.log(chalk.yellow(`   ⬜ Agents: ${result.components.agents.length} 个`));
    }

    if (components.rules?.length > 0) {
      result.components.rules = await this.uninstallRules(components.rules);
      console.log(chalk.yellow(`   ⬜ Rules: ${result.components.rules.length} 个`));
    }

    if (components.memory?.length > 0) {
      result.components.memory = await this.uninstallMemory(components.memory);
      console.log(chalk.yellow(`   ⬜ Memory: ${result.components.memory.length} 个`));
    }

    if (components.mcpServers?.length > 0) {
      result.components.mcpServers = await this.uninstallMcpServers(components.mcpServers);
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

    const components = manifest.components || {};

    if (components.skills?.length > 0) {
      const skillsDir = path.join(this.homeDir, 'skills');
      status.components.skills = { total: components.skills.length, installed: 0, details: [] };
      for (const skill of components.skills) {
        const isInstalled = await fs.pathExists(path.join(skillsDir, skill));
        if (isInstalled) status.components.skills.installed++;
        status.components.skills.details.push({ name: skill, status: isInstalled ? 'installed' : 'missing' });
      }
    }

    if (components.commands?.length > 0) {
      const commandsDir = path.join(this.homeDir, 'commands');
      status.components.commands = { total: components.commands.length, installed: 0, details: [] };
      for (const cmd of components.commands) {
        const isInstalled = await fs.pathExists(path.join(commandsDir, `${cmd}.md`));
        if (isInstalled) status.components.commands.installed++;
        status.components.commands.details.push({ name: cmd, status: isInstalled ? 'installed' : 'missing' });
      }
    }

    if (components.agents?.length > 0) {
      const agentsDir = path.join(this.homeDir, 'agents');
      status.components.agents = { total: components.agents.length, installed: 0, details: [] };
      for (const agent of components.agents) {
        const isInstalled = await fs.pathExists(path.join(agentsDir, `${agent}.md`));
        if (isInstalled) status.components.agents.installed++;
        status.components.agents.details.push({ name: agent, status: isInstalled ? 'installed' : 'missing' });
      }
    }

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

module.exports = QoderInstaller;
