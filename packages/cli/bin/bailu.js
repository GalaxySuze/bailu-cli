#!/usr/bin/env node

/**
 * 白鹿工作流 CLI 入口
 * 
 * 使用方式：
 *   bailu install dev           # 安装开发工作流到 Claude
 *   bailu uninstall dev         # 卸载开发工作流
 *   bailu status                # 查看状态
 *   bailu serve                 # 启动 WebUI
 */

const { program } = require('commander');
const path = require('path');
const chalk = require('chalk');
const { version } = require('../package.json');
const figlet = require('figlet');
const gradient = require('../src/utils/gradient');
const boxen = require('boxen');

// 设置CLI信息
program
  .name('bailu')
  .description('白鹿工作流 CLI - 林深见鹿，优雅前行')
  .version(version, '-v, --version', '显示版本号')
  .addHelpCommand('help [command]', '显示帮助信息');

// 安装命令（新）
program
  .command('install <workflow>')
  .description('安装工作流到 AI 工具')
  .option('-a, --agent <agent>', '指定 AI 工具 (claude|hanako|codex)', 'claude')
  .option('-s, --source <path>', '指定本地源路径')
  .option('--dry-run', '预览安装内容，不实际安装')
  .action((workflow, options) => {
    require('../src/commands/install')(workflow, options);
  });

// 卸载命令（新）
program
  .command('uninstall <workflow>')
  .description('从 AI 工具卸载工作流')
  .option('--clean', '跳过确认直接卸载')
  .action((workflow, options) => {
    require('../src/commands/uninstall')(workflow, options);
  });

// 状态命令（新）
program
  .command('status')
  .description('查看白鹿工作流状态')
  .action(() => {
    require('../src/commands/status')();
  });

