/**
 * 团队同步管理器
 * 
 * 管理工作流配置的团队同步
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

/**
 * 团队同步管理器类
 */
class SyncManager {
  constructor() {
    this.configPath = path.join(BAILU_HOME, 'sync.json');
    this.workflowsDir = path.join(BAILU_HOME, 'workflows');
  }

  /**
   * 读取同步配置
   * @returns {Promise<Object>} 配置内容
   */
  async readConfig() {
    if (await fs.pathExists(this.configPath)) {
      return await fs.readJson(this.configPath);
    }
    return {
      repo: null,
      branch: 'main',
      autoSync: false,
      lastSync: null
    };
  }

  /**
   * 写入同步配置
   * @param {Object} config - 配置内容
   */
  async writeConfig(config) {
    await fs.ensureDir(BAILU_HOME);
    await fs.writeJson(this.configPath, config, { spaces: 2 });
  }

  /**
   * 初始化团队仓库
   * @param {string} repoUrl - 仓库地址
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 初始化结果
   */
  async init(repoUrl, options = {}) {
    const { branch } = options;

    // 验证仓库地址
    if (!repoUrl) {
      throw new Error('请提供仓库地址');
    }

    // 先检测默认分支（如果用户未指定）
    let targetBranch = branch;
    if (!targetBranch) {
      targetBranch = await this.detectDefaultBranch(repoUrl);
    }

    // 保存配置
    await this.writeConfig({
      repo: repoUrl,
      branch: targetBranch,
      autoSync: false,
      lastSync: null
    });

    // 克隆仓库
    await this.cloneRepo(repoUrl, targetBranch);

    return {
      success: true,
      repo: repoUrl,
      branch: targetBranch
    };
  }

  /**
   * 检测远程仓库的默认分支
   * @param {string} repoUrl - 仓库地址
   * @returns {Promise<string>} 分支名
   */
  async detectDefaultBranch(repoUrl) {
    try {
      // 使用 git ls-remote 获取远程 HEAD 引用
      const result = execSync(`git ls-remote --symref ${repoUrl} HEAD`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // 解析输出，格式如: ref: refs/heads/main\tHEAD
      const match = result.match(/ref: refs\/heads\/([\w.-]+)\s+HEAD/);
      if (match) {
        return match[1];
      }
    } catch (e) {
      // 忽略错误，使用默认值
    }
    
    // 默认返回 main
    return 'main';
  }

  /**
   * 克隆仓库（自动检测分支）
   * @param {string} repoUrl - 仓库地址
   * @param {string} branch - 分支（可选，为空时自动检测）
   */
  async cloneRepo(repoUrl, branch) {
    const tempDir = path.join(os.tmpdir(), 'bailu-sync-temp');

    try {
      // 清理临时目录
      await fs.remove(tempDir);

      // 如果没有指定分支，尝试常见的分支名
      const branchesToTry = branch ? [branch] : ['main', 'master'];
      let cloned = false;
      let usedBranch = branch;
      
      for (const b of branchesToTry) {
        try {
          execSync(`git clone --depth 1 --branch ${b} ${repoUrl} ${tempDir}`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
          });
          cloned = true;
          usedBranch = b; // 记录成功的分支名
          break;
        } catch (e) {
          // 清理失败的克隆，继续尝试下一个分支
          await fs.remove(tempDir);
          continue;
        }
      }
      
      if (!cloned) {
        throw new Error(`无法克隆仓库，请检查仓库地址和分支配置`);
      }

      // 复制工作流到本地
      const workflowsDir = path.join(tempDir, 'workflows');
      if (await fs.pathExists(workflowsDir)) {
        await fs.ensureDir(this.workflowsDir);
        await fs.copy(workflowsDir, this.workflowsDir, { overwrite: true });
      }

      // 更新配置中的分支名（如果发生了回退）
      if (usedBranch && usedBranch !== branch) {
        const config = await this.readConfig();
        config.branch = usedBranch;
        await this.writeConfig(config);
      }

      // 清理临时目录
      await fs.remove(tempDir);
    } catch (error) {
      await fs.remove(tempDir);
      throw new Error(`克隆仓库失败: ${error.message}`);
    }
  }

