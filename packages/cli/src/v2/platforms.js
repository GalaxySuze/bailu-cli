/**
 * @fileoverview 白鹿 CLI v2 平台检测
 * 
 * 平台定义数据化，新增平台只加一条记录
 * 
 * 支持的平台：
 * - Claude Code (CLI)
 * - Qoder 编辑器
 * - Codex（后续迭代）
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

/**
 * 平台定义
 * 
 * @typedef {Object} PlatformDefinition
 * @property {string} id - 平台唯一标识
 * @property {string} name - 显示名称
 * @property {string} skillsDir - 项目级 Skills 目录
 * @property {string} globalSkillsDir - 全局 Skills 目录
 * @property {string[]} detectionPaths - 检测路径（相对项目根目录或 home）
 * @property {string} detectionCommand - 检测命令（可选）
 */
const PLATFORMS = {
  'claude-code': {
    id: 'claude-code',
    name: 'Claude Code',
    skillsDir: '.claude/skills',
    globalSkillsDir: '~/.claude/skills',
    detectionPaths: ['.claude'],
    detectionCommand: 'claude --version'
  },
  'qoder': {
    id: 'qoder',
    name: 'Qoder 编辑器',
    skillsDir: '.qoder/skills',
    globalSkillsDir: '~/.qoder/skills',
    detectionPaths: ['.qoder'],
    detectionCommand: 'qoder --version'
  },
  'codex': {
    id: 'codex',
    name: 'Codex',
    skillsDir: '.codex/skills',
    globalSkillsDir: '~/.codex/skills',
    detectionPaths: ['.codex'],
    detectionCommand: 'codex --version'
  }
};

/**
 * 检测单个平台
 * @param {PlatformDefinition} platform - 平台定义
 * @param {string} cwd - 工作目录
 * @returns {Promise<Object>} 检测结果
 */
async function detectPlatform(platform, cwd = process.cwd()) {
  const result = {
    id: platform.id,
    name: platform.name,
    detected: false,
    version: null,
    skillsDir: platform.skillsDir,
    globalSkillsDir: platform.globalSkillsDir
  };

  // 检测目录是否存在
  for (const detectPath of platform.detectionPaths) {
    const fullPath = path.join(cwd, detectPath);
    if (await fs.pathExists(fullPath)) {
      result.detected = true;
      break;
    }
  }

  // 如果目录检测成功，尝试获取版本
  if (result.detected && platform.detectionCommand) {
    try {
      const { execSync } = require('child_process');
      const versionOutput = execSync(platform.detectionCommand, {
        encoding: 'utf8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
      
      // 提取版本号（支持 v1.0.0 或 1.0.0 格式）
      const versionMatch = versionOutput.match(/v?(\d+\.\d+\.\d+)/);
      if (versionMatch) {
        result.version = versionMatch[1];
      }
    } catch (error) {
      // 命令执行失败，不影响检测结果
    }
  }

  return result;
}

/**
 * 检测所有平台
 * @param {string} cwd - 工作目录
 * @returns {Promise<Object[]>} 所有平台检测结果
 */
async function detectAllPlatforms(cwd = process.cwd()) {
  const results = [];
  
  for (const platform of Object.values(PLATFORMS)) {
    const result = await detectPlatform(platform, cwd);
    results.push(result);
  }
  
  return results;
}

/**
 * 获取检测到的平台
 * @param {string} cwd - 工作目录
 * @returns {Promise<Object[]>} 检测到的平台列表
 */
async function getDetectedPlatforms(cwd = process.cwd()) {
  const allPlatforms = await detectAllPlatforms(cwd);
  return allPlatforms.filter(p => p.detected);
}

/**
 * 获取平台定义
 * @param {string} platformId - 平台 ID
 * @returns {PlatformDefinition|null}
 */
function getPlatformDefinition(platformId) {
  return PLATFORMS[platformId] || null;
}

/**
 * 获取所有平台定义
 * @returns {Object<string, PlatformDefinition>}
 */
function getAllPlatformDefinitions() {
  return { ...PLATFORMS };
}

/**
 * 检查平台是否支持
 * @param {string} platformId - 平台 ID
 * @returns {boolean}
 */
function isPlatformSupported(platformId) {
  return platformId in PLATFORMS;
}

// 导出
module.exports = {
  PLATFORMS,
  detectPlatform,
  detectAllPlatforms,
  getDetectedPlatforms,
  getPlatformDefinition,
  getAllPlatformDefinitions,
  isPlatformSupported
};
