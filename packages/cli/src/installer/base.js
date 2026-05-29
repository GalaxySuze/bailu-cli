/**
 * 基础安装器
 * 
 * 提供所有安装器的通用功能
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * 组件类型名称映射
 */
const COMPONENT_NAMES = {
  skills: 'Skills',
  commands: 'Commands',
  agents: 'Agents',
  rules: 'Rules',
  hooks: 'Hooks',
  memory: 'Memory',
  mcpServers: 'MCP Servers'
};

class BaseInstaller {
  /**
   * @param {Object} options - 安装选项
   * @param {string} options.homeDir - 工具配置目录
   * @param {string} options.name - 工具名称
   * @param {string} [options.toolKey] - 工具标识（如 'claude', 'trae', 'qoder'）
   * @param {Object} [options.toolConfig] - 来自 tools.js 的工具配置
   */
  constructor(options = {}) {
    this.homeDir = options.homeDir;
    this.name = options.name || 'Unknown';
    this.toolKey = options.toolKey || null;
    this.toolConfig = options.toolConfig || null;
  }

  /**
   * 检查指定组件是否被当前工具支持
   * @param {string} componentName - 组件名称（如 'hooks', 'rules', 'mcpServers'）
   * @returns {boolean}
   */
  isComponentSupported(componentName) {
    if (!this.toolConfig || !this.toolConfig.components) {
      return true;
    }
    const comp = this.toolConfig.components[componentName];
    return comp ? comp.supported !== false : true;
  }

  /**
   * 获取当前工具不支持的组件列表
   * @param {Object} manifestComponents - manifest.json 中声明的组件
   * @returns {Array<{type: string, items: string[]}>} 不支持的组件列表
   */
  getUnsupportedComponents(manifestComponents = {}) {
    const unsupported = [];
    if (!this.toolConfig || !this.toolConfig.components) {
      return unsupported;
    }

    for (const [key, items] of Object.entries(manifestComponents)) {
      if (Array.isArray(items) && items.length > 0) {
        if (!this.isComponentSupported(key)) {
          unsupported.push({
            type: COMPONENT_NAMES[key] || key,
            items: items
          });
        }
      }
    }

    return unsupported;
  }

  /**
   * 检查工具是否已安装
   * @returns {boolean}
   */
  isInstalled() {
    return fs.existsSync(this.homeDir);
  }

  /**
   * 确保目录存在
   * @param {string} dirPath - 目录路径
   */
  async ensureDir(dirPath) {
    await fs.ensureDir(dirPath);
  }

  /**
   * 复制文件
   * @param {string} src - 源文件路径
   * @param {string} dest - 目标文件路径
   */
  async copyFile(src, dest) {
    await this.ensureDir(path.dirname(dest));
    await fs.copy(src, dest, { overwrite: true });
  }

  /**
   * 读取 JSON 文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>}
   */
  async readJson(filePath) {
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
    return {};
  }

