/**
 * Hooks 管理器
 * 
 * 管理 Git Hooks 和自定义钩子
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const BAILU_HOME = path.join(os.homedir(), '.bailu');
const CLAUDE_HOME = path.join(os.homedir(), '.claude');

/**
 * 支持的 Git Hooks 类型
 */
const GIT_HOOKS = [
  'pre-commit',
  'prepare-commit-msg',
  'commit-msg',
  'post-commit',
  'pre-push',
  'post-merge',
  'pre-rebase',
  'post-checkout'
];

/**
 * Hooks 管理器类
 */
class HooksManager {
  constructor() {
    this.hooksDir = path.join(CLAUDE_HOME, 'hooks');
    this.gitHooksDir = null;
  }

  /**
   * 获取 Git hooks 目录
   * @param {string} projectDir - 项目目录
   * @returns {string|null} Git hooks 目录
   */
  getGitHooksDir(projectDir = process.cwd()) {
    try {
      const gitDir = execSync('git rev-parse --git-dir', {
        cwd: projectDir,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
      
      return path.resolve(projectDir, gitDir, 'hooks');
    } catch {
      return null;
    }
  }

  /**
   * 列出已安装的 hooks
   * @returns {Promise<Array>} hooks 列表
   */
  async listHooks() {
    const hooks = [];

    // 列出 bailu hooks 目录中的 hooks
    if (await fs.pathExists(this.hooksDir)) {
      const files = await fs.readdir(this.hooksDir);
      
      for (const file of files) {
        const filePath = path.join(this.hooksDir, file);
        const stat = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf8');
        
        hooks.push({
          name: file.replace(/\.(sh|js)$/, ''),
          file,
          path: filePath,
          size: stat.size,
          modified: stat.mtime,
          type: this.getHookType(file),
          isGitHook: GIT_HOOKS.includes(file.replace(/\.(sh|js)$/, '')),
          preview: content.substring(0, 200)
        });
      }
    }

    return hooks;
  }

  /**
   * 获取 hook 类型
   * @param {string} filename - 文件名
   * @returns {string} 类型
   */
  getHookType(filename) {
    if (filename.endsWith('.sh')) return 'shell';
    if (filename.endsWith('.js')) return 'node';
    return 'unknown';
  }

  /**
   * 安装 hook 到项目
   * @param {string} hookName - hook 名称
   * @param {string} projectDir - 项目目录
   * @returns {Promise<Object>} 安装结果
   */
  async installHookToProject(hookName, projectDir = process.cwd()) {
    const gitHooksDir = this.getGitHooksDir(projectDir);
    
    if (!gitHooksDir) {
      throw new Error('不在 Git 仓库中');
    }

    // 确保 hooks 目录存在
    await fs.ensureDir(gitHooksDir);

    // 查找 hook 文件
    const hookFile = await this.findHookFile(hookName);
    if (!hookFile) {
      throw new Error(`找不到 hook: ${hookName}`);
    }

    // 复制 hook 文件
    const destPath = path.join(gitHooksDir, hookName);
    await fs.copy(hookFile, destPath);
    await fs.chmod(destPath, '755');

    return {
      success: true,
      hook: hookName,
      path: destPath
    };
  }

  /**
   * 从项目卸载 hook
   * @param {string} hookName - hook 名称
   * @param {string} projectDir - 项目目录
   * @returns {Promise<Object>} 卸载结果
   */
  async uninstallHookFromProject(hookName, projectDir = process.cwd()) {
    const gitHooksDir = this.getGitHooksDir(projectDir);
    
    if (!gitHooksDir) {
      throw new Error('不在 Git 仓库中');
    }

    const hookPath = path.join(gitHooksDir, hookName);
    
    if (await fs.pathExists(hookPath)) {
      await fs.remove(hookPath);
      return {
        success: true,
        hook: hookName
      };
    }

    return {
      success: false,
      message: `Hook ${hookName} 不存在`
    };
  }

  /**
   * 查找 hook 文件
   * @param {string} hookName - hook 名称
   * @returns {Promise<string|null>} hook 文件路径
   */
  async findHookFile(hookName) {
    // 1. 检查 .sh 扩展名
    const shPath = path.join(this.hooksDir, `${hookName}.sh`);
    if (await fs.pathExists(shPath)) {
      return shPath;
    }

    // 2. 检查 .js 扩展名
    const jsPath = path.join(this.hooksDir, `${hookName}.js`);
    if (await fs.pathExists(jsPath)) {
      return jsPath;
    }

    // 3. 检查无扩展名
    const noExtPath = path.join(this.hooksDir, hookName);
    if (await fs.pathExists(noExtPath)) {
      return noExtPath;
    }

    return null;
  }

  /**
   * 创建自定义 hook
   * @param {string} hookName - hook 名称
   * @param {string} content - hook 内容
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 创建结果
   */
  async createHook(hookName, content, options = {}) {
    const { type = 'shell' } = options;
    const ext = type === 'node' ? '.js' : '.sh';
    const filePath = path.join(this.hooksDir, `${hookName}${ext}`);

    await fs.ensureDir(this.hooksDir);
    await fs.writeFile(filePath, content);
    await fs.chmod(filePath, '755');

    return {
      success: true,
      hook: hookName,
      path: filePath
    };
  }

  /**
   * 删除 hook
   * @param {string} hookName - hook 名称
   * @returns {Promise<Object>} 删除结果
   */
  async deleteHook(hookName) {
    const hookFile = await this.findHookFile(hookName);
    
    if (!hookFile) {
      throw new Error(`找不到 hook: ${hookName}`);
    }

    await fs.remove(hookFile);

    return {
      success: true,
      hook: hookName
    };
  }

  /**
   * 获取项目的 Git hooks 状态
   * @param {string} projectDir - 项目目录
   * @returns {Promise<Object>} 状态信息
   */
  async getProjectHooksStatus(projectDir = process.cwd()) {
    const gitHooksDir = this.getGitHooksDir(projectDir);
    
    if (!gitHooksDir) {
      return {
        isGitRepo: false,
        hooks: []
      };
    }

    const hooks = [];
    
    if (await fs.pathExists(gitHooksDir)) {
      const files = await fs.readdir(gitHooksDir);
      
      for (const file of files) {
        if (file.endsWith('.sample')) continue;
        
        const filePath = path.join(gitHooksDir, file);
        const stat = await fs.stat(filePath);
        
        hooks.push({
          name: file,
          path: filePath,
          size: stat.size,
          modified: stat.mtime,
          isExecutable: (stat.mode & 0o111) !== 0
        });
      }
    }

    return {
      isGitRepo: true,
      gitHooksDir,
      hooks
    };
  }

  /**
   * 运行 hook
   * @param {string} hookName - hook 名称
   * @param {Array} args - 参数
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 运行结果
   */
  async runHook(hookName, args = [], options = {}) {
    const { cwd = process.cwd() } = options;
    const hookFile = await this.findHookFile(hookName);
    
    if (!hookFile) {
      throw new Error(`找不到 hook: ${hookName}`);
    }

    try {
      const command = hookFile.endsWith('.js') 
        ? `node "${hookFile}" ${args.join(' ')}`
        : `bash "${hookFile}" ${args.join(' ')}`;
      
      const output = execSync(command, {
        cwd,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      return {
        success: true,
        hook: hookName,
        output
      };
    } catch (error) {
      return {
        success: false,
        hook: hookName,
        error: error.message,
        stderr: error.stderr
      };
    }
  }
}

module.exports = HooksManager;