// WebUI 命令（新）
program
  .command('serve')
  .description('启动 WebUI 管理界面')
  .option('-p, --port <port>', '指定端口', '7070')
  .action((options) => {
    const port = parseInt(options.port);
    console.log(chalk.cyan(`🦌 白鹿工作流 - WebUI 管理平台`));
    console.log('');
    
    try {
      const { createServer } = require('../src/webui/server');
      const app = createServer();
      
      app.listen(port, () => {
        console.log('');
        console.log(boxen(
          chalk.green('✨ WebUI 已启动！\n\n') +
          chalk.white(`访问地址: ${chalk.cyan(`http://localhost:${port}`)}\n`) +
          chalk.gray('按 Ctrl+C 停止服务'),
          {
            padding: 1,
            borderStyle: 'round',
            borderColor: 'green',
            title: '🦌 白鹿工作流 WebUI',
            titleAlignment: 'center'
          }
        ));
        console.log('');
      });
    } catch (error) {
      console.error(chalk.red(`启动失败: ${error.message}`));
      console.log('');
      console.log(chalk.yellow('请确保已安装依赖:'));
      console.log(chalk.cyan('  cd packages/cli && npm install express cors'));
    }
  });

// Hooks 命令
const hooks = program.command('hooks').description('Hooks 管理');

hooks
  .command('list')
  .description('列出已安装的 hooks')
  .action(() => {
    require('../src/commands/hooks').list();
  });

hooks
  .command('install <name>')
  .description('安装 hook 到项目')
  .action((name) => {
    require('../src/commands/hooks').install(name);
  });

hooks
  .command('uninstall <name>')
  .description('卸载 hook')
  .action((name) => {
    require('../src/commands/hooks').uninstall(name);
  });

hooks
  .command('status')
  .description('查看项目 hooks 状态')
  .action(() => {
    require('../src/commands/hooks').status();
  });

// MCP 命令
const mcp = program.command('mcp').description('MCP Servers 管理');

mcp
  .command('list')
  .description('列出已配置的 MCP Servers')
  .action(() => {
    require('../src/commands/mcp').list();
  });

mcp
  .command('add <name>')
  .description('添加 MCP Server')
  .option('-c, --command <command>', '命令')
  .option('-a, --args <args>', '参数')
  .option('-e, --env <env>', '环境变量 (JSON)')
  .option('-t, --template <template>', '使用模板')
  .option('-d, --description <description>', '描述')
  .action((name, options) => {
    require('../src/commands/mcp').add(name, options);
  });

mcp
  .command('remove <name>')
  .description('删除 MCP Server')
  .action((name) => {
    require('../src/commands/mcp').remove(name);
  });

mcp
  .command('enable <name>')
  .description('启用 MCP Server')
  .action((name) => {
    require('../src/commands/mcp').toggle(name, true);
  });

mcp
  .command('disable <name>')
  .description('禁用 MCP Server')
  .action((name) => {
    require('../src/commands/mcp').toggle(name, false);
  });

mcp
  .command('templates')
  .description('列出可用模板')
  .action(() => {
    require('../src/commands/mcp').templates();
  });

// 同步命令
const sync = program.command('sync').description('团队同步');

sync
  .command('init <repo>')
  .description('初始化团队仓库（自动检测默认分支）')
  .option('-b, --branch <branch>', '指定分支（可选，不指定则自动检测）')
  .action((repo, options) => {
    require('../src/commands/sync').init(repo, options);
  });

sync
  .command('pull')
  .description('从远程拉取更新')
  .action(() => {
    require('../src/commands/sync').pull();
  });

sync
  .command('push [message]')
  .description('推送本地更改')
  .action((message) => {
    require('../src/commands/sync').push(message);
  });

sync
  .command('diff')
  .description('对比本地和远程差异')
  .action(() => {
    require('../src/commands/sync').diff();
  });

sync
  .command('status')
  .description('查看同步状态')
  .action(() => {
    require('../src/commands/sync').status();
  });

// 审计命令
program
  .command('audit [type] [name]')
  .description('安全审计')
  .action((type, name) => {
    if (type && name) {
      require('../src/commands/audit').auditComponent(type, name);
    } else {
      require('../src/commands/audit').audit();
    }
  });

// 初始化命令
program
  .command('init')
  .description('初始化白鹿工作流配置中心')
  .action(() => {
    console.log(chalk.cyan('正在初始化白鹿工作流...'));
    require('../src/commands/init')();
  });

// 工作流管理命令
const workflow = program.command('workflow').description('工作流管理');

workflow
  .command('list')
  .description('列出可用工作流')
  .action(() => {
    require('../src/commands/workflow-list')();
  });

workflow
  .command('install <name>')
  .description('安装工作流')
  .action((name) => {
    require('../src/commands/workflow-install')(name);
  });

workflow
  .command('uninstall <name>')
  .description('卸载工作流')
  .action((name) => {
    require('../src/commands/workflow-uninstall')(name);
  });

// 工具管理命令
const tool = program.command('tool').description('AI工具管理');

tool
  .command('install [tools...]')
  .description('安装白鹿工作流到AI工具')
  .action((tools) => {
    require('../src/commands/tool-install')(tools);
  });

tool
  .command('uninstall [tools...]')
  .description('从AI工具卸载白鹿工作流')
  .action((tools) => {
    require('../src/commands/tool-uninstall')(tools);
  });

tool
  .command('status')
  .description('查看工具安装状态')
  .action(() => {
    require('../src/commands/tool-status')();
  });

// 状态命令
program
  .command('status')
  .description('查看白鹿工作流状态')
  .action(() => {
    require('../src/commands/status')();
  });

// 配置命令
program
  .command('config')
  .description('打开配置目录')
  .action(() => {
    require('../src/commands/config')();
  });

// 推荐工具命令
require('../src/commands/recommend').registerCommands(program);

// 发布命令（仅开发环境可用）
if (process.env.BAILU_DEV === 'true' || process.argv.includes('--dev')) {
  program
    .command('publish')
    .description('发布npm包（仅开发者使用）')
    .option('--dry-run', '预览发布内容，不实际发布')
    .option('--all', '发布所有包（忽略配置）')
    .action((options) => {
      require('../src/dev/publish')({
        dryRun: options.dryRun || false,
        all: options.all || false
      });
    });
}

// 帮助信息
program
  .command('help')
  .description('显示帮助信息')
  .action(() => {
    program.help();
  });

// 文档命令
program
  .command('docs')
  .description('打开白鹿工作流文档')
  .option('-l, --local', '显示本地文档路径')
  .action(async (options) => {
    if (options.local) {
      const docsPath = path.join(__dirname, '../../../docs');
      console.log('\n  📚 本地文档路径：');
      console.log(`  ${docsPath}\n`);
    } else {
      const url = 'https://vickzhang.github.io/bailu-cli/';
      console.log('\n  🦌 正在打开白鹿工作流文档...\n');
      console.log(`  ${url}\n`);
      try {
        await require('open')(url);
      } catch (e) {
        console.log('  请手动打开上述链接');
      }
    }
  });

// 如果没有参数，展示仪表盘；否则解析命令行
if (!process.argv.slice(2).length) {
  const fs = require('fs-extra');
  const os = require('os');
  const Table = require('cli-table3');

  const BAILU_HOME = path.join(os.homedir(), '.bailu');

  const TABLE_CHARS = {
    'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
    'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
    'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
    'right': '│', 'right-mid': '┤'
  };

  (async () => {
    // ── Banner ──────────────────────────────────────────────
    const banner = figlet.textSync('Bailu  CLI', { font: 'Small' });
    console.log('');
    console.log(gradient.pastel.multiline(banner));
    console.log(chalk.cyan('  🦌 白鹿工作流 · 林深见鹿，优雅前行'));
    console.log('');

    // ── 系统信息 ─────────────────────────────────────────────
    console.log(boxen(
      chalk.white(`版本      `) + chalk.cyan(version) + '\n' +
      chalk.white(`配置中心  `) + chalk.gray(BAILU_HOME) + '\n' +
      chalk.white(`Node      `) + chalk.gray(process.version),
      {
        padding: { top: 0, bottom: 0, left: 2, right: 4 },
        margin: { top: 0, bottom: 1, left: 2, right: 0 },
        borderStyle: 'round',
        borderColor: 'cyan',
        title: '  系统信息  ',
        titleAlignment: 'left'
      }
    ));

    // ── AI 工具状态 ──────────────────────────────────────────
    const AI_TOOLS = [
      { name: 'Claude Code', icon: '🤖', dir: path.join(os.homedir(), '.claude') },
      { name: 'Codex',       icon: '🔮', dir: path.join(os.homedir(), '.codex') },
      { name: 'Cursor',      icon: '🖱️', dir: path.join(os.homedir(), '.cursor') },
      { name: 'Windsurf',    icon: '🌊', dir: path.join(os.homedir(), '.windsurf') },
    ];

    const toolTable = new Table({
      head: [chalk.cyan('工具'), chalk.cyan('状态')],
      style: { head: [], border: ['gray'] },
      chars: TABLE_CHARS
    });

    for (const tool of AI_TOOLS) {
      const installed = fs.existsSync(tool.dir);
      toolTable.push([
        `${tool.icon}  ${chalk.white(tool.name)}`,
        installed ? chalk.green('✅ 已检测') : chalk.gray('○  未检测')
      ]);
    }

    console.log(chalk.yellow.bold('  🔧 AI 工具'));
    console.log(toolTable.toString());
    console.log('');

    // ── 已安装工作流 ─────────────────────────────────────────
    console.log(chalk.yellow.bold('  📦 已安装工作流'));
    const installedPath = path.join(BAILU_HOME, 'installed.json');
    let hasWorkflow = false;
    if (fs.existsSync(installedPath)) {
      try {
        const { workflows } = JSON.parse(fs.readFileSync(installedPath, 'utf8'));
        const entries = Object.entries(workflows || {});
        if (entries.length > 0) {
          hasWorkflow = true;
          for (const [, info] of entries) {
            const name = info.displayName || info.name || '-';
            const ver  = info.version ? chalk.gray(`v${info.version}`) : '';
            const agent = chalk.cyan(info.target_agent || 'claude');
            console.log(`  ${chalk.green('▸')}  ${chalk.white(name)} ${ver} → ${agent}`);
          }
        }
      } catch (e) { /* ignore */ }
    }
    if (!hasWorkflow) {
      console.log(chalk.gray('  暂无已安装工作流  ·  使用 bailu install <name> 安装'));
    }
    console.log('');

    // ── 快捷命令 ─────────────────────────────────────────────
    console.log(chalk.yellow.bold('  💡 快捷命令'));
    const cmds = [
      ['bailu status',              '查看详细状态（工作流 + 组件统计）'],
      ['bailu install <workflow>',   '安装工作流到 AI 工具'],
      ['bailu recommend list',       '浏览推荐 AI 工具'],
      ['bailu serve',                '启动 WebUI 管理平台'],
      ['bailu sync pull',            '拉取团队配置同步'],
      ['bailu --help',               '查看完整命令帮助'],
    ];
    for (const [cmd, desc] of cmds) {
      console.log(`  ${chalk.cyan(cmd.padEnd(32))}${chalk.gray(desc)}`);
    }
    console.log('');
  })();
} else {
  // 解析命令行参数
  program.parse(process.argv);
}
