/**
 * MCP Servers 管理命令
 */

const chalk = require('chalk');
const Table = require('cli-table3');
const McpManager = require('../mcp/manager');

const manager = new McpManager();

/**
 * 列出 MCP Servers
 */
async function list() {
  console.log('');
  console.log(chalk.cyan('🦌 白鹿工作流 - MCP Servers'));
  console.log('');

  const servers = await manager.listServers();

  if (servers.length === 0) {
    console.log(chalk.gray('  暂无已配置的 MCP Servers'));
    console.log('');
    console.log(chalk.white('💡 添加 MCP Server:'));
    console.log(chalk.cyan('  bailu mcp add <name> --command <command>'));
    console.log(chalk.cyan('  bailu mcp add <name> --template <template>'));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan('名称'),
      chalk.cyan('命令'),
      chalk.cyan('状态'),
      chalk.cyan('描述')
    ],
    style: { head: [], border: ['gray'] },
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤'
    }
  });

  for (const server of servers) {
    table.push([
      chalk.white(server.name),
      chalk.gray(server.command),
      server.disabled ? chalk.red('禁用') : chalk.green('启用'),
      chalk.gray(server.description || '-')
    ]);
  }

  console.log(table.toString());
  console.log('');
}

/**
 * 添加 MCP Server
 * @param {string} name - 名称
 * @param {Object} options - 选项
 */
async function add(name, options = {}) {
  console.log('');
  console.log(chalk.cyan(`🦌 添加 MCP Server: ${name}`));
  console.log('');

  try {
    let config;

    if (options.template) {
      // 从模板创建
      config = manager.createFromTemplate(options.template, options);
      console.log(chalk.white(`使用模板: ${options.template}`));
    } else {
      // 手动配置
      config = {
        command: options.command,
        args: options.args ? options.args.split(' ') : [],
        env: options.env ? JSON.parse(options.env) : {},
        description: options.description || ''
      };
    }

    const result = await manager.addServer(name, config);
    console.log(chalk.green(`✅ ${result.name} 已添加`));
  } catch (error) {
    console.error(chalk.red(`❌ 添加失败: ${error.message}`));
  }

  console.log('');
}

/**
 * 删除 MCP Server
 * @param {string} name - 名称
 */
async function remove(name) {
  console.log('');
  console.log(chalk.cyan(`🦌 删除 MCP Server: ${name}`));
  console.log('');

  try {
    const result = await manager.removeServer(name);
    console.log(chalk.green(`✅ ${result.name} 已删除`));
  } catch (error) {
    console.error(chalk.red(`❌ 删除失败: ${error.message}`));
  }

  console.log('');
}

/**
 * 启用/禁用 MCP Server
 * @param {string} name - 名称
 * @param {boolean} enabled - 是否启用
 */
async function toggle(name, enabled) {
  console.log('');
  console.log(chalk.cyan(`🦌 ${enabled ? '启用' : '禁用'} MCP Server: ${name}`));
  console.log('');

  try {
    const result = await manager.toggleServer(name, enabled);
    console.log(chalk.green(`✅ ${result.name} 已${enabled ? '启用' : '禁用'}`));
  } catch (error) {
    console.error(chalk.red(`❌ 操作失败: ${error.message}`));
  }

  console.log('');
}

/**
 * 列出可用模板
 */
async function templates() {
  console.log('');
  console.log(chalk.cyan('🦌 可用 MCP Server 模板'));
  console.log('');

  const templates = manager.getTemplates();

  const table = new Table({
    head: [
      chalk.cyan('模板名称'),
      chalk.cyan('描述')
    ],
    style: { head: [], border: ['gray'] },
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤'
    }
  });

  for (const template of templates) {
    table.push([
      chalk.white(template.name),
      chalk.gray(template.description)
    ]);
  }

  console.log(table.toString());
  console.log('');
  console.log(chalk.white('使用模板:'));
  console.log(chalk.cyan('  bailu mcp add <name> --template <template-name>'));
  console.log('');
}

module.exports = { list, add, remove, toggle, templates };
