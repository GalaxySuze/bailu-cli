/**
 * @vickzhang/bailu-plugin-graphify
 * 
 * 白鹿工作流插件 - Graphify 知识图谱生成器
 * 
 * 功能：
 * - 将项目代码映射成知识图谱
 * - 生成交互式可视化图谱
 * - 支持自然语言查询
 * - 分析模块间意外连接
 * 
 * 使用方式：
 *   bailu plugin install graphify
 *   bailu graphify .
 *   bailu graphify query "认证和数据库的关系"
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');

/**
 * 插件元信息
 */
const PLUGIN_INFO = {
  name: 'graphify',
  displayName: 'Graphify 知识图谱',
  version: '1.0.0',
  description: '将项目代码映射成知识图谱，支持可视化和自然语言查询',
  category: '代码分析',
  
  // 依赖的 Python 包
  pythonPackages: ['graphifyy'],
  
  // 支持的命令
  commands: [
    {
      name: 'graphify',
      description: '生成知识图谱',
      usage: 'bailu graphify <path>',
      examples: [
        'bailu graphify .',
        'bailu graphify ./src'
      ]
    },
    {
      name: 'graphify:query',
      description: '查询知识图谱',
      usage: 'bailu graphify:query "<question>"',
      examples: [
        'bailu graphify:query "认证和数据库的关系"',
        'bailu graphify:query "哪些模块依赖 UserService"'
      ]
    },
    {
      name: 'graphify:export',
      description: '导出图谱报告',
      usage: 'bailu graphify:export [format]',
      examples: [
        'bailu graphify:export html',
        'bailu graphify:export callflow'
      ]
    }
  ],
  
  // 适用场景
  useCases: [
    '项目初始化时生成架构图谱',
    '新人快速理解项目结构',
    '重构前分析模块依赖',
    'PR 审查影响范围分析'
  ],
  
  // 优缺点
  pros: [
    '支持 31 种编程语言',
    '生成交互式可视化图谱',
    '发现模块间意外连接',
    '支持自然语言查询'
  ],
  
  cons: [
    '需要 Python 环境',
    '大型项目扫描较慢',
    '非代码文件需要 API 调用'
  ]
};

/**
 * 检查 graphify 是否已安装
 */
function isInstalled() {
  try {
    execSync('graphify --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 安装 graphify
 */
async function install() {
  const spinner = ora({
    text: '正在安装 graphify...',
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    execSync('pip install graphifyy', { stdio: 'ignore' });
    spinner.succeed('graphify 安装成功');
    return true;
  } catch (error) {
    spinner.fail('graphify 安装失败');
    console.log(chalk.yellow('请手动安装：pip install graphifyy'));
    return false;
  }
}

/**
 * 生成知识图谱
 */
async function generate(projectPath = '.') {
  if (!isInstalled()) {
    console.log(chalk.yellow('graphify 未安装，正在安装...'));
    const installed = await install();
    if (!installed) return;
  }

  const spinner = ora({
    text: '正在生成知识图谱...',
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    execSync(`graphify ${projectPath}`, { stdio: 'ignore' });
    spinner.succeed('知识图谱生成成功');
    
    console.log('');
    console.log(boxen(
      chalk.white('生成文件：\n\n') +
      chalk.cyan('graphify-out/\n') +
      chalk.white('├── graph.html       交互式图谱可视化\n') +
      chalk.white('├── GRAPH_REPORT.md  项目架构报告\n') +
      chalk.white('└── graph.json       完整图谱数据\n\n') +
      chalk.yellow('使用方式：\n') +
      chalk.white('• 浏览器打开 graph.html 查看图谱\n') +
      chalk.white('• bailu graphify:query "问题" 查询图谱'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
        title: '✅ 生成完成',
        titleAlignment: 'center'
      }
    ));
  } catch (error) {
    spinner.fail('生成失败：' + error.message);
  }
}

/**
 * 查询知识图谱
 */
async function query(question) {
  if (!isInstalled()) {
    console.log(chalk.red('graphify 未安装，请先运行：bailu plugin install graphify'));
    return;
  }

  const spinner = ora({
    text: '正在查询...',
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    const result = execSync(`graphify query "${question}"`, { encoding: 'utf8' });
    spinner.succeed('查询完成');
    console.log('');
    console.log(result);
  } catch (error) {
    spinner.fail('查询失败：' + error.message);
  }
}

/**
 * 导出图谱
 */
async function exportGraph(format = 'html') {
  if (!isInstalled()) {
    console.log(chalk.red('graphify 未安装，请先运行：bailu plugin install graphify'));
    return;
  }

  const spinner = ora({
    text: '正在导出...',
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    execSync(`graphify export ${format}`, { stdio: 'ignore' });
    spinner.succeed('导出成功');
  } catch (error) {
    spinner.fail('导出失败：' + error.message);
  }
}

/**
 * 注册插件命令
 */
function registerCommands(program) {
  // graphify 命令
  program
    .command('graphify [path]')
    .description('生成知识图谱')
    .action(async (projectPath = '.') => {
      await generate(projectPath);
    });

  // graphify:query 命令
  program
    .command('graphify:query <question>')
    .description('查询知识图谱')
    .action(async (question) => {
      await query(question);
    });

  // graphify:export 命令
  program
    .command('graphify:export [format]')
    .description('导出图谱报告')
    .action(async (format) => {
      await exportGraph(format);
    });
}

module.exports = {
  PLUGIN_INFO,
  isInstalled,
  install,
  generate,
  query,
  exportGraph,
  registerCommands
};
