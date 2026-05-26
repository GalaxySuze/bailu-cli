/**
 * @vickzhang/bailu-plugin-agency
 * 
 * 白鹿工作流插件 - Agency Orchestrator 多 Agent 编排
 * 
 * 功能：
 * - 211 个专业 AI 角色自动协作
 * - YAML 零代码定义工作流
 * - DAG 自动检测，并行执行
 * - MCP Server 模式
 * 
 * 使用方式：
 *   bailu plugin install agency
 *   在 AI 工具中说："帮我做一份产品需求分析"
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const ora = require('ora');

/**
 * 插件元信息
 */
const PLUGIN_INFO = {
  name: 'agency',
  displayName: 'Agency Orchestrator',
  version: '1.0.0',
  description: '多 Agent 编排，211 个专业角色自动协作，一句话出结果',
  category: '任务编排',
  icon: '🤖',
  
  // npm 包
  npmPackage: 'agency-orchestrator',
  
  // GitHub 仓库
  repo: 'https://github.com/jnMetaCode/agency-orchestrator',
  
  // 适用场景
  useCases: [
    '复杂任务自动拆解',
    '多角色协作完成方案',
    '产品需求分析',
    '技术方案评审'
  ],
  
  // 优缺点
  pros: [
    '211 个中文专业角色',
    'YAML 零代码',
    'DAG 自动并行',
    '7 种 LLM 免 API key'
  ],
  
  cons: [
    '需要 Node.js 环境',
    '复杂任务可能需要较长时间'
  ]
};

/**
 * Skill 内容
 */
const SKILL_CONTENT = `# Agency Orchestrator 多 Agent 编排技能

> 一句话调度多个 AI 专家自动协作，几分钟出完整方案

## 触发条件

当用户需要以下操作时使用此技能：
- 复杂任务需要多角色协作
- 产品需求分析
- 技术方案评审
- 市场调研报告
- 任何需要"一个团队"完成的任务

## 工作原理

1. 用户一句话描述任务
2. 系统自动从 211 个角色中匹配
3. 按 DAG 并行执行
4. 输出完整方案

## 使用方式

### 一句话出结果

用户可以说：
- "帮我做一份产品需求分析"
- "帮我做一份技术方案评审"
- "帮我做一份市场调研报告"
- "帮我分析这个竞品"

### 使用 YAML 工作流

\`\`\`bash
ao run workflow.yaml
\`\`\`

### 启动 MCP Server

\`\`\`bash
ao serve
\`\`\`

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

## 注意事项

- 复杂任务可能需要较长时间
- 可以通过 YAML 自定义工作流
- 支持 10 种 LLM，7 种免 API key
`;

/**
 * Command 内容
 */
const COMMAND_CONTENT = `/agency $ARGUMENTS

多 Agent 编排。

使用方式：
- /agency 帮我做一份产品需求分析
- /agency 帮我做一份技术方案评审
- /agency 帮我分析这个竞品
`;

/**
 * 检查 agency 是否已安装
 */
function isInstalled() {
  try {
    execSync('ao --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 安装 agency
 */
async function install() {
  const spinner = ora({
    text: '正在安装 Agency Orchestrator...',
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    execSync('npm install -g agency-orchestrator', { stdio: 'ignore' });
    spinner.succeed('Agency Orchestrator 安装成功');
    return true;
  } catch (error) {
    spinner.fail('Agency Orchestrator 安装失败');
    console.log(chalk.yellow('请手动安装：npm install -g agency-orchestrator'));
    return false;
  }
}

/**
 * 注册插件命令
 */
function registerCommands(program) {
  // agency 命令组
  const agencyCmd = program
    .command('agency')
    .description('Agency Orchestrator 多 Agent 编排');

  // agency demo
  agencyCmd
    .command('demo')
    .description('运行演示')
    .action(async () => {
      if (!isInstalled()) {
        console.log(chalk.yellow('Agency Orchestrator 未安装，正在安装...'));
        const installed = await install();
        if (!installed) return;
      }
      
      console.log(chalk.cyan('运行 Agency Orchestrator 演示...'));
      execSync('ao demo', { stdio: 'inherit' });
    });

  // agency roles
  agencyCmd
    .command('roles')
    .description('列出所有角色')
    .action(async () => {
      if (!isInstalled()) {
        console.log(chalk.yellow('Agency Orchestrator 未安装，正在安装...'));
        const installed = await install();
        if (!installed) return;
      }
      
      execSync('ao roles', { stdio: 'inherit' });
    });

  // agency help
  agencyCmd
    .command('help')
    .description('显示帮助')
    .action(() => {
      console.log('');
      console.log(chalk.cyan('🤖 Agency Orchestrator'));
      console.log('');
      console.log(chalk.white('Agency 是通过 AI 工具的 Skill 触发的，请在 AI 工具中使用：'));
      console.log('');
      console.log(chalk.yellow('  在 Hanako / Claude Code 中说：'));
      console.log(chalk.white('    "帮我做一份产品需求分析"'));
      console.log(chalk.white('    "帮我做一份技术方案评审"'));
      console.log(chalk.white('    "帮我分析这个竞品"'));
      console.log('');
      console.log(chalk.yellow('  CLI 命令：'));
      console.log(chalk.white('    ao demo              运行演示'));
      console.log(chalk.white('    ao roles             列出所有角色'));
      console.log(chalk.white('    ao run workflow.yaml 执行工作流'));
      console.log(chalk.white('    ao serve             启动 MCP Server'));
      console.log('');
    });
}

module.exports = {
  PLUGIN_INFO,
  SKILL_CONTENT,
  COMMAND_CONTENT,
  isInstalled,
  install,
  registerCommands
};
