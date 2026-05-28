/**
 * 团队同步管理器
 *
 * 管理工作流配置的团队同步。
 * 所有 git 操作通过 GIT_ASKPASS 注入凭据，凭据不出现在 URL 中。
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const { getCredentials, createAskPassScript } = require('../utils/credentials');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

/**
 * 构建注入了 GIT_ASKPASS 的环境变量对象
 * @param {string} askPassScript - askpass 脚本路径
 * @returns {Object}
 */
function buildGitEnv(askPassScript) {
  return {
    ...process.env,
    GIT_ASKPASS: askPassScript,
    // 禁止 git 弹出系统 GUI 凭据对话框
    GIT_TERMINAL_PROMPT: '0'
  };
}

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
   * @returns {Promise<Object>}
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
   * @param {Object} config
   */
  async writeConfig(config) {
    await fs.ensureDir(BAILU_HOME);
    await fs.writeJson(this.configPath, config, { spaces: 2 });
  }

  /**
   * 初始化团队仓库
   * @param {string} repoUrl - HTTPS 格式仓库地址
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async init(repoUrl, options = {}) {
    const { branch } = options;

    if (!repoUrl) {
      throw new Error('请提供仓库地址');
    }

    let targetBranch = branch;
    if (!targetBranch) {
      targetBranch = await this.detectDefaultBranch(repoUrl);
    }

    await this.writeConfig({
      repo: repoUrl,
      branch: targetBranch,
      autoSync: false,
      lastSync: null
    });

    await this.cloneRepo(repoUrl, targetBranch);

    return {
      success: true,
      repo: repoUrl,
      branch: targetBranch
    };
  }

  /**
   * 检测远程仓库的默认分支
   * @param {string} repoUrl
   * @returns {Promise<string>}
   */
  async detectDefaultBranch(repoUrl) {
    const creds = await getCredentials();
    const { scriptPath, cleanup } = await createAskPassScript(creds.username, creds.password);

    try {
      const result = execSync(`git ls-remote --symref "${repoUrl}" HEAD`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        env: buildGitEnv(scriptPath)
      });

      const match = result.match(/ref: refs\/heads\/([\w.-]+)\s+HEAD/);
      if (match) {
        return match[1];
      }
    } catch {
      // 忽略错误，使用默认值
    } finally {
      await cleanup();
    }

    return 'main';
  }

  /**
   * 克隆仓库（通过 GIT_ASKPASS 注入凭据）
   * @param {string} repoUrl
   * @param {string} branch
   */
  async cloneRepo(repoUrl, branch) {
    const tempDir = path.join(os.tmpdir(), 'bailu-sync-temp');

    const creds = await getCredentials();
    const { scriptPath, cleanup } = await createAskPassScript(creds.username, creds.password);
    const gitEnv = buildGitEnv(scriptPath);

    try {
      await fs.remove(tempDir);

      const branchesToTry = branch ? [branch] : ['main', 'master'];
      let cloned = false;
      let usedBranch = branch;

      for (const b of branchesToTry) {
        try {
          execSync(`git clone --depth 1 --branch ${b} "${repoUrl}" "${tempDir}"`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
            env: gitEnv
          });
          cloned = true;
          usedBranch = b;
          break;
        } catch {
          await fs.remove(tempDir);
        }
      }

      if (!cloned) {
        throw new Error('无法克隆仓库，请检查仓库地址、分支和凭据配置');
      }

      // 复制工作流到本地
      const workflowsDir = path.join(tempDir, 'workflows');
      if (await fs.pathExists(workflowsDir)) {
        await fs.ensureDir(this.workflowsDir);
        await fs.copy(workflowsDir, this.workflowsDir, { overwrite: true });
      }

      // 分支发生回退时更新配置
      if (usedBranch && usedBranch !== branch) {
        const config = await this.readConfig();
        config.branch = usedBranch;
        await this.writeConfig(config);
      }

      await fs.remove(tempDir);
    } catch (error) {
      await fs.remove(tempDir);
      throw new Error(`克隆仓库失败: ${error.message}`);
    } finally {
      await cleanup();
    }
  }

  /**
   * 从远程拉取更新
   * @returns {Promise<Object>}
   */
  async pull() {
    const config = await this.readConfig();

    if (!config.repo) {
      throw new Error('未配置团队仓库，请先运行: bailu sync init <repo-url>');
    }

    const tempDir = path.join(os.tmpdir(), 'bailu-sync-temp');

    const creds = await getCredentials();
    const { scriptPath, cleanup } = await createAskPassScript(creds.username, creds.password);

    try {
      await fs.remove(tempDir);

      execSync(
        `git clone --depth 1 --branch ${config.branch} "${config.repo}" "${tempDir}"`,
        {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
          env: buildGitEnv(scriptPath)
        }
      );

      // 同步工作流
      const remoteWorkflowsDir = path.join(tempDir, 'workflows');
      if (await fs.pathExists(remoteWorkflowsDir)) {
        await fs.ensureDir(this.workflowsDir);

        const remoteWorkflows = await fs.readdir(remoteWorkflowsDir);
        for (const workflow of remoteWorkflows) {
          const srcPath = path.join(remoteWorkflowsDir, workflow);
          const destPath = path.join(this.workflowsDir, workflow);
          await fs.copy(srcPath, destPath, { overwrite: true });
        }
      }

      config.lastSync = new Date().toISOString();
      await this.writeConfig(config);
      await fs.remove(tempDir);

      return {
        success: true,
        message: '同步完成',
        lastSync: config.lastSync
      };
    } catch (error) {
      await fs.remove(tempDir);
      throw new Error(`拉取更新失败: ${error.message}`);
    } finally {
      await cleanup();
    }
  }

  /**
   * 推送本地更改
   * @param {string} message - 提交信息
   * @returns {Promise<Object>}
   */
  async push(message) {
    const config = await this.readConfig();

    if (!config.repo) {
      throw new Error('未配置团队仓库，请先运行: bailu sync init <repo-url>');
    }

    const tempDir = path.join(os.tmpdir(), 'bailu-sync-push');

    const creds = await getCredentials();
    const { scriptPath, cleanup } = await createAskPassScript(creds.username, creds.password);
    const gitEnv = buildGitEnv(scriptPath);

    try {
      await fs.remove(tempDir);

      execSync(
        `git clone --branch ${config.branch} "${config.repo}" "${tempDir}"`,
        {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
          env: gitEnv
        }
      );

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

      // 提交并推送（push 本身也需要凭据）
      execSync(
        `git -C "${tempDir}" add -A && git -C "${tempDir}" commit -m "${message || 'Update workflows'}" && git -C "${tempDir}" push`,
        {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
          env: gitEnv,
          shell: true
        }
      );

      await fs.remove(tempDir);

      return {
        success: true,
        message: '推送成功'
      };
    } catch (error) {
      await fs.remove(tempDir);
      throw new Error(`推送失败: ${error.message}`);
    } finally {
      await cleanup();
    }
  }

  /**
   * 对比本地和远程差异
   * @returns {Promise<Object>}
   */
  async diff() {
    const config = await this.readConfig();

    if (!config.repo) {
      throw new Error('未配置团队仓库');
    }

    const localWorkflows = await this.getLocalWorkflows();
    const tempDir = path.join(os.tmpdir(), 'bailu-sync-diff');

    const creds = await getCredentials();
    const { scriptPath, cleanup } = await createAskPassScript(creds.username, creds.password);

    try {
      await fs.remove(tempDir);

      execSync(
        `git clone --depth 1 --branch ${config.branch} "${config.repo}" "${tempDir}"`,
        {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
          env: buildGitEnv(scriptPath)
        }
      );

      const remoteWorkflowsDir = path.join(tempDir, 'workflows');
      const remoteWorkflows = {};

      if (await fs.pathExists(remoteWorkflowsDir)) {
        const dirs = await fs.readdir(remoteWorkflowsDir);
        for (const dir of dirs) {
          const manifestPath = path.join(remoteWorkflowsDir, dir, 'manifest.json');
          if (await fs.pathExists(manifestPath)) {
            remoteWorkflows[dir] = await fs.readJson(manifestPath);
          }
        }
      }

      await fs.remove(tempDir);

      // 对比差异
      const diff = {
        added: [],
        removed: [],
        modified: [],
        upToDate: []
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
    } finally {
      await cleanup();
    }
  }

  /**
   * 获取本地工作流
   * @returns {Promise<Object>}
   */
  async getLocalWorkflows() {
    const workflows = {};

    if (await fs.pathExists(this.workflowsDir)) {
      const dirs = await fs.readdir(this.workflowsDir);

      for (const dir of dirs) {
        const manifestPath = path.join(this.workflowsDir, dir, 'manifest.json');
        if (await fs.pathExists(manifestPath)) {
          workflows[dir] = await fs.readJson(manifestPath);
        }
      }
    }

    return workflows;
  }

  /**
   * 获取同步状态
   * @returns {Promise<Object>}
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
