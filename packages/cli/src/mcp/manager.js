/**
 * MCP Servers 管理器
 * 
 * 管理 Model Context Protocol 服务
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const CLAUDE_HOME = path.join(os.homedir(), '.claude');

/**
 * MCP Servers 管理器类
 */
class McpManager {
  constructor() {
    this.settingsPath = path.join(CLAUDE_HOME, 'settings.json');
  }

  /**
   * 读取 settings.json
   * @returns {Promise<Object>} 配置内容
   */
  async readSettings() {
    if (await fs.pathExists(this.settingsPath)) {
      return await fs.readJson(this.settingsPath);
    }
    return {};
  }

  /**
   * 写入 settings.json
   * @param {Object} settings - 配置内容
   */
  async writeSettings(settings) {
    await fs.ensureDir(path.dirname(this.settingsPath));
    await fs.writeJson(this.settingsPath, settings, { spaces: 2 });
  }

  /**
   * 列出已配置的 MCP Servers
   * @returns {Promise<Array>} MCP Servers 列表
   */
  async listServers() {
    const settings = await this.readSettings();
    const servers = settings.mcpServers || {};

    return Object.entries(servers).map(([name, config]) => ({
      name,
      ...config,
      configured: true
    }));
  }

  /**
   * 获取 MCP Server 配置
   * @param {string} name - Server 名称
   * @returns {Promise<Object|null>} Server 配置
   */
  async getServer(name) {
    const settings = await this.readSettings();
    const servers = settings.mcpServers || {};
    return servers[name] || null;
  }

  /**
   * 添加 MCP Server
   * @param {string} name - Server 名称
   * @param {Object} config - Server 配置
   * @returns {Promise<Object>} 操作结果
   */
  async addServer(name, config) {
    const settings = await this.readSettings();
    
    if (!settings.mcpServers) {
      settings.mcpServers = {};
    }

    // 验证配置
    this.validateConfig(config);

    settings.mcpServers[name] = config;
    await this.writeSettings(settings);

    return {
      success: true,
      name,
      config
    };
  }

  /**
   * 更新 MCP Server
   * @param {string} name - Server 名称
   * @param {Object} config - Server 配置
   * @returns {Promise<Object>} 操作结果
   */
  async updateServer(name, config) {
    const settings = await this.readSettings();
    
    if (!settings.mcpServers || !settings.mcpServers[name]) {
      throw new Error(`MCP Server ${name} 不存在`);
    }

    // 验证配置
    this.validateConfig(config);

    settings.mcpServers[name] = {
      ...settings.mcpServers[name],
      ...config
    };
    await this.writeSettings(settings);

    return {
      success: true,
      name,
      config: settings.mcpServers[name]
    };
  }

  /**
   * 删除 MCP Server
   * @param {string} name - Server 名称
   * @returns {Promise<Object>} 操作结果
   */
  async removeServer(name) {
    const settings = await this.readSettings();
    
    if (!settings.mcpServers || !settings.mcpServers[name]) {
      throw new Error(`MCP Server ${name} 不存在`);
    }

    delete settings.mcpServers[name];
    await this.writeSettings(settings);

    return {
      success: true,
      name
    };
  }

  /**
   * 启用/禁用 MCP Server
   * @param {string} name - Server 名称
   * @param {boolean} enabled - 是否启用
   * @returns {Promise<Object>} 操作结果
   */
  async toggleServer(name, enabled) {
    const settings = await this.readSettings();
    
    if (!settings.mcpServers || !settings.mcpServers[name]) {
      throw new Error(`MCP Server ${name} 不存在`);
    }

    settings.mcpServers[name].disabled = !enabled;
    await this.writeSettings(settings);

    return {
      success: true,
      name,
      enabled
    };
  }

  /**
   * 验证 MCP Server 配置
   * @param {Object} config - Server 配置
   */
  validateConfig(config) {
    // 检查必需字段
    if (!config.command) {
      throw new Error('缺少 command 字段');
    }

    // 验证 transport 类型
    const validTransports = ['stdio', 'sse', 'streamable-http'];
    if (config.transport && !validTransports.includes(config.transport)) {
      throw new Error(`无效的 transport 类型: ${config.transport}，支持: ${validTransports.join(', ')}`);
    }
  }

  /**
   * 从模板创建 MCP Server 配置
   * @param {string} templateName - 模板名称
   * @param {Object} params - 参数
   * @returns {Object} Server 配置
   */
  createFromTemplate(templateName, params = {}) {
    const templates = {
      'filesystem': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', params.path || '/tmp'],
        description: '文件系统访问'
      },
      'github': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: {
          GITHUB_PERSONAL_ACCESS_TOKEN: params.token || ''
        },
        description: 'GitHub API 访问'
      },
      'brave-search': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-brave-search'],
        env: {
          BRAVE_API_KEY: params.apiKey || ''
        },
        description: 'Brave 搜索'
      },
      'sqlite': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sqlite', params.dbPath || './database.db'],
        description: 'SQLite 数据库'
      },
      'postgres': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-postgres'],
        env: {
          POSTGRES_CONNECTION_STRING: params.connectionString || ''
        },
        description: 'PostgreSQL 数据库'
      }
    };

    const template = templates[templateName];
    if (!template) {
      throw new Error(`未知模板: ${templateName}`);
    }

    return template;
  }

  /**
   * 获取可用模板列表
   * @returns {Array} 模板列表
   */
  getTemplates() {
    return [
      { name: 'filesystem', description: '文件系统访问' },
      { name: 'github', description: 'GitHub API 访问' },
      { name: 'brave-search', description: 'Brave 搜索' },
      { name: 'sqlite', description: 'SQLite 数据库' },
      { name: 'postgres', description: 'PostgreSQL 数据库' }
    ];
  }
}

module.exports = McpManager;
