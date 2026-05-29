/**
 * Claude Desktop 安装器
 *
 * 负责将白鹿工作流配置安装到 Claude Desktop 桌面版的配置目录
 * 主要支持 MCP Servers 配置
 */

const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const chalk = require('chalk');
const BaseInstaller = require('./base');
const { TOOLS } = require('../config/tools');

class ClaudeDesktopInstaller extends BaseInstaller {
  constructor() {
    const toolConfig = TOOLS['claude-desktop'];
    const homeDir = toolConfig.getUserDir(os.homedir());
    super({
      homeDir,
      name: toolConfig.name,
      toolKey: 'claude-desktop',
      toolConfig
    });

    // Claude Desktop 特有的文件路径
    this.configPath = path.join(homeDir, 'claude_desktop_config.json');
  }

  /**
   * 安装 Rules（不支持）
   * @returns {Promise<Array<string>>} 空数组
   */
  async installRules() {
    console.log(chalk.yellow(`   ⚠️  ${this.name} 不支持 Rules 组件`));
    return [];
  }

  /**
   * 卸载 Rules（不支持）
   * @returns {Promise<Array<string>>} 空数组
   */
  async uninstallRules() {
    return [];
  }

  /**
   * 安装 MCP Servers 配置到 claude_desktop_config.json
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

    // 只安装 MCP Servers（Claude Desktop 支持的唯一组件）
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

    // 只卸载 MCP Servers
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

module.exports = ClaudeDesktopInstaller;
