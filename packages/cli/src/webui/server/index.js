/**
 * WebUI 服务器
 * 
 * 提供白鹿工作流管理界面的后端 API
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs-extra');
const os = require('os');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

/**
 * 创建 WebUI 服务器
 * @param {Object} options - 配置选项
 * @param {number} options.port - 端口号
 * @returns {Object} Express 应用实例
 */
function createServer(options = {}) {
  const app = express();
  
  // 中间件
  app.use(cors());
  app.use(express.json());
  
  // 前端文件目录
  const clientPath = path.join(__dirname, '../client');
  
  // 静态文件
  app.use(express.static(clientPath));

  // API 路由（必须在 catch-all 之前）
  app.use('/api', createApiRouter());

  // 前端路由回退（只匹配非 API 路径）
  app.use((req, res, next) => {
    // 跳过 API 请求
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    const indexPath = path.join(clientPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: 'Frontend not found' });
    }
  });

  return app;
}

/**
 * 创建 API 路由
 * @returns {Object} Express Router
 */
function createApiRouter() {
  const router = express.Router();

  // ==================== 工作流相关 ====================

  /**
   * GET /api/workflows
   * 获取所有工作流（已安装 + 可用）
   */
  router.get('/workflows', async (req, res) => {
    try {
      const installed = await getInstalledWorkflows();
      const available = await getAvailableWorkflows();
      
      res.json({
        installed,
        available
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/workflows/:name
   * 获取工作流详情
   */
  router.get('/workflows/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const workflow = await getWorkflowDetail(name);
      
      if (!workflow) {
        return res.status(404).json({ error: `Workflow not found: ${name}` });
      }
      
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/workflows/:name/install
   * 安装工作流
   */
  router.post('/workflows/:name/install', async (req, res) => {
    try {
      const { name } = req.params;
      const { agent = 'claude' } = req.body;
      
      const result = await installWorkflow(name, agent);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/workflows/:name/uninstall
   * 卸载工作流（支持按工具卸载）
   * Body: { tool?: string } — 指定只从某个工具卸载，不传则从所有工具卸载
   */
  router.post('/workflows/:name/uninstall', async (req, res) => {
    try {
      const { name } = req.params;
      const { tool } = req.body || {};
      const result = await uninstallWorkflow(name, tool);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== 发布配置 ====================

  /**
   * GET /api/publish/config
   * 获取发布配置
   */
  router.get('/publish/config', async (req, res) => {
    try {
      const publishConfigPath = path.join(BAILU_HOME, 'publish.json');
      
      if (await fs.pathExists(publishConfigPath)) {
        const config = await fs.readJson(publishConfigPath);
        res.json({ success: true, config });
      } else {
        res.json({ success: true, config: { packages: {} } });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/publish/config
   * 更新发布配置
   */
  router.post('/publish/config', async (req, res) => {
    try {
      const { packageName, publish } = req.body;
      
      if (!packageName) {
        return res.status(400).json({ error: '包名不能为空' });
      }
      
      const publishConfigPath = path.join(BAILU_HOME, 'publish.json');
      let config = {};
      
      if (await fs.pathExists(publishConfigPath)) {
        config = await fs.readJson(publishConfigPath);
      }
      
      // 确保 packages 对象存在
      if (!config.packages) {
        config.packages = {};
      }
      
      // 更新指定包的发布状态
      if (!config.packages[packageName]) {
        config.packages[packageName] = {};
      }
      config.packages[packageName].publish = publish;
      
      // 写入配置文件
      await fs.writeJson(publishConfigPath, config, { spaces: 2 });
      
      res.json({ success: true, message: '发布配置已更新' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ROI 配置 ====================

  /**
   * GET /api/roi/config
   * 获取 ROI 配置
   */
  router.get('/roi/config', async (req, res) => {
    try {
      const config = await getRoiConfig();
      res.json({ success: true, config });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/roi/config
   * 保存 ROI 配置
   */
  router.post('/roi/config', async (req, res) => {
    try {
      const { config } = req.body;

      if (!config || typeof config !== 'object') {
        return res.status(400).json({ error: '配置数据不能为空' });
      }

      await saveRoiConfig(config);
      res.json({ success: true, message: 'ROI 配置已保存' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/roi/config/reset
   * 重置 ROI 配置为默认值
   */
  router.post('/roi/config/reset', async (req, res) => {
    try {
      const defaultConfig = getDefaultRoiConfig();
      await saveRoiConfig(defaultConfig);
      res.json({ success: true, config: defaultConfig, message: 'ROI 配置已重置为默认值' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== 组件相关 ====================

  /**
   * GET /api/components
   * 获取已安装组件
   */
  router.get('/components', async (req, res) => {
    try {
      const components = await getInstalledComponents();
      res.json(components);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/components/:type
   * 获取特定类型的组件
   */
  router.get('/components/:type', async (req, res) => {
    try {
      const { type } = req.params;
      const components = await getComponentsByType(type);
      res.json(components);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== 工具状态 ====================

  /**
   * GET /api/tools
   * 获取 AI 工具状态
   */
  router.get('/tools', async (req, res) => {
    try {
      const tools = await getToolsStatus();
      res.json(tools);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== 系统信息 ====================

  /**
   * GET /api/system
   * 获取系统信息，包含已安装工具的配置目录列表
   */
  router.get('/system', async (req, res) => {
    try {
      const { getAllTools, getInstalledToolKeys } = require('../../config/tools');
      const allToolsConfig = getAllTools();
      const installedToolKeys = getInstalledToolKeys();

      // 构建配置目录列表，白鹿目录始终包含
      const configDirs = [
        { path: BAILU_HOME, name: '白鹿配置目录', key: 'bailu' }
      ];

      // 动态添加已安装工具的配置目录
      for (const key of installedToolKeys) {
        configDirs.push({
          path: allToolsConfig[key].getUserDir(os.homedir()),
          name: allToolsConfig[key].name + ' 配置目录',
          key
        });
      }

      const system = {
        version: getVersion(),
        platform: os.platform(),
        nodeVersion: process.version,
        bailuHome: BAILU_HOME,
        configDirs,
        uptime: process.uptime()
      };
      res.json(system);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/system/version-check
   * 检查版本更新
   */
  router.get('/system/version-check', async (req, res) => {
    try {
      const currentVersion = getVersion();
      // 这里可以添加从远程仓库检查版本的逻辑
      // 暂时返回无更新
      res.json({
        currentVersion,
        hasUpdate: false,
        latestVersion: currentVersion
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/system/latest-version
   * 从GitHub获取最新版本
   */
  router.get('/system/latest-version', async (req, res) => {
    try {
      const latestVersion = await getLatestVersionFromGitHub();
      
      res.json({
        success: true,
        latestVersion: latestVersion || getVersion()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/stats
   * 获取统计信息
   */
  router.get('/stats', async (req, res) => {
    try {
      const stats = await getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== 安全审计 ====================

  /**
   * GET /api/audit
   * 执行安全审计
   */
  router.get('/audit', async (req, res) => {
    try {
      const AuditManager = require('../../audit/manager');
      const manager = new AuditManager();
      const result = await manager.audit();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== 同步管理 ====================

  /**
   * GET /api/sync/status
   * 获取同步状态，包含版本更新信息
   */
  router.get('/sync/status', async (req, res) => {
    try {
      const SyncManager = require('../../sync/manager');
      const manager = new SyncManager();
      const status = await manager.getStatus();

      // 检查是否有 npm 版本更新
      const currentVersion = getVersion();
      const latestVersion = await getLatestVersionFromGitHub();
      const hasNpmUpdate = latestVersion && latestVersion !== currentVersion;

      res.json({
        ...status,
        hasUpdates: hasNpmUpdate,
        hasNpmUpdate,
        currentVersion,
        latestVersion: latestVersion || currentVersion
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/sync/pull
   * 拉取更新
   */
  router.post('/sync/pull', async (req, res) => {
    const startTime = Date.now();
    console.log(`\n${chalk.cyan('[WebUI]')} ${chalk.bold('拉取工作流更新...')} ${new Date().toLocaleString()}`);
    try {
      const SyncManager = require('../../sync/manager');
      const manager = new SyncManager();
      const result = await manager.pull();
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`${chalk.cyan('[WebUI]')} ${chalk.green('✓')} 拉取完成 (${elapsed}s)`);
      res.json(result);
    } catch (error) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`${chalk.cyan('[WebUI]')} ${chalk.red('✗')} 拉取失败 (${elapsed}s): ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/sync/push
   * 推送更改
   */
  router.post('/sync/push', async (req, res) => {
    const startTime = Date.now();
    const { message } = req.body;
    console.log(`\n${chalk.cyan('[WebUI]')} ${chalk.bold('推送工作流更改...')} ${new Date().toLocaleString()}`);
    console.log(`${chalk.cyan('[WebUI]')} 消息: ${message || '(无)'}`);
    try {
      const SyncManager = require('../../sync/manager');
      const manager = new SyncManager();
      const result = await manager.push(message);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`${chalk.cyan('[WebUI]')} ${chalk.green('✓')} 推送完成 (${elapsed}s)`);
      res.json(result);
    } catch (error) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`${chalk.cyan('[WebUI]')} ${chalk.red('✗')} 推送失败 (${elapsed}s): ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== Git 管理 ====================

  /**
   * GET /api/git/latest-commit
   * 获取最新git提交信息
   */
  router.get('/git/latest-commit', async (req, res) => {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      // 获取当前工作目录
      const cwd = process.cwd();
      
      // 执行git log命令获取最新提交
      const { stdout } = await execPromise('git log -1 --pretty=format:"%H|%an|%ai|%s"', { cwd });
      
      if (stdout.trim()) {
        const [hash, author, date, message] = stdout.trim().split('|');
        res.json({
          success: true,
          commit: {
            hash,
            author,
            date,
            message
          }
        });
      } else {
        res.json({
          success: true,
          commit: null
        });
      }
    } catch (error) {
      res.json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/git/remote-config
   * 从 ~/.bailu/sync.json 获取远程仓库配置
   */
  router.get('/git/remote-config', async (req, res) => {
    try {
      const syncConfigPath = path.join(BAILU_HOME, 'sync.json');
      if (await fs.pathExists(syncConfigPath)) {
        const config = await fs.readJson(syncConfigPath);
        res.json({
          success: true,
          remoteUrl: config.repo || ''
        });
      } else {
        res.json({
          success: true,
          remoteUrl: ''
        });
      }
    } catch (error) {
      res.json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/git/remote-config
   * 将远程仓库配置写入 ~/.bailu/sync.json
   */
  router.post('/git/remote-config', async (req, res) => {
    try {
      const { remoteUrl } = req.body;

      if (!remoteUrl) {
        return res.status(400).json({ error: '远程仓库地址不能为空' });
      }

      const syncConfigPath = path.join(BAILU_HOME, 'sync.json');
      let config = {};

      if (await fs.pathExists(syncConfigPath)) {
        config = await fs.readJson(syncConfigPath);
      }

      config.repo = remoteUrl;

      await fs.ensureDir(BAILU_HOME);
      await fs.writeJson(syncConfigPath, config, { spaces: 2 });

      res.json({
        success: true,
        message: '远程仓库配置已更新'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== 推荐工具 ====================

  /**
   * GET /api/recommend
   * 获取推荐工具列表（内置精选 + 社区推荐）
   */
  router.get('/recommend', async (req, res) => {
    try {
      const builtinPath = path.join(__dirname, '../../data/recommended-tools.json');
      const communityPath = path.join(BAILU_HOME, 'community-tools.json');

      let builtin = [];
      let community = [];

      try {
        if (await fs.pathExists(builtinPath)) {
          builtin = await fs.readJson(builtinPath);
        }
      } catch (e) {}

      try {
        if (await fs.pathExists(communityPath)) {
          community = await fs.readJson(communityPath);
        }
      } catch (e) {}

      res.json({ builtin, community });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/recommend
   * 提交工具推荐（写入 ~/.bailu/community-tools.json）
   */
  router.post('/recommend', async (req, res) => {
    try {
      const { name, type, audience, download, docs, description, tags } = req.body;

      if (!name || !type || !download || !description) {
        return res.status(400).json({ error: '缺少必填字段：name, type, download, description' });
      }

      const communityPath = path.join(BAILU_HOME, 'community-tools.json');
      let community = [];

      if (await fs.pathExists(communityPath)) {
        community = await fs.readJson(communityPath);
      }

      // 检查是否已存在
      const exists = community.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (exists) {
        return res.status(409).json({ error: `工具 "${name}" 已在推荐列表中` });
      }

      const tool = {
        name: name.trim(),
        type: type.trim(),
        audience: (audience || '开发者').trim(),
        download: download.trim(),
        docs: (docs || download).trim(),
        description: description.trim(),
        tags: Array.isArray(tags) ? tags : (tags || '').split(',').map(t => t.trim()).filter(Boolean),
        submitted_at: new Date().toISOString(),
        source: 'community'
      };

      community.push(tool);
      await fs.ensureDir(BAILU_HOME);
      await fs.writeJson(communityPath, community, { spaces: 2 });

      res.json({ success: true, tool });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== 项目管理 ====================

  /**
   * GET /api/projects
   * 获取项目列表
   */
  router.get('/projects', async (req, res) => {
    try {
      const projects = await getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/projects
   * 添加项目
   */
  router.post('/projects', async (req, res) => {
    try {
      const { name, path: projectPath } = req.body;
      
      if (!name || !projectPath) {
        return res.status(400).json({ error: '项目名称和路径不能为空' });
      }
      
      // 检查路径是否存在
      if (!await fs.pathExists(projectPath)) {
        return res.status(400).json({ error: '项目路径不存在' });
      }
      
      const project = await addProject(name, projectPath);
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * PUT /api/projects/:id
   * 更新项目
   */
  router.put('/projects/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, path: projectPath } = req.body;
      
      const project = await updateProject(id, { name, path: projectPath });
      
      if (!project) {
        return res.status(404).json({ error: '项目不存在' });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/projects/:id
   * 删除项目
   */
  router.delete('/projects/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await deleteProject(id);
      
      if (!result) {
        return res.status(404).json({ error: '项目不存在' });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/projects/:id/activate
   * 切换当前项目
   */
  router.post('/projects/:id/activate', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await activateProject(id);
      
      if (!result) {
        return res.status(404).json({ error: '项目不存在' });
      }
      
      res.json({ success: true, current: id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/projects/:id/rules
   * 获取项目的 Rules 列表
   */
  router.get('/projects/:id/rules', async (req, res) => {
    try {
      const { id } = req.params;
      const rules = await getProjectRules(id);
      
      if (!rules) {
        return res.status(404).json({ error: '项目不存在' });
      }
      
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== 通知管理 ====================

  /**
   * GET /api/notifications
   * 获取所有待通知（版本更新、工作流同步等）
   */
  router.get('/notifications', async (req, res) => {
    try {
      const notifications = [];

      // 检查 npm 版本更新
      const currentVersion = getVersion();
      const latestVersion = await getLatestVersionFromGitHub();
      if (latestVersion && latestVersion !== currentVersion) {
        notifications.push({
          type: 'version',
          title: '版本更新',
          message: `bailu-cli 有新版本 ${latestVersion}（当前 ${currentVersion}）`,
          severity: 'info'
        });
      }

      // 检查远程仓库是否有更新
      try {
        const SyncManager = require('../../sync/manager');
        const manager = new SyncManager();
        const status = await manager.getStatus();
        if (status.configured) {
          // 尝试获取远程差异
          const diff = await manager.diff();
          if (diff.modified.length > 0 || diff.removed.length > 0) {
            notifications.push({
              type: 'sync',
              title: '工作流更新',
              message: `远程仓库有 ${diff.modified.length + diff.removed.length} 个工作流变更`,
              severity: 'info'
            });
          }
        }
      } catch (e) {
        // 同步检查失败，静默跳过
      }

      res.json({ notifications, hasUpdates: notifications.length > 0 });
    } catch (error) {
      res.json({ notifications: [], hasUpdates: false });
    }
  });

  return router;
}

// ==================== 数据获取函数 ====================

/**
 * 获取已安装工作流
 */
async function getInstalledWorkflows() {
  const installedPath = path.join(BAILU_HOME, 'installed.json');
  
  if (await fs.pathExists(installedPath)) {
    const data = await fs.readJson(installedPath);
    return data.workflows || {};
  }
  
  return {};
}

/**
 * 获取可用工作流
 */
async function getAvailableWorkflows() {
  // 从 GitHub 仓库获取
  const workflowsDir = path.join(os.homedir(), 'Code', 'GitHub', 'bailu-workflows', 'workflows');
  const workflows = {};
  
  if (await fs.pathExists(workflowsDir)) {
    const dirs = await fs.readdir(workflowsDir);
    
    for (const dir of dirs) {
      const manifestPath = path.join(workflowsDir, dir, 'manifest.json');
      if (await fs.pathExists(manifestPath)) {
        const manifest = await fs.readJson(manifestPath);
        workflows[dir] = {
          name: manifest.name,
          displayName: manifest.displayName,
          description: manifest.description,
          version: manifest.version,
          components: manifest.components
        };
      }
    }
  }
  
  return workflows;
}

/**
 * 获取工作流详情
 */
async function getWorkflowDetail(name) {
  // 先检查已安装
  const installed = await getInstalledWorkflows();
  if (installed[name]) {
    return {
      ...installed[name],
      name,
      status: 'installed'
    };
  }
  
  // 再检查可用
  const workflowsDir = path.join(os.homedir(), 'Code', 'GitHub', 'bailu-workflows', 'workflows');
  const manifestPath = path.join(workflowsDir, name, 'manifest.json');
  
  if (await fs.pathExists(manifestPath)) {
    const manifest = await fs.readJson(manifestPath);
    return {
      ...manifest,
      status: 'available'
    };
  }
  
  return null;
}

/**
 * 安装工作流
 *
 * 使用 spawn 流式执行 bailu install，实时透传子进程的 stdout/stderr
 * 到 serve 控制台，便于用户查看详细安装日志。
 *
 * @param {string} name - 工作流名称
 * @param {string} agent - 目标 AI 工具标识
 * @returns {Promise<{success: boolean, output?: string, error?: string, exitCode: number}>}
 */
async function installWorkflow(name, agent) {
  const { spawn } = require('child_process');

  return new Promise((resolve) => {
    const bailuScript = path.join(__dirname, '../../../bin/bailu.js');
    const nodePath = process.execPath;
    const startTs = Date.now();

    // serve 端打印请求头，便于关联请求与子进程日志
    console.log('');
    console.log('\x1b[36m' + '═'.repeat(72) + '\x1b[0m');
    console.log(`\x1b[36m[WebUI] 安装请求 → workflow=${name}, agent=${agent}, at=${new Date().toLocaleTimeString()}\x1b[0m`);
    console.log('\x1b[36m' + '═'.repeat(72) + '\x1b[0m');

    const child = spawn(nodePath, [bailuScript, 'install', name, '--to', agent], {
      cwd: process.cwd(),
      env: { ...process.env, BAILU_DEV: 'true', FORCE_COLOR: '1' }
    });

    let stdout = '';
    let stderr = '';

    // 实时透传 stdout
    child.stdout.on('data', (chunk) => {
      const str = chunk.toString();
      stdout += str;
      process.stdout.write(str);
    });

    // 实时透传 stderr
    child.stderr.on('data', (chunk) => {
      const str = chunk.toString();
      stderr += str;
      process.stderr.write(str);
    });

    child.on('close', (code) => {
      const elapsed = ((Date.now() - startTs) / 1000).toFixed(2);
      const success = code === 0;

      console.log('');
      if (success) {
        console.log(`\x1b[32m[WebUI] ✔ 安装完成 (exit=${code}, 耗时 ${elapsed}s)\x1b[0m`);
      } else {
        console.log(`\x1b[31m[WebUI] ✖ 安装失败 (exit=${code}, 耗时 ${elapsed}s)\x1b[0m`);
      }
      console.log('\x1b[36m' + '═'.repeat(72) + '\x1b[0m');
      console.log('');

      resolve({
        success,
        exitCode: code,
        output: stdout,
        error: success ? undefined : (stderr || stdout || `进程退出码: ${code}`)
      });
    });

    child.on('error', (error) => {
      console.error(`\x1b[31m[WebUI] ✖ 子进程启动失败: ${error.message}\x1b[0m`);
      resolve({
        success: false,
        exitCode: -1,
        error: `子进程启动失败: ${error.message}`
      });
    });
  });
}

/**
 * 卸载工作流
 */
/**
 * 卸载工作流（支持按工具卸载）
 * @param {string} name - 工作流名称
 * @param {string} [toolKey] - 指定只从某个工具卸载，不传则从所有工具卸载
 * @returns {Promise<{success: boolean, error?: string, message?: string}>}
 */
async function uninstallWorkflow(name, toolKey) {
  try {
    const { getInstaller } = require('../../commands/install');
    const installedPath = path.join(BAILU_HOME, 'installed.json');

    // 读取安装记录
    if (!await fs.pathExists(installedPath)) {
      return { success: false, error: '未找到安装记录' };
    }

    const installed = await fs.readJson(installedPath);
    const installInfo = installed.workflows[name];

    if (!installInfo) {
      return { success: false, error: `工作流 "${name}" 未安装` };
    }

    // 构造 manifest
    const manifest = {
      name,
      version: installInfo.version,
      displayName: installInfo.displayName,
      components: installInfo.components || {}
    };

    // 确定要从哪些工具卸载
    const allAgents = installInfo.target_agents ||
      (installInfo.target_agent ? [installInfo.target_agent] : []);
    const agentsToUninstall = toolKey ? [toolKey] : allAgents;

    let uninstalledFrom = [];
    let errors = [];

    for (const agent of agentsToUninstall) {
      try {
        const installer = getInstaller(agent);
        await installer.uninstallWorkflow(manifest);
        uninstalledFrom.push(agent);
      } catch (error) {
        errors.push(`${agent}: ${error.message}`);
      }
    }

    if (uninstalledFrom.length === 0) {
      return { success: false, error: `卸载失败: ${errors.join('; ')}` };
    }

    // 更新 installed.json
    const remainingAgents = allAgents.filter(a => !uninstalledFrom.includes(a));

    if (remainingAgents.length === 0) {
      // 所有工具都卸载了，删除整条记录
      delete installed.workflows[name];
    } else {
      // 只更新 target_agents，保留记录
      installed.workflows[name].target_agents = remainingAgents;
    }

    await fs.writeJson(installedPath, installed, { spaces: 2 });

    return {
      success: true,
      message: `已从 ${uninstalledFrom.join(', ')} 卸载工作流 "${name}"`,
      uninstalledFrom,
      remainingAgents
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 获取已安装组件
 * 动态扫描所有已安装工具的配置目录，聚合组件列表
 */
async function getInstalledComponents() {
  const components = {
    skills: [],
    commands: [],
    agents: [],
    hooks: [],
    rules: [],
    mcp: []
  };

  const { getAllTools, getInstalledToolKeys } = require('../../config/tools');
  const allToolsConfig = getAllTools();
  const installedToolKeys = getInstalledToolKeys();

  for (const key of installedToolKeys) {
    const configDir = allToolsConfig[key].getUserDir(os.homedir());

    // Skills
    const skillsDir = path.join(configDir, 'skills');
    if (await fs.pathExists(skillsDir)) {
      const items = await fs.readdir(skillsDir);
      components.skills.push(...items.filter(f => !f.startsWith('.')).map(f => `${key}/${f}`));
    }

    // Commands
    const commandsDir = path.join(configDir, 'commands');
    if (await fs.pathExists(commandsDir)) {
      components.commands.push(...(await fs.readdir(commandsDir)).filter(f => f.endsWith('.md')).map(f => `${key}/${f}`));
    }

    // Agents
    const agentsDir = path.join(configDir, 'agents');
    if (await fs.pathExists(agentsDir)) {
      components.agents.push(...(await fs.readdir(agentsDir)).filter(f => f.endsWith('.md')).map(f => `${key}/${f}`));
    }

    // Hooks
    const hooksDir = path.join(configDir, 'hooks');
    if (await fs.pathExists(hooksDir)) {
      components.hooks.push(...(await fs.readdir(hooksDir)).filter(f => f.endsWith('.sh') || f.endsWith('.py')).map(f => `${key}/${f}`));
    }

    // Rules - 读取子目录
    const rulesDir = path.join(configDir, 'rules');
    if (await fs.pathExists(rulesDir)) {
      const items = await fs.readdir(rulesDir);
      for (const item of items) {
        const itemPath = path.join(rulesDir, item);
        const stat = await fs.stat(itemPath);
        if (stat.isDirectory()) {
          const files = await fs.readdir(itemPath);
          components.rules.push(...files.filter(f => f.endsWith('.md')).map(f => `${key}/${item}/${f}`));
        } else if (item.endsWith('.md')) {
          components.rules.push(`${key}/${item}`);
        }
      }
    }

    // MCP Servers
    try {
      // Qoder 使用 ~/.qoder.json
      if (key === 'qoder') {
        const qoderJsonPath = path.join(os.homedir(), '.qoder.json');
        if (await fs.pathExists(qoderJsonPath)) {
          const qoderConfig = await fs.readJson(qoderJsonPath);
          components.mcp.push(...Object.keys(qoderConfig.mcpServers || {}).map(s => `${key}/${s}`));
        }
      } else {
        const settingsPath = path.join(configDir, 'settings.json');
        if (await fs.pathExists(settingsPath)) {
          const settings = await fs.readJson(settingsPath);
          components.mcp.push(...Object.keys(settings.mcpServers || {}).map(s => `${key}/${s}`));
        }
      }
    } catch (e) {
      // MCP 配置读取失败，静默跳过
    }
  }

  return components;
}

/**
 * 获取特定类型的组件
 * 动态扫描所有已安装工具的配置目录
 * @param {string} type - 组件类型（skills, commands, agents, hooks）
 * @returns {Promise<Array>} 组件列表
 */
async function getComponentsByType(type) {
  const dirMap = {
    skills: 'skills',
    commands: 'commands',
    agents: 'agents',
    hooks: 'hooks'
  };

  const dirName = dirMap[type];
  if (!dirName) {
    return [];
  }

  const { getAllTools, getInstalledToolKeys } = require('../../config/tools');
  const allToolsConfig = getAllTools();
  const installedToolKeys = getInstalledToolKeys();
  const allComponents = [];

  for (const key of installedToolKeys) {
    const configDir = allToolsConfig[key].getUserDir(os.homedir());
    const dirPath = path.join(configDir, dirName);
    if (await fs.pathExists(dirPath)) {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = await fs.stat(filePath);

        allComponents.push({
          name: file.replace(/\.md$|\.sh$/, ''),
          file,
          tool: key,
          size: stat.size,
          modified: stat.mtime
        });
      }
    }
  }

  return allComponents;
}

/**
 * 获取 AI 工具状态
 * 使用 config/tools.js 中的 TOOLS 配置动态生成工具列表，
 * 并统计每个已安装工具的组件数量
 */
async function getToolsStatus() {
  const { getAllTools, getInstalledToolKeys } = require('../../config/tools');
  const allToolsConfig = getAllTools();
  const tools = {};

  for (const [key, config] of Object.entries(allToolsConfig)) {
    const configDir = config.getUserDir(os.homedir());
    const isInstalled = await fs.pathExists(configDir);

    tools[key] = {
      name: config.name,
      icon: config.emoji,
      installed: isInstalled,
      configDir,
      components: { skills: 0, commands: 0, agents: 0, hooks: 0, rules: 0, mcp: 0 }
    };

    if (isInstalled) {
      // 统计目录型组件：skills, commands, agents, hooks
      for (const type of ['skills', 'commands', 'agents', 'hooks']) {
        const dirPath = path.join(configDir, type);
        if (await fs.pathExists(dirPath)) {
          tools[key].components[type] = (await fs.readdir(dirPath)).filter(f => !f.startsWith('.')).length;
        }
      }

      // 统计 rules（支持子目录结构）
      const rulesDir = path.join(configDir, 'rules');
      if (await fs.pathExists(rulesDir)) {
        const items = await fs.readdir(rulesDir);
        let rulesCount = 0;
        for (const item of items) {
          const itemPath = path.join(rulesDir, item);
          const stat = await fs.stat(itemPath);
          if (stat.isDirectory()) {
            const files = await fs.readdir(itemPath);
            rulesCount += files.filter(f => f.endsWith('.md')).length;
          } else if (item.endsWith('.md')) {
            rulesCount++;
          }
        }
        tools[key].components.rules = rulesCount;
      }

      // 统计 MCP servers（不同工具使用不同的配置文件）
      try {
        // Qoder 使用 ~/.qoder.json（位于用户主目录，而非 .qoder/ 目录内）
        if (key === 'qoder') {
          const qoderJsonPath = path.join(os.homedir(), '.qoder.json');
          if (await fs.pathExists(qoderJsonPath)) {
            const qoderConfig = await fs.readJson(qoderJsonPath);
            tools[key].components.mcp = Object.keys(qoderConfig.mcpServers || {}).length;
          }
        } else {
          const settingsPath = path.join(configDir, 'settings.json');
          if (await fs.pathExists(settingsPath)) {
            const settings = await fs.readJson(settingsPath);
            tools[key].components.mcp = Object.keys(settings.mcpServers || {}).length;
          }
        }
      } catch (e) {
        // MCP 配置读取失败，静默跳过
      }
    }
  }

  return tools;
}

/**
 * 获取版本号
 * __dirname 是 src/webui/server/，向上三级到达 packages/cli/ 目录
 */
function getVersion() {
  try {
    const packagePath = path.join(__dirname, '../../../package.json');
    const packageJson = require(packagePath);
    return packageJson.version;
  } catch {
    return 'unknown';
  }
}

/**
 * 从GitHub获取最新版本号
 */
async function getLatestVersionFromGitHub() {
  try {
    const https = require('https');
    const url = 'https://api.github.com/repos/liliMozi/bailu-cli/releases/latest';
    
    return new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'User-Agent': 'bailu-cli'
        }
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.tag_name) {
              resolve(json.tag_name);
            } else {
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        });
      }).on('error', (err) => {
        resolve(null);
      });
    });
  } catch (error) {
    return null;
  }
}

/**
 * 获取统计信息
 */
async function getStats() {
  const installed = await getInstalledWorkflows();
  const components = await getInstalledComponents();
  const projects = await getProjects();
  
  return {
    workflows: {
      installed: Object.keys(installed).length
    },
    components: {
      skills: components.skills.length,
      commands: components.commands.length,
      agents: components.agents.length,
      hooks: components.hooks.length,
      mcp: components.mcp.length,
      rules: components.rules.length
    },
    projects: {
      total: projects.projects.length,
      current: projects.current
    }
  };
}

// ==================== 项目管理函数 ====================

const PROJECTS_FILE = path.join(BAILU_HOME, 'projects.json');

/**
 * 获取项目列表
 */
async function getProjects() {
  if (await fs.pathExists(PROJECTS_FILE)) {
    return await fs.readJson(PROJECTS_FILE);
  }
  
  // 返回默认结构
  return {
    current: null,
    projects: []
  };
}

/**
 * 保存项目配置
 */
async function saveProjects(data) {
  await fs.ensureDir(BAILU_HOME);
  await fs.writeJson(PROJECTS_FILE, data, { spaces: 2 });
}

/**
 * 添加项目
 */
async function addProject(name, projectPath) {
  const data = await getProjects();
  
  // 生成唯一 ID
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  
  // 检查是否已存在
  const existing = data.projects.find(p => p.path === projectPath);
  if (existing) {
    throw new Error('该项目路径已存在');
  }
  
  // 检查 .claude/rules 目录是否存在
  const rulesDir = path.join(projectPath, '.claude', 'rules');
  const hasRules = await fs.pathExists(rulesDir);
  
  let rulesCount = 0;
  if (hasRules) {
    const files = await fs.readdir(rulesDir);
    rulesCount = files.filter(f => f.endsWith('.md')).length;
  }
  
  const project = {
    id,
    name,
    path: projectPath,
    rules_dir: '.claude/rules',
    has_rules: hasRules,
    rules_count: rulesCount,
    added_at: new Date().toISOString(),
    last_used: null
  };
  
  data.projects.push(project);
  
  // 如果是第一个项目，自动设为当前项目
  if (data.projects.length === 1) {
    data.current = id;
  }
  
  await saveProjects(data);
  
  return project;
}

/**
 * 更新项目
 */
async function updateProject(id, updates) {
  const data = await getProjects();
  const index = data.projects.findIndex(p => p.id === id);
  
  if (index === -1) {
    return null;
  }
  
  // 更新字段
  if (updates.name) {
    data.projects[index].name = updates.name;
  }
  if (updates.path) {
    data.projects[index].path = updates.path;
    
    // 重新检查 rules
    const rulesDir = path.join(updates.path, '.claude', 'rules');
    const hasRules = await fs.pathExists(rulesDir);
    let rulesCount = 0;
    if (hasRules) {
      const files = await fs.readdir(rulesDir);
      rulesCount = files.filter(f => f.endsWith('.md')).length;
    }
    data.projects[index].has_rules = hasRules;
    data.projects[index].rules_count = rulesCount;
  }
  
  await saveProjects(data);
  
  return data.projects[index];
}

/**
 * 删除项目
 */
async function deleteProject(id) {
  const data = await getProjects();
  const index = data.projects.findIndex(p => p.id === id);
  
  if (index === -1) {
    return false;
  }
  
  data.projects.splice(index, 1);
  
  // 如果删除的是当前项目，切换到第一个项目
  if (data.current === id) {
    data.current = data.projects.length > 0 ? data.projects[0].id : null;
  }
  
  await saveProjects(data);
  
  return true;
}

/**
 * 切换当前项目
 */
async function activateProject(id) {
  const data = await getProjects();
  const project = data.projects.find(p => p.id === id);
  
  if (!project) {
    return false;
  }
  
  data.current = id;
  project.last_used = new Date().toISOString();
  
  await saveProjects(data);
  
  return true;
}

/**
 * 获取项目的 Rules 列表
 */
async function getProjectRules(id) {
  const data = await getProjects();
  const project = data.projects.find(p => p.id === id);
  
  if (!project) {
    return null;
  }
  
  const rules = {
    global: [],   // Level 1: 全局通用
    laravel: [],  // Level 2: Laravel 项目级
    project: []   // Level 3: 项目目录级
  };
  
  // Level 1: 全局通用 Rules
  const globalRulesDir = path.join(BAILU_HOME, 'config', 'rules', 'global');
  if (await fs.pathExists(globalRulesDir)) {
    const files = await fs.readdir(globalRulesDir);
    for (const file of files.filter(f => f.endsWith('.md'))) {
      rules.global.push({
        name: file.replace('.md', ''),
        file,
        level: 'global',
        path: path.join(globalRulesDir, file)
      });
    }
  }
  
  // Level 2: Laravel 项目级 Rules
  const laravelRulesDir = path.join(BAILU_HOME, 'config', 'rules', 'laravel');
  if (await fs.pathExists(laravelRulesDir)) {
    const files = await fs.readdir(laravelRulesDir);
    for (const file of files.filter(f => f.endsWith('.md'))) {
      rules.laravel.push({
        name: file.replace('.md', ''),
        file,
        level: 'laravel',
        path: path.join(laravelRulesDir, file)
      });
    }
  }
  
  // Level 3: 项目目录级 Rules
  const projectRulesDir = path.join(project.path, project.rules_dir);
  if (await fs.pathExists(projectRulesDir)) {
    const files = await fs.readdir(projectRulesDir);
    for (const file of files.filter(f => f.endsWith('.md'))) {
      rules.project.push({
        name: file.replace('.md', ''),
        file,
        level: 'project',
        path: path.join(projectRulesDir, file)
      });
    }
  }
  
  return rules;
}

// ==================== ROI 配置函数 ====================

/**
 * ROI 配置文件路径
 */
const ROI_CONFIG_PATH = path.join(BAILU_HOME, 'roi-config.json');

/**
 * 获取默认 ROI 配置
 * 注意：默认时薪使用通用值，用户个人设置存储在本地不随包发布
 */
function getDefaultRoiConfig() {
  return {
    enabled: true,
    hourly_rate: 50,
    track_time_saved: true,
    track_tasks_completed: true,
    track_code_lines: true,
    calculation_method: 'time_saved × hourly_rate',
    daily_budget: 50,
    monthly_budget: 1000,
    model_pricing: {
      'claude-3.5-sonnet': { input: 3.00, output: 15.00 },
      'claude-3-haiku': { input: 0.25, output: 1.25 },
      'claude-3-opus': { input: 15.00, output: 75.00 },
      'gpt-4o': { input: 5.00, output: 15.00 },
      'gpt-4o-mini': { input: 0.15, output: 0.60 }
    }
  };
}

/**
 * 获取 ROI 配置
 * 如果本地配置文件不存在，返回默认配置
 */
async function getRoiConfig() {
  if (await fs.pathExists(ROI_CONFIG_PATH)) {
    const savedConfig = await fs.readJson(ROI_CONFIG_PATH);
    return { ...getDefaultRoiConfig(), ...savedConfig };
  }
  return getDefaultRoiConfig();
}

/**
 * 保存 ROI 配置到本地文件
 * @param {Object} config - 要保存的配置对象
 */
async function saveRoiConfig(config) {
  await fs.ensureDir(BAILU_HOME);
  await fs.writeJson(ROI_CONFIG_PATH, config, { spaces: 2 });
}

module.exports = { createServer };