  /**
   * 写入 JSON 文件
   * @param {string} filePath - 文件路径
   * @param {Object} data - 数据
   */
  async writeJson(filePath, data) {
    await this.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, data, { spaces: 2 });
  }

  /**
   * 追加内容到文件（支持分隔符标记的更新替换）
   *
   * 当文件已存在相同分隔符标记时，替换旧内容为新内容；
   * 否则追加到文件末尾。
   * @param {string} filePath - 文件路径
   * @param {string} content - 内容
   * @param {Object} options - 选项
   */
  async appendToFile(filePath, content, options = {}) {
    await this.ensureDir(path.dirname(filePath));

    const { separator = '\n\n', header = '' } = options;

    if (await fs.pathExists(filePath)) {
      let existing = await fs.readFile(filePath, 'utf8');

      // 检查是否已存在相同分隔符标记（如 "# ===== dev ====="）
      // 如果存在，先删除旧内容再写入新内容，实现"更新"语义
      if (separator.trim() && existing.includes(separator.trim())) {
        const marker = separator.trim();
        const markerIndex = existing.indexOf(marker);
        // 查找下一个同级别标记或文件结尾
        const nextMarker = existing.indexOf('\n# =====', markerIndex + marker.length);
        const endIndex = nextMarker !== -1 ? nextMarker : existing.length;

        existing = existing.substring(0, markerIndex) + separator + content + '\n' + existing.substring(endIndex);
        // 清理多余空行
        existing = existing.replace(/\n{3,}/g, '\n\n');
        await fs.writeFile(filePath, existing);
        return;
      }

      // 完全相同的内容已存在，跳过
      if (existing.includes(content)) {
        return;
      }

      await fs.appendFile(filePath, separator + content);
    } else {
      await fs.writeFile(filePath, header + content);
    }
  }

  /**
   * 安装 Skills
   * @param {string} sourceDir - 源目录
   * @param {Array<string>} skills - 技能列表
   */
  async installSkills(sourceDir, skills = []) {
    const skillsDir = path.join(this.homeDir, 'skills');
    await this.ensureDir(skillsDir);

    const installed = [];

    for (const skill of skills) {
      const srcPath = path.join(sourceDir, 'skills', skill);
      const destPath = path.join(skillsDir, skill);

      if (await fs.pathExists(srcPath)) {
        await this.copyFile(srcPath, destPath);
        installed.push(skill);
      }
    }

    return installed;
  }

  /**
   * 安装 Commands
   * @param {string} sourceDir - 源目录
   * @param {Array<string>} commands - 命令列表
   */
  async installCommands(sourceDir, commands = []) {
    const commandsDir = path.join(this.homeDir, 'commands');
    await this.ensureDir(commandsDir);

    const installed = [];

    for (const cmd of commands) {
      const srcPath = path.join(sourceDir, 'commands', `${cmd}.md`);
      const destPath = path.join(commandsDir, `${cmd}.md`);

      if (await fs.pathExists(srcPath)) {
        await this.copyFile(srcPath, destPath);
        installed.push(cmd);
      }
    }

    return installed;
  }

  /**
   * 安装 Agents
   * @param {string} sourceDir - 源目录
   * @param {Array<string>} agents - 角色列表
   */
  async installAgents(sourceDir, agents = []) {
    const agentsDir = path.join(this.homeDir, 'agents');
    await this.ensureDir(agentsDir);

    const installed = [];

    for (const agent of agents) {
      const srcPath = path.join(sourceDir, 'agents', `${agent}.md`);
      const destPath = path.join(agentsDir, `${agent}.md`);

      if (await fs.pathExists(srcPath)) {
        await this.copyFile(srcPath, destPath);
        installed.push(agent);
      }
    }

    return installed;
  }

  /**
   * 安装 Hooks
   * @param {string} sourceDir - 源目录
   * @param {Array<string>} hooks - 钩子列表
   */
  async installHooks(sourceDir, hooks = []) {
    const hooksDir = path.join(this.homeDir, 'hooks');
    await this.ensureDir(hooksDir);

    const installed = [];

    for (const hook of hooks) {
      const srcPath = path.join(sourceDir, 'hooks', `${hook}.sh`);
      const destPath = path.join(hooksDir, `${hook}.sh`);

      if (await fs.pathExists(srcPath)) {
        await this.copyFile(srcPath, destPath);
        // 设置可执行权限
        await fs.chmod(destPath, '755');
        installed.push(hook);
      }
    }

    return installed;
  }

  /**
   * 安装 Memory 模板
   * @param {string} sourceDir - 源目录
   * @param {Array<string>} memory - 记忆模板列表
   */
  async installMemory(sourceDir, memory = []) {
    const memoryDir = path.join(this.homeDir, 'memory');
    await this.ensureDir(memoryDir);

    const installed = [];

    for (const mem of memory) {
      const srcPath = path.join(sourceDir, 'memory', `${mem}.md`);
      const destPath = path.join(memoryDir, `${mem}.md`);

      if (await fs.pathExists(srcPath)) {
        await this.copyFile(srcPath, destPath);
        installed.push(mem);
      }
    }

    return installed;
  }

  /**
   * 安装 MCP Servers 配置
   * @param {string} sourceDir - 源目录
   * @param {Array<string>} mcpServers - MCP 服务列表
   */
  async installMcpServers(sourceDir, mcpServers = []) {
    // MCP 配置需要合并到 settings.json
    const settingsPath = path.join(this.homeDir, 'settings.json');
    const settings = await this.readJson(settingsPath);

    if (!settings.mcpServers) {
      settings.mcpServers = {};
    }

    const installed = [];

    for (const mcp of mcpServers) {
      const configPath = path.join(sourceDir, 'mcp-servers', `${mcp}.json`);
      
      if (await fs.pathExists(configPath)) {
        const config = await this.readJson(configPath);
        settings.mcpServers[mcp] = config;
        installed.push(mcp);
      }
    }

    await this.writeJson(settingsPath, settings);
    return installed;
  }

  /**
   * 卸载 Skills
   * @param {Array<string>} skills - 技能列表
   */
  async uninstallSkills(skills = []) {
    const skillsDir = path.join(this.homeDir, 'skills');
    const removed = [];

    for (const skill of skills) {
      const skillPath = path.join(skillsDir, skill);
      if (await fs.pathExists(skillPath)) {
        await fs.remove(skillPath);
        removed.push(skill);
      }
    }

    return removed;
  }

  /**
   * 卸载 Commands
   * @param {Array<string>} commands - 命令列表
   */
  async uninstallCommands(commands = []) {
    const commandsDir = path.join(this.homeDir, 'commands');
    const removed = [];

    for (const cmd of commands) {
      const cmdPath = path.join(commandsDir, `${cmd}.md`);
      if (await fs.pathExists(cmdPath)) {
        await fs.remove(cmdPath);
        removed.push(cmd);
      }
    }

    return removed;
  }

  /**
   * 卸载 Agents
   * @param {Array<string>} agents - 角色列表
   */
  async uninstallAgents(agents = []) {
    const agentsDir = path.join(this.homeDir, 'agents');
    const removed = [];

    for (const agent of agents) {
      const agentPath = path.join(agentsDir, `${agent}.md`);
      if (await fs.pathExists(agentPath)) {
        await fs.remove(agentPath);
        removed.push(agent);
      }
    }

    return removed;
  }

  /**
   * 卸载 Hooks
   * @param {Array<string>} hooks - 钩子列表
   */
  async uninstallHooks(hooks = []) {
    const hooksDir = path.join(this.homeDir, 'hooks');
    const removed = [];

    for (const hook of hooks) {
      const hookPath = path.join(hooksDir, `${hook}.sh`);
      if (await fs.pathExists(hookPath)) {
        await fs.remove(hookPath);
        removed.push(hook);
      }
    }

    return removed;
  }

  /**
   * 卸载 Memory 模板
   * @param {Array<string>} memory - 记忆模板列表
   */
  async uninstallMemory(memory = []) {
    const memoryDir = path.join(this.homeDir, 'memory');
    const removed = [];

    for (const mem of memory) {
      const memPath = path.join(memoryDir, `${mem}.md`);
      if (await fs.pathExists(memPath)) {
        await fs.remove(memPath);
        removed.push(mem);
      }
    }

    return removed;
  }

  /**
   * 卸载 MCP Servers 配置
   * @param {Array<string>} mcpServers - MCP 服务列表
   */
  async uninstallMcpServers(mcpServers = []) {
    const settingsPath = path.join(this.homeDir, 'settings.json');
    const settings = await this.readJson(settingsPath);

    if (!settings.mcpServers) {
      return [];
    }

    const removed = [];

    for (const mcp of mcpServers) {
      if (settings.mcpServers[mcp]) {
        delete settings.mcpServers[mcp];
        removed.push(mcp);
      }
    }

    await this.writeJson(settingsPath, settings);
    return removed;
  }
}

module.exports = BaseInstaller;
