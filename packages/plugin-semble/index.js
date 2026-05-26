/**
 * @vickzhang/bailu-plugin-semble
 * 
 * 白鹿工作流插件 - Semble 语义代码搜索引擎
 * 
 * 功能：
 * - 语义搜索代码，比 grep 节省 98% token
 * - 毫秒级响应，CPU 运行无需 GPU
 * - 支持自然语言查询
 * - 零外部依赖，无需 API key
 * 
 * 使用方式：
 *   bailu plugin install semble
 *   bailu search "认证流程"
 *   bailu search "save_pretrained" --top-k 10
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
  name: 'semble',
  displayName: 'Semble 语义搜索',
  version: '1.0.0',
  description: '语义代码搜索引擎，比 grep 节省 98% token，毫秒级响应',
  category: '代码搜索',
  
  // 依赖的 Python 包
  pythonPackages: ['semble'],
  
  // 支持的命令
  commands: [
    {
      name: 'search',
      description: '语义搜索代码',
      usage: 'bailu search "<query>" [path]',
      examples: [
        'bailu search "认证流程"',
        'bailu search "save_pretrained" --top-k 10',
        'bailu search "数据库连接" --content docs'
      ]
    },
    {
      name: 'index',
      description: '创建代码索引',
      usage: 'bailu index [path] [-o output]',
      examples: [
        'bailu index .',
        'bailu index . -o cached_index'
      ]
    },
    {
      name: 'find-related',
      description: '查找相关代码',
      usage: 'bailu find-related <file> <line>',
      examples: [
        'bailu find-related src/auth.py 42'
      ]
    }
  ],
  
  // 适用场景
  useCases: [
    '日常开发中快速定位代码',
    '理解陌生代码库的实现',
    '查找某个功能的实现位置',
    '减少 grep 带来的 token 消耗'
  ],
  
  // 优缺点
  pros: [
    '比 grep 节省 98% token',
    '毫秒级响应，极快',
    'CPU 运行，无需 GPU',
    '零外部依赖，无需 API key',
    '支持自然语言查询'
  ],
  
  cons: [
    '需要 Python 环境',
    '索引需要定期更新',
    '不适合精确字符串匹配'
  ]
};

/**
 * 检查 semble 是否已安装
 */
function isInstalled() {
  try {
    execSync('semble --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 安装 semble
 */
async function install() {
  const spinner = ora({
    text: '正在安装 semble...',
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    execSync('pip install semble', { stdio: 'ignore' });
    spinner.succeed('semble 安装成功');
    return true;
  } catch (error) {
    spinner.fail('semble 安装失败');
    console.log(chalk.yellow('请手动安装：pip install semble'));
    return false;
  }
}

/**
 * 创建代码索引
 */
async function createIndex(projectPath = '.', outputPath) {
  if (!isInstalled()) {
    console.log(chalk.yellow('semble 未安装，正在安装...'));
    const installed = await install();
    if (!installed) return;
  }

  const spinner = ora({
    text: '正在创建索引...',
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    const outputArg = outputPath ? `-o ${outputPath}` : '';
    execSync(`semble index ${projectPath} ${outputArg}`, { stdio: 'ignore' });
    spinner.succeed('索引创建成功');
    
    console.log('');
    console.log(boxen(
      chalk.white('索引已创建，现在可以使用语义搜索：\n\n') +
      chalk.cyan('bailu search "认证流程"\n') +
      chalk.cyan('bailu search "save_pretrained" --top-k 10'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
        title: '✅ 索引完成',
        titleAlignment: 'center'
      }
    ));
  } catch (error) {
    spinner.fail('索引创建失败：' + error.message);
  }
}

/**
 * 语义搜索代码
 */
async function search(query, options = {}) {
  if (!isInstalled()) {
    console.log(chalk.red('semble 未安装，请先运行：bailu plugin install semble'));
    return;
  }

  const { path = '.', topK, content, index } = options;
  
  const spinner = ora({
    text: '正在搜索...',
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    let cmd = `semble search "${query}" ${path}`;
    if (topK) cmd += ` --top-k ${topK}`;
    if (content) cmd += ` --content ${content}`;
    if (index) cmd += ` --index ${index}`;

    const result = execSync(cmd, { encoding: 'utf8' });
    spinner.succeed('搜索完成');
    console.log('');
    console.log(result);
  } catch (error) {
    spinner.fail('搜索失败：' + error.message);
  }
}

/**
 * 查找相关代码
 */
async function findRelated(filePath, line, projectPath = '.') {
  if (!isInstalled()) {
    console.log(chalk.red('semble 未安装，请先运行：bailu plugin install semble'));
    return;
  }

  const spinner = ora({
    text: '正在查找相关代码...',
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    const result = execSync(`semble find-related ${filePath} ${line} ${projectPath}`, { encoding: 'utf8' });
    spinner.succeed('查找完成');
    console.log('');
    console.log(result);
  } catch (error) {
    spinner.fail('查找失败：' + error.message);
  }
}

/**
 * 注册插件命令
 */
function registerCommands(program) {
  // search 命令
  program
    .command('search <query>')
    .description('语义搜索代码')
    .option('-p, --path <path>', '搜索路径', '.')
    .option('-k, --top-k <n>', '返回结果数量', '5')
    .option('-c, --content <type>', '内容类型 (code|docs|config|all)', 'code')
    .option('-i, --index <path>', '使用指定索引')
    .action(async (query, options) => {
      await search(query, options);
    });

  // index 命令
  program
    .command('index [path]')
    .description('创建代码索引')
    .option('-o, --output <path>', '输出路径')
    .action(async (projectPath = '.', options) => {
      await createIndex(projectPath, options.output);
    });

  // find-related 命令
  program
    .command('find-related <file> <line>')
    .description('查找相关代码')
    .option('-p, --path <path>', '项目路径', '.')
    .action(async (file, line, options) => {
      await findRelated(file, line, options.path);
    });
}

module.exports = {
  PLUGIN_INFO,
  isInstalled,
  install,
  createIndex,
  search,
  findRelated,
  registerCommands
};
