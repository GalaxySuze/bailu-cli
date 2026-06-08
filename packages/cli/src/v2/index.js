/**
 * @fileoverview 白鹿 CLI v2 精简版入口
 * 
 * 设计原则：
 * - 最低心智成本：5个命令，1个交互式向导
 * - 状态驱动：用 .bailu.yaml 记录一切
 * - 做减法：暂停非核心功能
 * 
 * 命令清单：
 * - bailu init     交互式初始化（唯一需要记住的命令）
 * - bailu status   查看当前状态和下一步指引
 * - bailu update   更新工作流到最新版本
 * - bailu doctor   环境诊断
 * - bailu reset    重置（清除已安装的配置）
 */

const { Command } = require('commander');
const chalk = require('chalk');
const pkg = require('../../package.json');

/**
 * 创建 CLI 程序实例
 * @returns {import('commander').Command} Commander 程序实例
 */
function createProgram() {
  const program = new Command();

  // 基础配置
  program
    .name('bailu')
    .description('白鹿工作流 CLI - 林深见鹿，优雅前行')
    .version(pkg.version, '-v, --version', '显示版本号')
    .option('--yes', '跳过所有交互确认，使用默认值')
    .option('--overwrite', '覆盖已存在的文件')
    .option('--skip-existing', '跳过已存在的文件')
    .option('--json', '以 JSON 格式输出（CI/CD 友好）')
    .option('--scope <scope>', '安装范围：project 或 global', 'project')
    .option('--lang <lang>', '语言：zh 或 en', 'zh');

  // 注册命令
  registerCommands(program);

  // 全局错误处理
  program.exitOverride();

  return program;
}

/**
 * 注册所有命令
 * @param {import('commander').program} program - Commander 程序实例
 */
function registerCommands(program) {
  // bailu init - 交互式初始化
  program
    .command('init')
    .description('交互式初始化白鹿工作流（唯一需要记住的命令）')
    .option('--source <source>', '工作流来源：npm 或 git', 'npm')
    .option('--workflow <workflow>', '工作流类型：dev 或 ops', 'dev')
    .action(async (options) => {
      const { runInit } = require('./commands/init');
      await runInit(options);
    });

  // bailu status - 查看状态
  program
    .command('status')
    .description('查看当前状态和下一步指引')
    .action(async () => {
      const { runStatus } = require('./commands/status');
      await runStatus();
    });

  // bailu update - 更新工作流
  program
    .command('update')
    .description('更新工作流到最新版本')
    .option('--check', '仅检查更新，不执行')
    .action(async (options) => {
      const { runUpdate } = require('./commands/update');
      await runUpdate(options);
    });

  // bailu doctor - 环境诊断
  program
    .command('doctor')
    .description('环境诊断，检查依赖和配置')
    .action(async () => {
      const { runDoctor } = require('./commands/doctor');
      await runDoctor();
    });

  // bailu reset - 重置
  program
    .command('reset')
    .description('重置配置，清除已安装的工作流')
    .option('--confirm', '确认重置')
    .action(async (options) => {
      const { runReset } = require('./commands/reset');
      await runReset(options);
    });
}

// 导出
module.exports = { createProgram };
