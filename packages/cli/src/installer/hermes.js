/**
 * Hermes 安装器
 *
 * 负责将白鹿工作流配置安装到 Hermes 的配置目录
 * 主要支持 Rules 和 MCP Servers 配置
 */

const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const chalk = require('chalk');
const BaseInstaller = require('./base');
const { TOOLS } = require('../config/tools');

class HermesInstaller extends BaseInstaller {
  constructor() {
    const toolConfig = TOOLS.hermes;
    const homeDir = toolConfig.getUserDir(os.homedir());
    super({
      homeDir,
      name: toolConfig.name,
      toolKey: 'hermes',
      toolConfig
    });

    // Hermes 特有的文件路径
    this.rulesPath = path.join(homeDir, 'rules.md');
    this.configPath = path.join(homeDir, 'config.json');
  }

  /**
   * 安装 Rules 到 rules.md
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

        // Hermes 使用 write-file 模式，覆盖写入
        await this.ensureDir(path.dirname(this.rulesPath));
        await fs.writeFile(this.rulesPath, content);
        installed.push(rule);
      }
    }

    return installed;
  }

  /**
   * 卸载 Rules（清空 rules.md）
   * @param {Array<string>} rules - 规则列表
   * @returns {Promise<Array<string>>} 已卸载的规则列表
   */
  async uninstallRules(rules = []) {
    if (await fs.pathExists(this.rulesPath)) {
      // Hermes 使用 write-file 模式，卸载时删除文件
      await fs.remove(this.rulesPath);
      return rules;
    }
    return [];
  }

  /**
   * 安装 MCP Servers 配置到 config.json
   * @param {string} sourceDir - 源目录
   * @param {Array<string>} mcpServers - MCP 服务列表
   * @returns {Promise<Array<string>>} 已安装的 MCP 服务列表
   */
  async installMcpServers(sourceDir, mcpServers = []) {
    const config = await this.readJson(this.configPath);

    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    const installed = [];

    for (const mcp of mcpServers) {
      const configPath = path.join(sourceDir, 'mcp-servers', `${mcp}.json`);

      if (await fs.pathExists(configPath)) {
        const mcpConfig = await this.readJson(configPath);
        config.mcpServers[mcp] = mcpConfig;
        installed.push(mcp);
      }
    }

    await this.writeJson(this.configPath, config);
    return installed;
  }

  /**
   * 卸载 MCP Servers 配置
   * @param {Array<string>} mcpServers - MCP 服务列表
   * @returns {Promise<Array<string>>} 已卸载的 MCP 服务列表
   */
  async uninstallMcpServers(mcpServers = []) {
    const config = await this.readJson(this.configPath);

    if (!config.mcpServers) {
      return [];
    }

    const removed = [];

    for (const mcp of mcpServers) {
      if (config.mcpServers[mcp]) {
        delete config.mcpServers[mcp];
        removed.push(mcp);
      }
    }

    await this.writeJson(this.configPath, config);
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

    // 1. 安装 Rules
    if (manifest.components.rules?.length > 0) {
      result.components.rules = await this.installRules(
        workflowDir,
        manifest.components.rules
      );
      console.log(chalk.green(`   ✅ Rules: ${result.components.rules.length} 个`));
    }

    // 2. 安装 MCP Servers
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

    // 1. 卸载 Rules
    if (manifest.components.rules?.length > 0) {
      result.components.rules = await this.uninstallRules(manifest.components.rules);
      console.log(chalk.yellow(`   ⬜ Rules: ${result.components.rules.length} 个`));
    }

    // 2. 卸载 MCP Servers
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

    // 检查 Rules
    if (manifest.components.rules?.length > 0) {
      status.components.rules = {
        total: manifest.components.rules.length,
        installed: 0,
        details: []
      };

      for (const rule of manifest.components.rules) {
        if (await fs.pathExists(this.rulesPath)) {
          status.components.rules.installed++;
          status.components.rules.details.push({ name: rule, status: 'installed' });
        } else {
          status.components.rules.details.push({ name: rule, status: 'missing' });
        }
      }
    }

    // 检查 MCP Servers
    if (manifest.components.mcpServers?.length > 0) {
      const config = await this.readJson(this.configPath);
      status.components.mcpServers = {
        total: manifest.components.mcpServers.length,
        installed: 0,
        details: []
      };

      for (const mcp of manifest.components.mcpServers) {
        if (config.mcpServers?.[mcp]) {
          status.components.mcpServers.installed++;
          status.components.mcpServers.details.push({ name: mcp, status: 'installed' });
        } else {
          status.components.mcpServers.details.push({ name: mcp, status: 'missing' });
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

module.exports = HermesInstaller;
