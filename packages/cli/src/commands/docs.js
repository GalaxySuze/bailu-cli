/**
 * @fileoverview 白鹿工作流 CLI - docs 命令
 * 打开在线文档或显示本地文档路径
 */

const { program } = require('commander');
const open = require('open');

/**
 * 注册 docs 命令
 * @param {import('commander').Command} program - Commander 程序实例
 */
function registerDocsCommand(program) {
  program
    .command('docs')
    .description('打开白鹿工作流文档')
    .option('-l, --local', '显示本地文档路径')
    .option('-o, --online', '打开在线文档（默认）')
    .action(async (options) => {
      if (options.local) {
        // 显示本地文档路径
        const path = require('path');
        const docsPath = path.join(__dirname, '../../../docs');
        console.log('\n  📚 本地文档路径：');
        console.log(`  ${docsPath}\n`);
      } else {
        // 打开在线文档
        const url = 'https://vickzhang.github.io/bailu-cli/';
        console.log('\n  🦌 正在打开白鹿工作流文档...\n');
        console.log(`  ${url}\n`);
        await open(url);
      }
    });
}

module.exports = { registerDocsCommand };
