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
        console.log(chalk.green(`✨ WebUI 已启动！`));
        console.log('');
        console.log(chalk.white(`   访问地址: ${chalk.cyan(`http://localhost:${port}`)}`));
        console.log(chalk.white(`   按 Ctrl+C 停止服务`));
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
  .description('初始化团队仓库')
  .option('-b, --branch <branch>', '分支', 'main')
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

// 插件命令
require('../src/commands/plugin').registerCommands(program);

// 注册已安装插件的命令
try {
  const pluginDir = path.join(os.homedir(), '.bailu', 'plugins');
  const installedPath = path.join(pluginDir, 'installed.json');
  
  if (fs.existsSync(installedPath)) {
    const installed = JSON.parse(fs.readFileSync(installedPath, 'utf8'));
    
    for (const pluginName of Object.keys(installed.plugins || {})) {
      try {
        const plugin = require(`@vickzhang/bailu-plugin-${pluginName}`);
        if (plugin.registerCommands) {
          plugin.registerCommands(program);
        }
      } catch (error) {
        // 插件未安装或加载失败，忽略
      }
    }
  }
} catch (error) {
  // 插件目录不存在，忽略
}

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

// 解析命令行参数
program.parse(process.argv);

// 如果没有参数，显示帮助
if (!process.argv.slice(2).length) {
  program.help();
}
