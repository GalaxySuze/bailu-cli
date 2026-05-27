/**
 * AI工具推荐命令
 * 
 * 查看精选AI工具列表，支持提交社区推荐
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const ora = require('ora');
const boxen = require('boxen');
const Table = require('cli-table3');
const inquirer = require('inquirer');
const gradient = require('../utils/gradient');

const BAILU_HOME = path.join(os.homedir(), '.bailu');
const COMMUNITY_TOOLS_FILE = path.join(BAILU_HOME, 'community-tools.json');
const BUILTIN_TOOLS_FILE = path.join(__dirname, '../data/recommended-tools.json');

/**
 * 读取内置精选工具列表
 */
async function getBuiltinTools() {
  try {
    return await fs.readJson(BUILTIN_TOOLS_FILE);
  } catch (e) {
    return [];
  }
}

/**
 * 读取社区推荐工具列表
 */
async function getCommunityTools() {
  try {
    if (await fs.pathExists(COMMUNITY_TOOLS_FILE)) {
      return await fs.readJson(COMMUNITY_TOOLS_FILE);
    }
  } catch (e) {}
  return [];
}

/**
 * 保存社区推荐工具
 */
async function saveCommunityTools(tools) {
  await fs.ensureDir(BAILU_HOME);
  await fs.writeJson(COMMUNITY_TOOLS_FILE, tools, { spaces: 2 });
}

/**
 * 列出所有推荐工具
 */
async function listTools() {
  console.log('');
  console.log(gradient.pastel('  🦌 白鹿工作流 — AI工具推荐'));
  console.log('');

  const builtin = await getBuiltinTools();
  const community = await getCommunityTools();

  // 展示内置精选
  console.log(chalk.yellow.bold('⭐ 精选AI工具'));
  console.log('');

  const table = new Table({
    head: [
      chalk.cyan('工具名称'),
      chalk.cyan('类型'),
      chalk.cyan('用户群体'),
      chalk.cyan('下载地址')
    ],
    style: { head: [], border: ['gray'] },
    colWidths: [18, 22, 14, 36],
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤'
    },
    wordWrap: true
  });

  for (const tool of builtin) {
    table.push([
      chalk.white(tool.name),
      chalk.gray(tool.type),
      chalk.gray(tool.audience),
      chalk.cyan(tool.download)
    ]);
  }

  console.log(table.toString());

  // 展示社区推荐
  if (community.length > 0) {
    console.log('');
    console.log(chalk.yellow.bold('🌐 社区推荐'));
    console.log('');

    const comTable = new Table({
      head: [
        chalk.cyan('工具名称'),
        chalk.cyan('类型'),
        chalk.cyan('用户群体'),
        chalk.cyan('提交时间')
      ],
      style: { head: [], border: ['gray'] },
      chars: {
        'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
        'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
        'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
        'right': '│', 'right-mid': '┤'
      }
    });

    for (const tool of community) {
      const date = tool.submitted_at ? new Date(tool.submitted_at).toLocaleDateString() : '-';
      comTable.push([
        chalk.white(tool.name),
        chalk.gray(tool.type),
        chalk.gray(tool.audience),
        chalk.gray(date)
      ]);
    }

    console.log(comTable.toString());
  }

  console.log('');
  console.log(chalk.gray('💡 使用 bailu recommend info <工具名> 查看详情'));
  console.log(chalk.gray('   使用 bailu recommend add 提交推荐'));
  console.log('');
}

/**
 * 查看工具详情
 */
async function infoTool(toolName) {
  const builtin = await getBuiltinTools();
  const community = await getCommunityTools();
  const allTools = [...builtin, ...community];

  const tool = allTools.find(t => t.name.toLowerCase() === toolName.toLowerCase());

  if (!tool) {
    console.log('');
    console.log(chalk.red(`❌ 未找到工具: ${toolName}`));
    console.log(chalk.gray('使用 bailu recommend list 查看所有工具'));
    console.log('');
    return;
  }

  const tags = (tool.tags || []).map(t => chalk.cyan(`#${t}`)).join('  ');

  console.log('');
  console.log(boxen(
    chalk.white.bold(tool.name) + '  ' + chalk.gray(tool.type) + '\n\n' +
    chalk.white(`📝 ${tool.description}\n\n`) +
    chalk.yellow('用户群体：') + chalk.white(tool.audience) + '\n' +
    chalk.yellow('下载地址：') + chalk.cyan(tool.download) + '\n' +
    chalk.yellow('文档地址：') + chalk.cyan(tool.docs) + '\n\n' +
    chalk.yellow('标签：') + tags,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      title: '🔍 工具详情',
      titleAlignment: 'center'
    }
  ));
}

