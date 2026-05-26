/**
 * 插件管理命令
 * 
 * 管理白鹿工作流插件，将插件安装到 AI 工具中
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const ora = require('ora');
const boxen = require('boxen');
const Table = require('cli-table3');
const { execSync } = require('child_process');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

/**
 * AI 工具目录映射
 */
const AI_TOOLS = {
  hanako: {
    name: 'Hanako',
    skillsDir: path.join(os.homedir(), '.hanako', 'skills'),
    commandsDir: path.join(os.homedir(), '.hanako', 'commands'),
    configDir: path.join(os.homedir(), '.hanako'),
    icon: '🌸'
  },
  claude: {
    name: 'Claude Code',
    skillsDir: path.join(os.homedir(), '.claude', 'skills'),
    commandsDir: path.join(os.homedir(), '.claude', 'commands'),
    configDir: path.join(os.homedir(), '.claude'),
    icon: '🤖'
  },
  codex: {
    name: 'Codex',
    skillsDir: path.join(os.homedir(), '.codex', 'skills'),
    commandsDir: path.join(os.homedir(), '.codex', 'commands'),
    configDir: path.join(os.homedir(), '.codex'),
    icon: '🔮'
  },
  cursor: {
    name: 'Cursor',
    skillsDir: path.join(os.homedir(), '.cursor', 'skills'),
    commandsDir: path.join(os.homedir(), '.cursor', 'commands'),
    configDir: path.join(os.homedir(), '.cursor'),
    icon: '🖱️'
  },
  hermes: {
    name: 'Hermes',
    skillsDir: path.join(os.homedir(), '.hermes', 'skills'),
    commandsDir: path.join(os.homedir(), '.hermes', 'commands'),
    configDir: path.join(os.homedir(), '.hermes'),
    icon: '⚡'
  },
  trae: {
    name: 'Trae',
    skillsDir: path.join(os.homedir(), '.trae', 'skills'),
    commandsDir: path.join(os.homedir(), '.trae', 'commands'),
    configDir: path.join(os.homedir(), '.trae'),
    icon: '🚀'
  }
};

/**
 * 可用插件列表
 */