  /**
   * 从远程拉取更新
   * @returns {Promise<Object>} 拉取结果
   */
  async pull() {
    const config = await this.readConfig();
    
    if (!config.repo) {
      throw new Error('未配置团队仓库，请先运行: bailu sync init <repo-url>');
    }

    const tempDir = path.join(os.tmpdir(), 'bailu-sync-temp');

    try {
      // 清理临时目录
      await fs.remove(tempDir);

      // 克隆最新代码
      execSync(`git clone --depth 1 --branch ${config.branch} ${config.repo} ${tempDir}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // 同步工作流
      const remoteWorkflowsDir = path.join(tempDir, 'workflows');
      if (await fs.pathExists(remoteWorkflowsDir)) {
        await fs.ensureDir(this.workflowsDir);
        
        // 获取远程工作流列表
        const remoteWorkflows = await fs.readdir(remoteWorkflowsDir);
        
        // 同步每个工作流
        for (const workflow of remoteWorkflows) {
          const srcPath = path.join(remoteWorkflowsDir, workflow);
          const destPath = path.join(this.workflowsDir, workflow);
          
          await fs.copy(srcPath, destPath, { overwrite: true });
        }
      }

      // 更新最后同步时间
      config.lastSync = new Date().toISOString();
      await this.writeConfig(config);

      // 清理临时目录
      await fs.remove(tempDir);

      return {
        success: true,
        message: '同步完成',
        lastSync: config.lastSync
      };
    } catch (error) {
      await fs.remove(tempDir);
      throw new Error(`拉取更新失败: ${error.message}`);
    }
  }

  /**
   * 推送本地更改
   * @param {string} message - 提交信息
   * @returns {Promise<Object>} 推送结果
   */
  async push(message) {
    const config = await this.readConfig();
    
    if (!config.repo) {
      throw new Error('未配置团队仓库，请先运行: bailu sync init <repo-url>');
    }

    const tempDir = path.join(os.tmpdir(), 'bailu-sync-push');

    try {
      // 清理临时目录
      await fs.remove(tempDir);

      // 克隆仓库
      execSync(`git clone --branch ${config.branch} ${config.repo} ${tempDir}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // 复制本地工作流到仓库
      const repoWorkflowsDir = path.join(tempDir, 'workflows');
      await fs.ensureDir(repoWorkflowsDir);
      
      if (await fs.pathExists(this.workflowsDir)) {
        const localWorkflows = await fs.readdir(this.workflowsDir);
        
        for (const workflow of localWorkflows) {
          const srcPath = path.join(this.workflowsDir, workflow);
          const destPath = path.join(repoWorkflowsDir, workflow);
          
          await fs.copy(srcPath, destPath, { overwrite: true });
        }
      }

      // 提交并推送
      execSync(`cd ${tempDir} && git add -A && git commit -m "${message || 'Update workflows'}" && git push`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // 清理临时目录
      await fs.remove(tempDir);

      return {
        success: true,
        message: '推送成功'
      };
    } catch (error) {
      await fs.remove(tempDir);
      throw new Error(`推送失败: ${error.message}`);
    }
  }

  /**
   * 对比本地和远程差异
   * @returns {Promise<Object>} 差异信息
   */
  async diff() {
    const config = await this.readConfig();
    
    if (!config.repo) {
      throw new Error('未配置团队仓库');
    }

    // 获取本地工作流
    const localWorkflows = await this.getLocalWorkflows();
    
    // 获取远程工作流（临时克隆）
    const tempDir = path.join(os.tmpdir(), 'bailu-sync-diff');
    
    try {
      await fs.remove(tempDir);
      execSync(`git clone --depth 1 --branch ${config.branch} ${config.repo} ${tempDir}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const remoteWorkflowsDir = path.join(tempDir, 'workflows');
      const remoteWorkflows = {};
      
      if (await fs.pathExists(remoteWorkflowsDir)) {
        const dirs = await fs.readdir(remoteWorkflowsDir);
        for (const dir of dirs) {
          const manifestPath = path.join(remoteWorkflowsDir, dir, 'manifest.json');
          if (await fs.pathExists(manifestPath)) {
            const manifest = await fs.readJson(manifestPath);
            remoteWorkflows[dir] = manifest;
          }
        }
      }

      await fs.remove(tempDir);

      // 对比差异
      const diff = {
        added: [],      // 本地有，远程没有
        removed: [],    // 远程有，本地没有
        modified: [],   // 都有，但版本不同
        upToDate: []    // 都有，版本相同
      };

      for (const [name, local] of Object.entries(localWorkflows)) {
        if (remoteWorkflows[name]) {
          if (local.version !== remoteWorkflows[name].version) {
            diff.modified.push({
              name,
              localVersion: local.version,
              remoteVersion: remoteWorkflows[name].version
            });
          } else {
            diff.upToDate.push(name);
          }
        } else {
          diff.added.push(name);
        }
      }

      for (const name of Object.keys(remoteWorkflows)) {
        if (!localWorkflows[name]) {
          diff.removed.push(name);
        }
      }

      return diff;
    } catch (error) {
      await fs.remove(tempDir);
      throw new Error(`对比失败: ${error.message}`);
    }
  }

  /**
   * 获取本地工作流
   * @returns {Promise<Object>} 本地工作流
   */
  async getLocalWorkflows() {
    const workflows = {};
    
    if (await fs.pathExists(this.workflowsDir)) {
      const dirs = await fs.readdir(this.workflowsDir);
      
      for (const dir of dirs) {
        const manifestPath = path.join(this.workflowsDir, dir, 'manifest.json');
        if (await fs.pathExists(manifestPath)) {
          const manifest = await fs.readJson(manifestPath);
          workflows[dir] = manifest;
        }
      }
    }
    
    return workflows;
  }

  /**
   * 获取同步状态
   * @returns {Promise<Object>} 状态信息
   */
  async getStatus() {
    const config = await this.readConfig();
    const localWorkflows = await this.getLocalWorkflows();
    
    return {
      configured: !!config.repo,
      repo: config.repo,
      branch: config.branch,
      lastSync: config.lastSync,
      localWorkflows: Object.keys(localWorkflows).length
    };
  }
}

module.exports = SyncManager;
