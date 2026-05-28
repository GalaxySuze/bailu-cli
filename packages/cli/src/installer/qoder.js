/**
 * Qoder 安装器
 *
 * 负责将白鹿工作流配置安装到 Qoder（阿里系）的配置目录
 * Qoder 支持 Skills/Agents 目录复制模式，MCP 通过 ~/.qoder.json 管理
 * Commands/Rules/Hooks/Memory 当前不支持
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

    this.qoderJsonPath = path.join(os.homedir(), '.qoder.json');
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
   * 安装完整工作流
   * Qoder 只安装支持的组件（Skills、Agents、MCP），不支持的组件在调用层 warn
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

    if (components.agents?.length > 0) {
      result.components.agents = await this.installAgents(workflowDir, components.agents);
      console.log(chalk.green(`   ✅ Agents: ${result.components.agents.length} 个`));
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

    if (components.agents?.length > 0) {
      result.components.agents = await this.uninstallAgents(components.agents);
      console.log(chalk.yellow(`   ⬜ Agents: ${result.components.agents.length} 个`));
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
      status.components.skills = {
        total: components.skills.length,
        installed: 0,
        details: []
      };
      for (const skill of components.skills) {
        const skillPath = path.join(skillsDir, skill);
        const isInstalled = await fs.pathExists(skillPath);
        if (isInstalled) status.components.skills.installed++;
        status.components.skills.details.push({
          name: skill,
          status: isInstalled ? 'installed' : 'missing'
        });
      }
    }

    if (components.agents?.length > 0) {
      const agentsDir = path.join(this.homeDir, 'agents');
      status.components.agents = {
        total: components.agents.length,
        installed: 0,
        details: []
      };
      for (const agent of components.agents) {
        const agentPath = path.join(agentsDir, `${agent}.md`);
        const isInstalled = await fs.pathExists(agentPath);
        if (isInstalled) status.components.agents.installed++;
        status.components.agents.details.push({
          name: agent,
          status: isInstalled ? 'installed' : 'missing'
        });
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