const AVAILABLE_PLUGINS = {
  graphify: {
    name: 'graphify',
    displayName: 'Graphify 知识图谱',
    description: '将项目代码映射成知识图谱，支持可视化和自然语言查询',
    category: '代码分析',
    icon: '🗺️',
    pythonPackage: 'graphifyy',
    
    // 插件提供的 Skill 内容
    skill: {
      name: 'graphify',
      content: `# Graphify 知识图谱技能

> 将项目代码映射成知识图谱，支持可视化和自然语言查询

## 触发条件

当用户需要以下操作时使用此技能：
- 理解项目整体架构
- 分析模块间依赖关系
- 生成项目架构报告
- 查询代码关联

## 使用方式

### 生成知识图谱

\`\`\`bash
graphify .
\`\`\`

生成文件：
- \`graphify-out/graph.html\` - 交互式图谱可视化
- \`graphify-out/GRAPH_REPORT.md\` - 架构分析报告
- \`graphify-out/graph.json\` - 完整图谱数据

### 查询图谱

\`\`\`bash
graphify query "认证模块和数据库的关系"
graphify path "UserService" "DatabasePool"
\`\`\`

### 导出报告

\`\`\`bash
graphify export callflow-html
\`\`\`

## 适用场景

1. **项目初始化**：新人加入时快速理解架构
2. **重构分析**：重构前查看模块依赖
3. **PR 审查**：分析 PR 影响范围
4. **文档生成**：自动生成架构报告

## 注意事项

- 需要 Python 3.10+ 环境
- 安装：\`pip install graphifyy\`
- 大型项目扫描可能需要几分钟
`
    },
    
    // 插件提供的 Command 内容
    command: {
      name: 'graphify',
      content: `/graphify $ARGUMENTS

生成项目知识图谱。

使用方式：
- /graphify .           - 生成当前目录的图谱
- /graphify ./src       - 生成 src 目录的图谱
- /graphify query "问题" - 查询图谱
`
    }
  },
  
  semble: {
    name: 'semble',
    displayName: 'Semble 语义搜索',
    description: '语义代码搜索引擎，比 grep 节省 98% token，毫秒级响应',
    category: '代码搜索',
    icon: '🔍',
    pythonPackage: 'semble',
    
    // 插件提供的 Skill 内容
    skill: {
      name: 'semble',
      content: `# Semble 语义搜索技能

> 语义代码搜索引擎，比 grep 节省 98% token，毫秒级响应

## 触发条件

当用户需要以下操作时使用此技能：
- 搜索代码实现
- 查找某个功能的位置
- 理解陌生代码
- 快速定位相关代码

## 使用方式

### 创建索引

\`\`\`bash
semble index . -o cached_index
\`\`\`

### 语义搜索

\`\`\`bash
semble search "认证流程" ./project
semble search "save_pretrained" ./project --top-k 10
\`\`\`

### 搜索文档

\`\`\`bash
semble search "部署指南" ./project --content docs
\`\`\`

### 搜索配置

\`\`\`bash
semble search "数据库端口" ./project --content config
\`\`\`

### 查找相关代码

\`\`\`bash
semble find-related src/auth.py 42 ./project
\`\`\`

## 适用场景

1. **代码查找**："这个功能在哪里实现的？"
2. **代码理解**："这个函数是干嘛的？"
3. **快速定位**：找到某个逻辑的精确位置
4. **Token 优化**：减少 AI 对话中的 token 消耗

## 注意事项

- 需要 Python 3.10+ 环境
- 安装：\`pip install semble\`
- 索引不会自动更新，代码变更后需重新索引
- 适合语义搜索，精确字符串匹配用 grep 更好
`
    },
    
    // 插件提供的 Command 内容
    command: {
      name: 'search',
      content: `/search $ARGUMENTS

语义搜索代码。

使用方式：
- /search "认证流程"           - 搜索认证相关代码
- /search "save_pretrained"    - 搜索函数实现
- /search "数据库连接" --content config - 搜索配置文件
`
    }
  },
  
  agentmemory: {
    name: 'agentmemory',
    displayName: 'AgentMemory 跨会话记忆',
    description: '自动捕获会话信息，让 AI 记住你的项目、技术选型和编码习惯',
    category: '记忆管理',
    icon: '🧠',
    npmPackage: '@agentmemory/agentmemory',
    
    // 插件提供的 Skill 内容
    skill: {
      name: 'agentmemory',
      content: `# AgentMemory 跨会话记忆技能

> 自动捕获会话信息，让 AI 记住你的项目、技术选型和编码习惯

## 触发条件

当用户需要以下操作时使用此技能：
- 查找之前的开发记录
- 回忆项目架构和技术选型
- 跨会话保持上下文
- 团队共享开发知识

## 使用方式

### 初始化

\`\`\`bash
bailu agentmemory init
\`\`\`

### 连接到 AI 工具

\`\`\`bash
bailu agentmemory connect claude-code
bailu agentmemory connect codex
bailu agentmemory connect cursor
\`\`\`

### 查看状态

\`\`\`bash
bailu agentmemory status
\`\`\`

### 演示

\`\`\`bash
bailu agentmemory demo
\`\`\`

## 适用场景

1. **跨会话记忆**：AI 记住你的项目架构、技术选型
2. **减少重复解释**：不需要每次都重新描述背景
3. **团队协作**：共享记忆服务器，团队成员都能访问
4. **会话回放**：可以回放任意会话的时间线

## 注意事项

- 需要 Node.js 环境
- 首次使用需要初始化
- 记忆服务器默认运行在端口 3111
- 实时查看器在端口 3113
`
    },
    
    // 插件提供的 Command 内容
    command: {
      name: 'agentmemory',
      content: `/agentmemory $ARGUMENTS

管理 AgentMemory 跨会话记忆。

使用方式：
- /agentmemory init                    - 初始化记忆服务器
- /agentmemory connect claude-code     - 连接到 Claude Code
- /agentmemory connect codex           - 连接到 Codex
- /agentmemory status                  - 查看状态
- /agentmemory demo                    - 运行演示
- /agentmemory stop                    - 停止服务器
`
    }
  },
  
  'ppt-skill': {
    name: 'ppt-skill',
    displayName: 'Guizang PPT 生成器',
    description: '生成精美的网页 PPT，支持电子杂志风和瑞士国际主义风',
    category: '内容创作',
    icon: '🎨',
    github: 'op7418/guizang-ppt-skill',
    
    skill: {
      name: 'ppt-skill',
      content: `# Guizang PPT 生成技能

> 生成精美的网页 PPT，支持电子杂志风和瑞士国际主义风

## 触发条件

当用户需要以下操作时使用此技能：
- 生成演讲 PPT
- 制作产品介绍
- 生成公众号头图 / 小红书封面
- 制作风格化的内容展示

## 两种风格

### Style A: 电子杂志风
- 适合：叙事、观点、分享、个人风格表达
- 特点：像 Monocle 贴上了代码

### Style B: 瑞士国际主义风
- 适合：事实、产品、分析、方法论表达
- 特点：网格至上、单一高饱和锚点色

## 使用方式

用户可以说：
- "帮我做一份瑞士风 PPT"
- "帮我做一份杂志风 PPT"
- "基于这篇文章做一份 8 页左右的 PPT"
- "生成公众号 21:9 头图"
- "生成小红书 3:4 封面"
`
    },
    
    command: {
      name: 'ppt',
      content: `/ppt $ARGUMENTS

生成网页 PPT。

使用方式：
- /ppt 帮我做一份瑞士风 PPT
- /ppt 帮我做一份杂志风 PPT
- /ppt 基于这篇文章做一份 8 页左右的 PPT
`
    }
  },
  
  agency: {
    name: 'agency',
    displayName: 'Agency Orchestrator',
    description: '多 Agent 编排，211 个专业角色自动协作，一句话出结果',
    category: '任务编排',
    icon: '🤖',
    npmPackage: 'agency-orchestrator',
    
    skill: {
      name: 'agency',
      content: `# Agency Orchestrator 多 Agent 编排技能

> 一句话调度多个 AI 专家自动协作，几分钟出完整方案

## 触发条件

当用户需要以下操作时使用此技能：
- 复杂任务需要多角色协作
- 产品需求分析
- 技术方案评审
- 市场调研报告

## 使用方式

用户可以说：
- "帮我做一份产品需求分析"
- "帮我做一份技术方案评审"
- "帮我做一份市场调研报告"
- "帮我分析这个竞品"

## 211 个专业角色

包括但不限于：
- 产品经理
- 技术架构师
- UI 设计师
- 市场分析师
- 项目经理
- 测试工程师
- 运营专家
- 数据分析师
`
    },
    
    command: {
      name: 'agency',
      content: `/agency $ARGUMENTS

多 Agent 编排。

使用方式：
- /agency 帮我做一份产品需求分析
- /agency 帮我做一份技术方案评审
- /agency 帮我分析这个竞品
`
    }
  }
};

