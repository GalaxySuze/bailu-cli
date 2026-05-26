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
const CLAUDE_HOME = path.join(os.homedir(), '.claude');

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
   * 卸载工作流
   */
  router.post('/workflows/:name/uninstall', async (req, res) => {
    try {
      const { name } = req.params;
      const result = await uninstallWorkflow(name);
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
   * 获取系统信息
   */
  router.get('/system', async (req, res) => {
    try {
      const system = {
        version: getVersion(),
        platform: os.platform(),
        nodeVersion: process.version,
        bailuHome: BAILU_HOME,
        claudeHome: CLAUDE_HOME,
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
   * 获取同步状态
   */
  router.get('/sync/status', async (req, res) => {
    try {
      const SyncManager = require('../../sync/manager');
      const manager = new SyncManager();
      const status = await manager.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/sync/pull
   * 拉取更新
   */
  router.post('/sync/pull', async (req, res) => {
    try {
      const SyncManager = require('../../sync/manager');
      const manager = new SyncManager();
      const result = await manager.pull();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/sync/push
   * 推送更改
   */
  router.post('/sync/push', async (req, res) => {
    try {
      const { message } = req.body;
      const SyncManager = require('../../sync/manager');
      const manager = new SyncManager();
      const result = await manager.push(message);
      res.json(result);
    } catch (error) {
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
   * 获取远程仓库配置
   */
  router.get('/git/remote-config', async (req, res) => {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      // 获取当前工作目录
      const cwd = process.cwd();
      
      // 执行git remote命令获取远程仓库地址
      const { stdout } = await execPromise('git remote get-url origin', { cwd });
      
      res.json({
        success: true,
        remoteUrl: stdout.trim()
      });
    } catch (error) {
      res.json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/git/remote-config
   * 设置远程仓库配置
   */
  router.post('/git/remote-config', async (req, res) => {
    try {
      const { remoteUrl } = req.body;
      
      if (!remoteUrl) {
        return res.status(400).json({ error: '远程仓库地址不能为空' });
      }
      
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      // 获取当前工作目录
      const cwd = process.cwd();
      
      // 检查是否已经存在origin远程仓库
      try {
        await execPromise('git remote get-url origin', { cwd });
        // 如果存在，则更新
        await execPromise(`git remote set-url origin ${remoteUrl}`, { cwd });
      } catch (e) {
        // 如果不存在，则添加
        await execPromise(`git remote add origin ${remoteUrl}`, { cwd });
      }
      
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
 */
async function installWorkflow(name, agent) {
  const { execSync } = require('child_process');
  
  try {
    // 使用 node 直接执行脚本，避免 bailu 命令找不到的问题
    const bailuScript = path.join(__dirname, '../../../bin/bailu.js');
    const nodePath = process.execPath;
    
    const output = execSync(`${nodePath} ${bailuScript} install ${name} --agent ${agent}`, {
      encoding: 'utf8',
      cwd: process.cwd(),
      env: { ...process.env, BAILU_DEV: 'true' }
    });
    
    return {
      success: true,
      output
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 卸载工作流
 */
async function uninstallWorkflow(name) {
  const { execSync } = require('child_process');
  
  try {
    // 使用 node 直接执行脚本，避免 bailu 命令找不到的问题
    const bailuScript = path.join(__dirname, '../../../bin/bailu.js');
    const nodePath = process.execPath;
    
    const output = execSync(`${nodePath} ${bailuScript} uninstall ${name} --clean`, {
      encoding: 'utf8',
      cwd: process.cwd(),
      env: { ...process.env, BAILU_DEV: 'true' }
    });
    
    return {
      success: true,
      output
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 获取已安装组件
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
  
  // Skills
  const skillsDir = path.join(CLAUDE_HOME, 'skills');
  if (await fs.pathExists(skillsDir)) {
    const items = await fs.readdir(skillsDir);
    components.skills = items.filter(f => !f.startsWith('.'));
  }
  
  // Commands
  const commandsDir = path.join(CLAUDE_HOME, 'commands');
  if (await fs.pathExists(commandsDir)) {
    components.commands = (await fs.readdir(commandsDir)).filter(f => f.endsWith('.md'));
  }
  
  // Agents
  const agentsDir = path.join(CLAUDE_HOME, 'agents');
  if (await fs.pathExists(agentsDir)) {
    components.agents = (await fs.readdir(agentsDir)).filter(f => f.endsWith('.md'));
  }
  
  // Hooks
  const hooksDir = path.join(CLAUDE_HOME, 'hooks');
  if (await fs.pathExists(hooksDir)) {
    components.hooks = (await fs.readdir(hooksDir)).filter(f => f.endsWith('.sh') || f.endsWith('.py'));
  }
  
  // Rules - 读取子目录
  const rulesDir = path.join(CLAUDE_HOME, 'rules');
  if (await fs.pathExists(rulesDir)) {
    const items = await fs.readdir(rulesDir);
    for (const item of items) {
      const itemPath = path.join(rulesDir, item);
      const stat = await fs.stat(itemPath);
      if (stat.isDirectory()) {
        // 如果是目录，读取目录下的文件
        const files = await fs.readdir(itemPath);
        components.rules.push(...files.filter(f => f.endsWith('.md')).map(f => `${item}/${f}`));
      } else if (item.endsWith('.md')) {
        components.rules.push(item);
      }
    }
  }
  
  // MCP Servers
  try {
    const settingsPath = path.join(CLAUDE_HOME, 'settings.json');
    if (await fs.pathExists(settingsPath)) {
      const settings = await fs.readJson(settingsPath);
      components.mcp = Object.keys(settings.mcpServers || {});
    }
  } catch (e) {}
  
  return components;
}

/**
 * 获取特定类型的组件
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
  
  const dirPath = path.join(CLAUDE_HOME, dirName);
  if (await fs.pathExists(dirPath)) {
    const files = await fs.readdir(dirPath);
    const components = [];
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.stat(filePath);
      
      components.push({
        name: file.replace(/\.md$|\.sh$/, ''),
        file,
        size: stat.size,
        modified: stat.mtime
      });
    }
    
    return components;
  }
  
  return [];
}

/**
 * 获取 AI 工具状态
 */
async function getToolsStatus() {
  const tools = {
    claude: {
      name: 'Claude Code',
      icon: '🤖',
      installed: false,
      configDir: CLAUDE_HOME,
      components: { skills: 0, commands: 0, agents: 0, hooks: 0, rules: 0, mcp: 0 }
    },
    hanako: {
      name: 'Hanako',
      icon: '🌸',
      installed: false,
      configDir: path.join(os.homedir(), '.hanako'),
      components: { skills: 0, commands: 0, agents: 0, hooks: 0, rules: 0, mcp: 0 }
    },
    codex: {
      name: 'Codex',
      icon: '🔮',
      installed: false,
      configDir: path.join(os.homedir(), '.codex'),
      components: { skills: 0, commands: 0, agents: 0, hooks: 0, rules: 0, mcp: 0 }
    }
  };
  
  for (const [key, tool] of Object.entries(tools)) {
    tool.installed = await fs.pathExists(tool.configDir);
    
    if (tool.installed) {
      // 统计组件
      for (const type of ['skills', 'commands', 'agents', 'hooks']) {
        const dirPath = path.join(tool.configDir, type);
        if (await fs.pathExists(dirPath)) {
          tool.components[type] = (await fs.readdir(dirPath)).length;
        }
      }
      
      // 统计 rules
      const rulesDir = path.join(tool.configDir, 'rules');
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
        tool.components.rules = rulesCount;
      }
      
      // 统计 MCP servers
      try {
        const settingsPath = path.join(tool.configDir, 'settings.json');
        if (await fs.pathExists(settingsPath)) {
          const settings = await fs.readJson(settingsPath);
          tool.components.mcp = Object.keys(settings.mcpServers || {}).length;
        }
      } catch (e) {}
    }
  }
  
  return tools;
}

/**
 * 获取版本号
 */
function getVersion() {
  try {
    const packagePath = path.join(__dirname, '../../../../package.json');
    const packageJson = require(packagePath);
    return packageJson.version;
  } catch {
    return '1.0.0';
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

module.exports = { createServer };
