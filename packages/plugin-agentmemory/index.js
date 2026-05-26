/**
 * @vickzhang/bailu-plugin-agentmemory
 * 
 * 白鹿工作流插件 - AgentMemory 跨会话记忆
 * 
 * 功能：
 * - 自动捕获会话信息
 * - 跨会话记忆，AI 记住你的项目和技术选型
 * - 混合搜索（BM25 + 向量 + 图谱）
 * - 节省 92% token
 * 
 * 使用方式：
 *   bailu plugin install agentmemory
 *   bailu agentmemory init
 *   bailu agentmemory connect claude-code
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');

/**
 * 插件元信息
 */
const PLUGIN_INFO = {
  name: 'agentmemory',
  displayName: 'AgentMemory 跨会话记忆',
  version: '1.0.0',
  description: '自动捕获会话信息，让 AI 记住你的项目、技术选型和编码习惯',
  category: '记忆管理',
  
  // 依赖的 npm 包
  npmPackage: '@agentmemory/agentmemory',
  
  // 支持的命令
  commands: [
    {
      name: 'agentmemory',
      description: 'AgentMemory 管理',
      usage: 'bailu agentmemory <command>',
      examples: [
        'bailu agentmemory init',
        'bailu agentmemory connect claude-code',
        'bailu agentmemory status',
        'bailu agentmemory demo'
      ]
    }
  ],
  
  // 适用场景
  useCases: [
    '跨会话记住项目架构和技术选型',
    '减少重复解释，节省 token',
    '团队共享开发记忆',
    '会话回放和分析'
  ],
  
  // 优缺点
  pros: [
    '自动捕获，零手动操作',
    '节省 92% token',
    '支持多平台（Claude Code、Codex、Hermes 等）',
    'MCP 标准接口',
    '实时可视化记忆构建'
  ],
  
  cons: [
    '需要运行 Node.js 服务器',
    '需要额外存储空间'
  ]
};

/**
 * Skill 内容
 */
const SKILL_CONTENT = `# AgentMemory 跨会话记忆技能

> 自动捕获会话信息，让 AI 记住你的项目、技术选型和编码习惯

## 触发条件

当用户需要以下操作时使用此技能：
- 查找之前的开发记录
- 回忆项目架构和技术选型
- 跨会话保持上下文
- 团队共享开发知识

## 工作原理

AgentMemory 通过 12 个 hooks 自动捕获会话信息：
1. 会话开始时注入相关记忆
2. 工具调用时记录操作
3. 会话结束时压缩存储

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
`;

/**
 * Command 内容
 */
const COMMAND_CONTENT = `/agentmemory $ARGUMENTS

管理 AgentMemory 跨会话记忆。

使用方式：
- /agentmemory init                    - 初始化记忆服务器
- /agentmemory connect claude-code     - 连接到 Claude Code
- /agentmemory connect codex           - 连接到 Codex
- /agentmemory status                  - 查看状态
- /agentmemory demo                    - 运行演示
- /agentmemory stop                    - 停止服务器
`;

/**
 * 检查 agentmemory 是否已安装
 */