/**
 * 检查 Python 包是否已安装
 */
function isPythonPackageInstalled(packageName) {
  try {
    execSync(`python -c "import ${packageName}"`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 安装 Python 包
 */
function installPythonPackage(packageName) {
  try {
    execSync(`pip install ${packageName}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查 AI 工具是否已安装
 */
function isAIToolInstalled(toolName) {
  const tool = AI_TOOLS[toolName];
  if (!tool) return false;
  
  // 检查配置目录是否存在
  return fs.existsSync(tool.configDir);
}

/**
 * 获取已安装的插件
 */
async function getInstalledPlugins() {
  const installedPath = path.join(BAILU_HOME, 'plugins', 'installed.json');
  
  if (await fs.pathExists(installedPath)) {
    return await fs.readJson(installedPath);
  }
  
  return { plugins: {} };
}

/**
 * 保存已安装的插件
 */
async function saveInstalledPlugins(installed) {
  const pluginsDir = path.join(BAILU_HOME, 'plugins');
  await fs.ensureDir(pluginsDir);
  const installedPath = path.join(pluginsDir, 'installed.json');
  await fs.writeJson(installedPath, installed, { spaces: 2 });
}

/**
 * 列出可用插件
 */
async function listPlugins() {
  console.log('');
  console.log(chalk.cyan('🦌 白鹿工作流 - 插件列表'));
  console.log('');

  const installed = await getInstalledPlugins();
  const installedPlugins = Object.keys(installed.plugins || {});

  // 创建表格
  const table = new Table({
    head: [
      chalk.cyan('插件'),
      chalk.cyan('名称'),
      chalk.cyan('类别'),
      chalk.cyan('说明'),
      chalk.cyan('状态')
    ],
    style: {
      head: [],
      border: ['gray']
    },
    chars: {
      'top': '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      'bottom': '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      'left': '│',
      'left-mid': '├',
      'mid': '─',
      'mid-mid': '┼',
      'right': '│',
      'right-mid': '┤'
    }
  });

  for (const [key, plugin] of Object.entries(AVAILABLE_PLUGINS)) {
    const isInstalled = installedPlugins.includes(key);
    const status = isInstalled ? chalk.green('✅ 已安装') : chalk.gray('⬜ 未安装');
    
    table.push([
      plugin.icon,
      chalk.white(plugin.displayName),
      chalk.gray(plugin.category),
      chalk.gray(plugin.description.substring(0, 40) + '...'),
      status
    ]);
  }

  console.log(table.toString());
  console.log('');

  // 显示安装命令
  console.log(chalk.yellow('📦 安装插件到 AI 工具：'));
  for (const [key, plugin] of Object.entries(AVAILABLE_PLUGINS)) {
    if (!installedPlugins.includes(key)) {
      console.log(`   bailu plugin install ${key}    ${plugin.icon} ${plugin.displayName}`);
    }
  }
  console.log('');
}

/**
 * 显示插件详情
 */
async function showPluginDetail(pluginName) {
  const plugin = AVAILABLE_PLUGINS[pluginName];
  
  if (!plugin) {
    console.log(chalk.red(`❌ 未知插件：${pluginName}`));
    console.log('');
    console.log('可用插件：');
    for (const key of Object.keys(AVAILABLE_PLUGINS)) {
      console.log(`  - ${key}`);
    }
    return;
  }

  const installed = await getInstalledPlugins();
  const isInstalled = installed.plugins && installed.plugins[pluginName];

  // 检查 Python 包
  const pythonInstalled = isPythonPackageInstalled(plugin.pythonPackage);

  console.log('');
  console.log(boxen(
    chalk.white(`${plugin.icon} ${chalk.bold(plugin.displayName)}\n\n`) +
    chalk.white(`类别：${chalk.cyan(plugin.category)}\n`) +
    chalk.white(`Python 包：${chalk.cyan(plugin.pythonPackage)} ${pythonInstalled ? chalk.green('✅') : chalk.red('❌')}\n`) +
    chalk.white(`AI 工具集成：${isInstalled ? chalk.green('已安装') : chalk.gray('未安装')}\n\n`) +
    chalk.white(`${plugin.description}\n\n`) +
    chalk.yellow('安装后会添加：\n') +
    chalk.white(`  • Skill：${plugin.skill.name}\n`) +
    chalk.white(`  • Command：/${plugin.command.name}\n\n`) +
    chalk.yellow('安装命令：\n') +
    chalk.cyan(`  bailu plugin install ${pluginName}`),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      title: '📋 插件详情',
      titleAlignment: 'center'
    }
  ));
}

/**
 * 安装插件到 AI 工具
 */
async function installPlugin(pluginName, options = {}) {
  const plugin = AVAILABLE_PLUGINS[pluginName];
  
  if (!plugin) {
    console.log(chalk.red(`❌ 未知插件：${pluginName}`));
    return;
  }

  const { tool = 'all' } = options;

  console.log('');
  console.log(chalk.cyan(`🦌 白鹿工作流 - 安装插件到 AI 工具`));
  console.log('');

  // 1. 检查并安装 Python 依赖（如果有）
  if (plugin.pythonPackage) {
    const pythonSpinner = ora({
      text: `检查 Python 依赖 ${plugin.pythonPackage}...`,
      spinner: 'dots',
      color: 'cyan'
    }).start();

    if (!isPythonPackageInstalled(plugin.pythonPackage)) {
      pythonSpinner.text = `正在安装 ${plugin.pythonPackage}...`;
      const installed = installPythonPackage(plugin.pythonPackage);
      if (installed) {
        pythonSpinner.succeed(`${plugin.pythonPackage} 安装成功`);
      } else {
        pythonSpinner.fail(`${plugin.pythonPackage} 安装失败`);
        console.log(chalk.yellow(`请手动安装：pip install ${plugin.pythonPackage}`));
      }
    } else {
      pythonSpinner.succeed(`${plugin.pythonPackage} 已安装`);
    }
  }

  // 检查并安装 npm 依赖（如果有）
  if (plugin.npmPackage) {
    const npmSpinner = ora({
      text: `检查 npm 依赖 ${plugin.npmPackage}...`,
      spinner: 'dots',
      color: 'cyan'
    }).start();

    try {
      execSync(`${plugin.npmPackage} --version`, { stdio: 'ignore' });
      npmSpinner.succeed(`${plugin.npmPackage} 已安装`);
    } catch {
      npmSpinner.text = `正在安装 ${plugin.npmPackage}...`;
      try {
        execSync(`npm install -g ${plugin.npmPackage}`, { stdio: 'ignore' });
        npmSpinner.succeed(`${plugin.npmPackage} 安装成功`);
      } catch {
        npmSpinner.fail(`${plugin.npmPackage} 安装失败`);
        console.log(chalk.yellow(`请手动安装：npm install -g ${plugin.npmPackage}`));
      }
    }
  }

  // 2. 安装到 AI 工具
  const toolsToInstall = tool === 'all' 
    ? Object.keys(AI_TOOLS).filter(t => isAIToolInstalled(t))
    : [tool];

  if (toolsToInstall.length === 0) {
    console.log(chalk.yellow('未检测到已安装的 AI 工具'));
    return;
  }

  console.log('');
  console.log(chalk.yellow('📦 安装到 AI 工具：'));

  const installSpinner = ora({
    text: '正在安装...',
    spinner: 'dots',
    color: 'cyan'
  }).start();

  let installedCount = 0;

  for (const toolName of toolsToInstall) {
    const toolConfig = AI_TOOLS[toolName];
    
    try {
      // 创建 Skill 文件
      const skillDir = path.join(toolConfig.skillsDir, plugin.name);
      await fs.ensureDir(skillDir);
      await fs.writeFile(
        path.join(skillDir, 'SKILL.md'),
        plugin.skill.content
      );

      // 创建 Command 文件
      const commandDir = toolConfig.commandsDir;
      await fs.ensureDir(commandDir);
      await fs.writeFile(
        path.join(commandDir, `${plugin.name}.md`),
        plugin.command.content
      );

      installedCount++;
    } catch (error) {
      // 忽略单个工具的安装错误
    }
  }

  installSpinner.succeed(`已安装到 ${installedCount} 个 AI 工具`);

  // 3. 更新安装记录
  const installed = await getInstalledPlugins();
  if (!installed.plugins) installed.plugins = {};
  installed.plugins[pluginName] = {
    version: '1.0.0',
    installed_at: new Date().toISOString(),
    tools: toolsToInstall
  };
  await saveInstalledPlugins(installed);

  // 4. 显示安装结果
  console.log('');
  console.log(boxen(
    chalk.white(`${plugin.icon} ${plugin.displayName} 已安装\n\n`) +
    chalk.white(`已安装到：${toolsToInstall.join(', ')}\n\n`) +
    chalk.yellow('现在可以在 AI 工具中使用：\n') +
    chalk.white(`  • Skill：${plugin.skill.name}\n`) +
    chalk.white(`  • Command：/${plugin.command.name}\n\n`) +
    chalk.yellow('Python 包：\n') +
    (plugin.pythonPackage ? 
      chalk.white(`  ${plugin.pythonPackage} ${isPythonPackageInstalled(plugin.pythonPackage) ? chalk.green('✅') : chalk.red('❌')}`) :
      chalk.white('  无 Python 依赖')
    ),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'green',
      title: '✅ 安装成功',
      titleAlignment: 'center'
    }
  ));
}

/**
 * 卸载插件
 */
async function uninstallPlugin(pluginName, options = {}) {
  const plugin = AVAILABLE_PLUGINS[pluginName];
  
  if (!plugin) {
    console.log(chalk.red(`❌ 未知插件：${pluginName}`));
    return;
  }

  const { tool = 'all' } = options;

  console.log('');
  console.log(chalk.cyan(`🦌 白鹿工作流 - 卸载插件`));
  console.log('');

  const spinner = ora({
    text: `正在卸载 ${plugin.displayName}...`,
    spinner: 'dots',
    color: 'cyan'
  }).start();

  // 从 AI 工具中移除
  const toolsToUninstall = tool === 'all'
    ? Object.keys(AI_TOOLS)
    : [tool];

  let uninstalledCount = 0;

  for (const toolName of toolsToUninstall) {
    const toolConfig = AI_TOOLS[toolName];
    
    try {
      // 删除 Skill 文件
      const skillDir = path.join(toolConfig.skillsDir, plugin.name);
      if (await fs.pathExists(skillDir)) {
        await fs.remove(skillDir);
      }

      // 删除 Command 文件
      const commandFile = path.join(toolConfig.commandsDir, `${plugin.name}.md`);
      if (await fs.pathExists(commandFile)) {
        await fs.remove(commandFile);
      }

      uninstalledCount++;
    } catch (error) {
      // 忽略单个工具的卸载错误
    }
  }

  // 更新安装记录
  const installed = await getInstalledPlugins();
  if (installed.plugins && installed.plugins[pluginName]) {
    delete installed.plugins[pluginName];
    await saveInstalledPlugins(installed);
  }

  spinner.succeed(`${plugin.displayName} 已从 ${uninstalledCount} 个 AI 工具中卸载`);
  console.log(chalk.gray(`Python 包 ${plugin.pythonPackage} 需手动卸载：pip uninstall ${plugin.pythonPackage}`));
}

/**
 * 注册插件命令
 */
function registerCommands(program) {
  // plugin 命令组
  const pluginCmd = program
    .command('plugin')
    .description('插件管理');

  // plugin list
  pluginCmd
    .command('list')
    .description('列出可用插件')
    .action(async () => {
      await listPlugins();
    });

  // plugin info
  pluginCmd
    .command('info <name>')
    .description('查看插件详情')
    .action(async (name) => {
      await showPluginDetail(name);
    });

  // plugin install
  pluginCmd
    .command('install <name>')
    .description('安装插件到 AI 工具')
    .option('-t, --tool <tool>', '指定 AI 工具 (hanako|claude|codex|cursor|hermes|trae)', 'all')
    .action(async (name, options) => {
      await installPlugin(name, options);
    });

  // plugin uninstall
  pluginCmd
    .command('uninstall <name>')
    .description('从 AI 工具中卸载插件')
    .option('-t, --tool <tool>', '指定 AI 工具', 'all')
    .action(async (name, options) => {
      await uninstallPlugin(name, options);
    });

  // 注册各个插件的命令
  try {
    const pptPlugin = require('../../../plugin-ppt-skill');
    if (pptPlugin.registerCommands) {
      pptPlugin.registerCommands(program);
    }
  } catch (error) {
    // 插件未安装，忽略
  }

  try {
    const agencyPlugin = require('../../../plugin-agency');
    if (agencyPlugin.registerCommands) {
      agencyPlugin.registerCommands(program);
    }
  } catch (error) {
    // 插件未安装，忽略
  }

  try {
    const agentmemoryPlugin = require('../../../plugin-agentmemory');
    if (agentmemoryPlugin.registerCommands) {
      agentmemoryPlugin.registerCommands(program);
    }
  } catch (error) {
    // 插件未安装，忽略
  }
}

module.exports = {
  AVAILABLE_PLUGINS,
  AI_TOOLS,
  getInstalledPlugins,
  listPlugins,
  showPluginDetail,
  installPlugin,
  uninstallPlugin,
  registerCommands
};
