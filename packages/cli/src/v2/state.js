/**
 * @fileoverview 白鹿 CLI v2 状态文件管理
 * 
 * 状态文件 (.bailu.yaml) 结构：
 * {
 *   version: "2.0.0",           // 安装的版本
 *   installedAt: "2026-06-08",  // 安装时间
 *   scope: "project",           // 安装范围
 *   language: "zh",             // Skills 语言
 *   platforms: {                // 平台配置
 *     "claude-code": {
 *       installed: true,
 *       skills: ["bailu-sdd-start", ...],
 *       agents: ["bailu-fullstack.md"],
 *       commands: ["bailu-sdd-start.md"],
 *       installedAt: "2026-06-08"
 *     }
 *   },
 *   workflows: {                // 工作流配置
 *     "dev": {
 *       version: "1.0.0",
 *       installedAt: "2026-06-08"
 *     }
 *   }
 * }
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

/**
 * 状态文件路径
 * @param {string} [cwd] - 工作目录，默认为当前目录
 * @returns {string} 状态文件绝对路径
 */
function getStateFilePath(cwd = process.cwd()) {
  return path.join(cwd, '.bailu.yaml');
}

/**
 * 读取状态文件
 * @param {string} [cwd] - 工作目录
 * @returns {Promise<Object|null>} 状态对象，不存在返回 null
 */
async function readState(cwd = process.cwd()) {
  const statePath = getStateFilePath(cwd);
  
  try {
    if (await fs.pathExists(statePath)) {
      const content = await fs.readFile(statePath, 'utf8');
      return yaml.load(content);
    }
  } catch (error) {
    console.error(`读取状态文件失败: ${error.message}`);
  }
  
  return null;
}

/**
 * 写入状态文件
 * @param {Object} state - 状态对象
 * @param {string} [cwd] - 工作目录
 * @returns {Promise<boolean>} 是否成功
 */
async function writeState(state, cwd = process.cwd()) {
  const statePath = getStateFilePath(cwd);
  
  try {
    // 确保目录存在
    await fs.ensureDir(path.dirname(statePath));
    
    // 写入 YAML
    const content = yaml.dump(state, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });
    
    await fs.writeFile(statePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`写入状态文件失败: ${error.message}`);
    return false;
  }
}

/**
 * 创建初始状态
 * 
 * 状态文件结构对齐 PRD 第四节：
 * - project: 项目信息（名称、绝对路径）
 * - workflows: 已安装工作流及来源/包名/版本
 * - platforms: 平台级安装详情
 * - mcp: MCP 服务开关
 * - sdd: SDD 进度（运行时动态读取 .sdd/sdd-context.md，不在状态文件里冗余）
 * 
 * @param {Object} options - 初始化选项
 * @param {string} options.scope - 安装范围 (project/global)
 * @param {string} options.language - 语言 (zh/en)
 * @param {string} [options.projectPath] - 项目绝对路径（用于提取 name）
 * @returns {Object} 初始状态对象
 */
function createInitialState(options = {}) {
  const path = require('path');
  
  // 从 projectPath 提取项目名（路径末级目录名）
  const projectPath = options.projectPath || process.cwd();
  const projectName = path.basename(projectPath);
  
  return {
    version: '2.0.0',
    installedAt: new Date().toISOString().split('T')[0],
    scope: options.scope || 'project',
    language: options.language || 'zh',
    project: {
      name: projectName,
      path: projectPath
    },
    platforms: {},
    workflows: {
      // 默认安装 dev 工作流，源为 npm 包内置 assets
      dev: {
        source: 'npm-assets',
        package: '@vickzhang/bailu-cli',
        version: '2.0.0',
        installedAt: new Date().toISOString().split('T')[0]
      }
    },
    mcp: {}
  };
}

/**
 * 检查是否已初始化
 * @param {string} [cwd] - 工作目录
 * @returns {Promise<boolean>}
 */
async function isInitialized(cwd = process.cwd()) {
  const state = await readState(cwd);
  return state !== null && state.version !== undefined;
}

/**
 * 更新平台安装状态
 * @param {Object} state - 当前状态
 * @param {string} platformId - 平台 ID
 * @param {Object} platformState - 平台状态
 * @returns {Object} 更新后的状态
 */
function updatePlatformState(state, platformId, platformState) {
  return {
    ...state,
    platforms: {
      ...state.platforms,
      [platformId]: {
        ...state.platforms[platformId],
        ...platformState,
        installedAt: new Date().toISOString().split('T')[0]
      }
    }
  };
}

/**
 * 更新工作流安装状态
 * @param {Object} state - 当前状态
 * @param {string} workflowId - 工作流 ID
 * @param {Object} workflowState - 工作流状态
 * @returns {Object} 更新后的状态
 */
function updateWorkflowState(state, workflowId, workflowState) {
  return {
    ...state,
    workflows: {
      ...state.workflows,
      [workflowId]: {
        ...state.workflows[workflowId],
        ...workflowState,
        installedAt: new Date().toISOString().split('T')[0]
      }
    }
  };
}

/**
 * 清除状态
 * @param {string} [cwd] - 工作目录
 * @returns {Promise<boolean>}
 */
async function clearState(cwd = process.cwd()) {
  const statePath = getStateFilePath(cwd);
  
  try {
    if (await fs.pathExists(statePath)) {
      await fs.remove(statePath);
    }
    return true;
  } catch (error) {
    console.error(`清除状态文件失败: ${error.message}`);
    return false;
  }
}

// 导出
module.exports = {
  getStateFilePath,
  readState,
  writeState,
  createInitialState,
  isInitialized,
  updatePlatformState,
  updateWorkflowState,
  clearState
};
