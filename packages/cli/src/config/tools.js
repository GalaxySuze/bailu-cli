/**
 * 统一工具配置模块
 *
 * 所有 AI 工具元数据的唯一来源，消除项目中 5 处硬编码不一致问题。
 * 新增工具只需在此文件中添加配置即可。
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * 工具配置表
 *
 * 每个工具定义：
 * - name: 工具显示名称
 * - emoji: 工具图标
 * - getUserDir(home): 获取用户级配置目录
 * - installer: 对应的 Installer 类名
 * - components: 各组件支持声明
 *   - supported: 是否支持
 *   - dir: 组件目录名（文件复制模式）
 *   - type: 安装方式（'dir' | 'append-to-file' | 'write-file' | 'merge-json' | 'write-json'）
 *   - file: 目标文件名（append-to-file / write-file / merge-json 模式）
 *   - key: JSON 中的字段名（merge-json 模式）
 */
const TOOLS = {
  claude: {
    name: 'Claude Code',
    emoji: '🤖',
    getUserDir(home) {
      return path.join(home, '.claude');
    },
    installer: 'ClaudeInstaller',
    components: {
      skills:     { supported: true,  dir: 'skills' },
      commands:   { supported: true,  dir: 'commands' },
      agents:     { supported: true,  dir: 'agents' },
      rules:      { supported: true,  type: 'append-to-file', file: 'CLAUDE.md' },
      hooks:      { supported: true,  dir: 'hooks' },
      memory:     { supported: true,  dir: 'memory' },
      mcpServers: { supported: true,  type: 'merge-json', file: 'settings.json' },
    }
  },

  trae: {
    name: 'Trae',
    emoji: '🎯',
    getUserDir(home) {
      return path.join(home, '.trae');
    },
    installer: 'TraeInstaller',
    components: {
      skills:     { supported: true,  dir: 'skills' },
      commands:   { supported: true,  dir: 'commands' },
      agents:     { supported: true,  dir: 'agents' },
      rules:      { supported: true,  type: 'write-file', file: 'rules/project_rules.md' },
      hooks:      { supported: false },
      memory:     { supported: true,  dir: 'memory' },
      mcpServers: { supported: true,  type: 'write-json', file: 'mcp.json' },
    }
  },

  qoder: {
    name: 'Qoder',
    emoji: '🔍',
    getUserDir(home) {
      return path.join(home, '.qoder');
    },
    installer: 'QoderInstaller',
    components: {
      skills:     { supported: true,  dir: 'skills' },
      commands:   { supported: false },
      agents:     { supported: true,  dir: 'agents' },
      rules:      { supported: false },
      hooks:      { supported: false },
      memory:     { supported: false },
      mcpServers: { supported: true,  type: 'merge-json', file: '.qoder.json', key: 'mcpServers' },
    }
  }
};

/**
 * 获取指定工具的配置
 * @param {string} key - 工具标识（如 'claude', 'trae', 'qoder'）
 * @returns {Object|null} 工具配置对象，不存在返回 null
 */
function getToolConfig(key) {
  return TOOLS[key] || null;
}

/**
 * 获取所有工具的标识列表
 * @returns {string[]}
 */
function getAllToolKeys() {
  return Object.keys(TOOLS);
}

/**
 * 获取所有工具的配置映射
 * @returns {Object}
 */
function getAllTools() {
  return TOOLS;
}

/**
 * 获取已安装工具的标识列表
 * @returns {string[]} 已检测到配置目录的工具标识
 */
function getInstalledToolKeys() {
  const home = os.homedir();
  return Object.keys(TOOLS).filter(key => {
    const toolDir = TOOLS[key].getUserDir(home);
    return fs.existsSync(toolDir);
  });
}

/**
 * 检查指定工具是否已安装
 * @param {string} key - 工具标识
 * @returns {boolean}
 */
function isToolInstalled(key) {
  const config = TOOLS[key];
  if (!config) return false;
  const toolDir = config.getUserDir(os.homedir());
  return fs.existsSync(toolDir);
}

/**
 * 获取所有工具的列表（兼容旧 AI_TOOLS 格式，用于 status 展示）
 * @returns {Object} { key: { name, emoji, dir } }
 */
function getToolsStatusList() {
  const home = os.homedir();
  const result = {};
  for (const [key, config] of Object.entries(TOOLS)) {
    result[key] = {
      name: config.name,
      emoji: config.emoji,
      dir: config.getUserDir(home)
    };
  }
  return result;
}

module.exports = {
  TOOLS,
  getToolConfig,
  getAllToolKeys,
  getAllTools,
  getInstalledToolKeys,
  isToolInstalled,
  getToolsStatusList
};