/**
 * 交互式提交工具推荐
 */
async function addTool() {
  console.log('');
  console.log(gradient.pastel('  🦌 白鹿工作流 — 提交工具推荐'));
  console.log('');
  console.log(chalk.gray('  填写以下信息，推荐将保存到本地 ~/.bailu/community-tools.json'));
  console.log('');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: '工具名称：',
      validate: v => v.trim() ? true : '工具名称不能为空'
    },
    {
      type: 'list',
      name: 'type',
      message: '工具类型：',
      choices: [
        'AI Coding Agent',
        'AI Code Editor',
        'AI Coding Extension',
        'AI Coding Assistant',
        'AI Agentic IDE',
        'Other'
      ]
    },
    {
      type: 'input',
      name: 'audience',
      message: '用户群体（如：开发者、AI研究者）：',
      default: '开发者'
    },
    {
      type: 'input',
      name: 'download',
      message: '下载地址（URL）：',
      validate: v => v.trim() ? true : '下载地址不能为空'
    },
    {
      type: 'input',
      name: 'docs',
      message: '文档地址（URL，可选）：',
      default: ''
    },
    {
      type: 'input',
      name: 'description',
      message: '工具说明（一句话描述）：',
      validate: v => v.trim() ? true : '说明不能为空'
    },
    {
      type: 'input',
      name: 'tags',
      message: '标签（逗号分隔，如：coding,agent）：',
      default: 'coding'
    }
  ]);

  const spinner = ora('正在保存推荐...').start();

  try {
    const community = await getCommunityTools();

    // 检查是否已存在
    const exists = community.find(t => t.name.toLowerCase() === answers.name.toLowerCase());
    if (exists) {
      spinner.fail(`工具 "${answers.name}" 已在推荐列表中`);
      return;
    }

    const tool = {
      name: answers.name.trim(),
      type: answers.type,
      audience: answers.audience.trim(),
      download: answers.download.trim(),
      docs: answers.docs.trim() || answers.download.trim(),
      description: answers.description.trim(),
      tags: answers.tags.split(',').map(t => t.trim()).filter(Boolean),
      submitted_at: new Date().toISOString(),
      source: 'community'
    };

    community.push(tool);
    await saveCommunityTools(community);

    spinner.succeed('推荐已保存！');

    console.log('');
    console.log(boxen(
      chalk.white(`${tool.name} 已添加到推荐列表\n\n`) +
      chalk.gray(`保存位置: ${COMMUNITY_TOOLS_FILE}\n`) +
      chalk.gray('使用 bailu recommend list 查看所有推荐\n') +
      chalk.gray('使用 bailu serve 在 WebUI 中浏览推荐工具'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
        title: '✅ 提交成功',
        titleAlignment: 'center'
      }
    ));
  } catch (error) {
    spinner.fail(`保存失败: ${error.message}`);
  }
}

/**
 * 注册推荐工具相关命令
 */
function registerCommands(program) {
  const recommend = program
    .command('recommend')
    .description('AI工具推荐 - 查看和分享优质AI工具');

  recommend
    .command('list')
    .description('查看推荐AI工具列表')
    .action(async () => {
      await listTools();
    });

  recommend
    .command('info <name>')
    .description('查看工具详情')
    .action(async (name) => {
      await infoTool(name);
    });

  recommend
    .command('add')
    .description('提交工具推荐（保存到本地）')
    .action(async () => {
      await addTool();
    });
}

module.exports = {
  registerCommands,
  getBuiltinTools,
  getCommunityTools,
  BUILTIN_TOOLS_FILE,
  COMMUNITY_TOOLS_FILE
};