function isInstalled() {
  try {
    execSync('agentmemory --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查服务器是否运行
 */
function isServerRunning() {
  try {
    const result = execSync('curl -s http://localhost:3111/agentmemory/health', { encoding: 'utf8' });
    return result.includes('ok');
  } catch {
    return false;
  }
}

/**
 * 安装 agentmemory
 */
async function install() {
  const spinner = ora({
    text: '正在安装 AgentMemory...',
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    execSync('npm install -g @agentmemory/agentmemory', { stdio: 'ignore' });
    spinner.succeed('AgentMemory 安装成功');
    return true;
  } catch (error) {
    spinner.fail('AgentMemory 安装失败');
    console.log(chalk.yellow('请手动安装：npm install -g @agentmemory/agentmemory'));
    return false;
  }
}

/**
 * 初始化 AgentMemory
 */
async function init() {
  console.log('');
  console.log(chalk.cyan('🦌 白鹿工作流 - 初始化 AgentMemory'));
  console.log('');

  // 检查是否已安装
  if (!isInstalled()) {
    console.log(chalk.yellow('AgentMemory 未安装，正在安装...'));
    const installed = await install();
    if (!installed) return;
  }

  // 启动服务器
  const spinner = ora({
    text: '正在启动记忆服务器...',
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    // 后台启动服务器
    const server = spawn('agentmemory', [], {
      detached: true,
      stdio: 'ignore'
    });
    server.unref();

    // 等待服务器启动
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (isServerRunning()) {
      spinner.succeed('记忆服务器已启动');
      
      console.log('');
      console.log(boxen(
        chalk.white('AgentMemory 已初始化\n\n') +
        chalk.white('服务器地址：') + chalk.cyan('http://localhost:3111\n') +
        chalk.white('实时查看器：') + chalk.cyan('http://localhost:3113\n\n') +
        chalk.yellow('下一步：\n') +
        chalk.white('1. bailu agentmemory connect claude-code\n') +
        chalk.white('2. bailu agentmemory connect codex'),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'green',
          title: '✅ 初始化成功',
          titleAlignment: 'center'
        }
      ));
    } else {
      spinner.fail('服务器启动失败');
      console.log(chalk.yellow('请手动启动：agentmemory'));
    }
  } catch (error) {
    spinner.fail('初始化失败：' + error.message);
  }
}

/**
 * 连接到 AI 工具
 */
async function connect(toolName) {
  console.log('');
  console.log(chalk.cyan(`🦌 白鹿工作流 - 连接 AgentMemory 到 ${toolName}`));
  console.log('');

  // 检查服务器是否运行
  if (!isServerRunning()) {
    console.log(chalk.yellow('记忆服务器未运行，正在启动...'));
    await init();
  }

  const spinner = ora({
    text: `正在连接到 ${toolName}...`,
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    execSync(`agentmemory connect ${toolName}`, { stdio: 'ignore' });
    spinner.succeed(`已连接到 ${toolName}`);
    
    console.log('');
    console.log(boxen(
      chalk.white(`AgentMemory 已连接到 ${toolName}\n\n`) +
      chalk.yellow('现在可以使用：\n') +
      chalk.white('• /recall - 回忆记忆\n') +
      chalk.white('• /remember - 保存记忆\n') +
      chalk.white('• /session-history - 查看会话历史\n') +
      chalk.white('• /forget - 删除记忆'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
        title: '✅ 连接成功',
        titleAlignment: 'center'
      }
    ));
  } catch (error) {
    spinner.fail(`连接失败：${error.message}`);
  }
}

/**
 * 查看状态
 */
async function status() {
  console.log('');
  console.log(chalk.cyan('🦌 白鹿工作流 - AgentMemory 状态'));
  console.log('');

  const installed = isInstalled();
  const running = isServerRunning();

  console.log(boxen(
    chalk.white('安装状态：') + (installed ? chalk.green('✅ 已安装') : chalk.red('❌ 未安装')) + '\n' +
    chalk.white('服务器状态：') + (running ? chalk.green('✅ 运行中') : chalk.red('❌ 未运行')) + '\n' +
    (running ? chalk.white('服务器地址：') + chalk.cyan('http://localhost:3111\n') : '') +
    (running ? chalk.white('实时查看器：') + chalk.cyan('http://localhost:3113') : ''),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: running ? 'green' : 'yellow',
      title: '📊 AgentMemory 状态',
      titleAlignment: 'center'
    }
  ));

  if (!installed) {
    console.log('');
    console.log(chalk.yellow('安装命令：'));
    console.log(chalk.cyan('  bailu plugin install agentmemory'));
  }

  if (installed && !running) {
    console.log('');
    console.log(chalk.yellow('启动命令：'));
    console.log(chalk.cyan('  bailu agentmemory init'));
  }
}

/**
 * 运行演示
 */
async function demo() {
  console.log('');
  console.log(chalk.cyan('🦌 白鹿工作流 - AgentMemory 演示'));
  console.log('');

  if (!isServerRunning()) {
    console.log(chalk.yellow('记忆服务器未运行，正在启动...'));
    await init();
  }

  const spinner = ora({
    text: '正在运行演示...',
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    execSync('agentmemory demo', { stdio: 'inherit' });
    spinner.succeed('演示完成');
  } catch (error) {
    spinner.fail('演示失败：' + error.message);
  }
}

/**
 * 停止服务器
 */
async function stop() {
  const spinner = ora({
    text: '正在停止记忆服务器...',
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    execSync('agentmemory stop', { stdio: 'ignore' });
    spinner.succeed('记忆服务器已停止');
  } catch (error) {
    spinner.fail('停止失败：' + error.message);
  }
}

/**
 * 注册插件命令
 */
function registerCommands(program) {
  // agentmemory 命令组
  const agentmemoryCmd = program
    .command('agentmemory')
    .description('AgentMemory 跨会话记忆管理');

  // agentmemory init
  agentmemoryCmd
    .command('init')
    .description('初始化记忆服务器')
    .action(async () => {
      await init();
    });

  // agentmemory connect
  agentmemoryCmd
    .command('connect <tool>')
    .description('连接到 AI 工具')
    .action(async (tool) => {
      await connect(tool);
    });

  // agentmemory status
  agentmemoryCmd
    .command('status')
    .description('查看状态')
    .action(async () => {
      await status();
    });

  // agentmemory demo
  agentmemoryCmd
    .command('demo')
    .description('运行演示')
    .action(async () => {
      await demo();
    });

  // agentmemory stop
  agentmemoryCmd
    .command('stop')
    .description('停止服务器')
    .action(async () => {
      await stop();
    });
}

module.exports = {
  PLUGIN_INFO,
  SKILL_CONTENT,
  COMMAND_CONTENT,
  isInstalled,
  isServerRunning,
  install,
  init,
  connect,
  status,
  demo,
  stop,
  registerCommands
};
