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
 * - bailu goal     无人值守 Goal 协议（init/status/run/install-launchd/...）
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
    .option('--workflow <workflow>', '工作流类型（当前仅支持 dev）', 'dev')
    .action(async (cmdOptions) => {
      const { runInit } = require('./commands/init');
      // 合并全局选项和命令选项
      const globalOptions = program.opts();
      const options = { ...globalOptions, ...cmdOptions };
      await runInit(options);
    });

  // bailu status - 查看状态
  program
    .command('status')
    .description('查看当前状态和下一步指引')
    .action(async (cmdOptions) => {
      const { runStatus } = require('./commands/status');
      // 合并全局选项和命令选项，让 --json 等全局选项能被识别
      const globalOptions = program.opts();
      const options = { ...globalOptions, ...cmdOptions };
      await runStatus(options);
    });

  // bailu update - 更新工作流
  program
    .command('update')
    .description('更新工作流到最新版本')
    .option('--check', '仅检查更新，不执行')
    .option('--yes', '自动重新部署 Skills，CLI 升级仍需确认', false)
    .action(async (cmdOptions) => {
      const { runUpdate } = require('./commands/update');
      // 合并全局选项和命令选项
      const globalOptions = program.opts();
      const options = { ...globalOptions, ...cmdOptions };
      await runUpdate(options);
    });

  // bailu doctor - 环境诊断
  program
    .command('doctor')
    .description('环境诊断，检查依赖和配置')
    .action(async (cmdOptions) => {
      const { runDoctor } = require('./commands/doctor');
      // 合并全局选项和命令选项，让 --json 等全局选项能被识别
      const globalOptions = program.opts();
      const options = { ...globalOptions, ...cmdOptions };
      await runDoctor(options);
    });

  // bailu reset - 重置
  program
    .command('reset')
    .description('重置配置，清除已安装的工作流')
    .option('--confirm', '确认重置')
    .action(async (cmdOptions) => {
      const { runReset } = require('./commands/reset');
      // 合并全局选项和命令选项
      const globalOptions = program.opts();
      const options = { ...globalOptions, ...cmdOptions };
      await runReset(options);
    });

  // bailu goal - 无人值守 Goal 协议（子命令组）
  // 由 commands/goal/index.js 注册其下属 init/status/run/install-launchd/... 等子命令
  const { registerGoalCommands } = require('./commands/goal');
  registerGoalCommands(program);
}

// 导出
module.exports = { createProgram };
