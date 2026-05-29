/**
 * 工作流列表命令（优化版）
 * 
 * 列出可用和已安装的工作流，展示详细信息
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const Table = require('cli-table3');
const boxen = require('boxen');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

/**
 * 工作流详细配置
 * 与 status.js 保持一致
 */
const WORKFLOW_DETAILS = {
  dev: {
    name: '开发工作流',
    icon: '💻',
    tagline: '需求讨论 → 方案文档 → AI Coding → 交付',
    description: '适用于团队开发，将需求从讨论到交付的完整流程标准化',
    scope: 'team',
    components: {
      skills: [
        { name: 'bailu-dev-workflow', desc: '开发工作流主流程' },
        { name: 'bailu-init', desc: '项目初始化配置' }
      ],
      commands: [
        { name: '/bailu-dev', desc: '进入开发工作流' },
        { name: '/bailu-init', desc: '初始化项目配置' }
      ],
      config: [
        { name: 'dev-workflow.yaml', desc: '工作流阶段配置' }
      ]
    },
    stages: [
      { name: '需求澄清', icon: '💬', desc: 'Deep Interview、多方评审' },
      { name: '方案文档', icon: '📄', desc: '技术架构、任务拆分' },
      { name: 'AI Coding', icon: '⌨️', desc: '子Agent执行、代码Review' },
      { name: '交付验收', icon: '✅', desc: '代码审查、知识沉淀' }
    ],
    triggers: ['开发', '代码', 'bug', '重构', 'API', '数据库', '部署', '测试']
  },
  base: {
    name: '基础配置',
    icon: '⚙️',
    tagline: '通用规则 + 模板 + 最佳实践',
    description: '基础工作流配置，包含通用规则和模板，其他工作流依赖此配置',
    scope: 'all',
    components: {
      skills: [],
      commands: [],
      config: [
        { name: 'base.yaml', desc: '全局基础配置' },
        { name: 'templates/', desc: '文档模板集合' }
      ]
    },
    stages: [],
    triggers: []
  }
};

/**
 * 创建表格样式配置
 */
function createTableStyle() {
  return {
    style: { head: [], border: ['gray'] },
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤'
    }
  };
}

/**
 * 获取已安装的工作流
 */
async function getInstalledWorkflows() {
  const installedPath = path.join(BAILU_HOME, 'installed.json');
  let installed = { version: '1.0.0', workflows: {} };

  if (await fs.pathExists(installedPath)) {
    installed = await fs.readJson(installedPath);
  }

  return installed;
}

/**
 * 读取工作流注册表
 */
async function getRegistry() {
  const registryPath = path.join(__dirname, '../workflows/registry.json');
  if (await fs.pathExists(registryPath)) {
    return await fs.readJson(registryPath);
  }
  return {};
}

/**
 * 显示注册表工作流卡片（仅在注册表中、不在 WORKFLOW_DETAILS 中的工作流）
 * @param {string} key - 工作流 key
 * @param {Object} entry - 注册表条目
 */
function showRegistryCard(key, entry) {
  let content = '';
  content += chalk.white.bold(`📥 ${entry.displayName || key}`);
  content += `  ${chalk.blue('📥 可安装')}`;
  content += `  ${chalk.gray('(注册表)')}`  + '\n';
  content += chalk.gray('─'.repeat(50)) + '\n';
  content += chalk.white(`  ${entry.description || ''}\n\n`);
  content += chalk.yellow('  📦 来源：\n');
  content += chalk.gray(`     仓库: ${entry.repo}\n`);
  content += chalk.gray(`     分支: ${entry.branch}\n`);
  content += '\n';
  content += chalk.white('  💡 安装命令：\n');
  content += chalk.cyan(`  bailu install ${key}\n`);

  const card = boxen(content, {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    margin: { top: 0, bottom: 1, left: 0, right: 0 },
    borderStyle: 'round',
    borderColor: 'blue'
  });

  console.log(card);
}

/**
 * 显示工作流详情卡片
 * @param {string} key - 工作流 key
 * @param {Object} workflow - 工作流配置
 * @param {boolean} isInstalled - 是否已安装
 */
function showWorkflowDetail(key, workflow, isInstalled) {
  const statusIcon = isInstalled ? chalk.green('✅ 已安装') : chalk.gray('⬜ 未安装');
  const scopeLabel = workflow.scope === 'team' ? chalk.blue('团队') : 
                     chalk.white('通用');

  let content = '';

  // 标题行
  content += chalk.white.bold(`${workflow.icon} ${workflow.name}`);
  content += chalk.gray(`  [${scopeLabel}]`);
  content += `  ${statusIcon}\n`;
  content += chalk.gray('─'.repeat(50)) + '\n';

  // 描述
  content += chalk.white(`  ${workflow.description}\n\n`);

  // 核心流程
  content += chalk.yellow('  📋 核心流程：\n');
  content += chalk.white(`  ${workflow.tagline}\n\n`);

  // 工作流阶段（如果有）
  if (workflow.stages.length > 0) {
    content += chalk.yellow('  🔄 阶段划分：\n');
    workflow.stages.forEach((stage, index) => {
      const prefix = index === workflow.stages.length - 1 ? '  └─' : '  ├─';
      content += chalk.white(`${prefix} ${stage.icon} ${stage.name}`);
      content += chalk.gray(`  ${stage.desc}\n`);
    });
    content += '\n';
  }

  // 组件清单
  content += chalk.yellow('  📦 包含组件：\n');

  const { skills, commands, config } = workflow.components;
  if (skills.length > 0) {
    content += chalk.white('  ├─ Skills：\n');
    skills.forEach((skill, index) => {
      const prefix = index === skills.length - 1 ? '  │  └─' : '  │  ├─';
      content += chalk.white(`${prefix} ${chalk.cyan(skill.name)}`);
      content += chalk.gray(`  ${skill.desc}\n`);
    });
  }
  if (commands.length > 0) {
    content += chalk.white('  ├─ 命令：\n');
    commands.forEach((cmd, index) => {
      const prefix = index === commands.length - 1 ? '  │  └─' : '  │  ├─';
      content += chalk.white(`${prefix} ${chalk.green(cmd.name)}`);
      content += chalk.gray(`  ${cmd.desc}\n`);
    });
  }
  if (config.length > 0) {
    content += chalk.white('  └─ 配置文件：\n');
    config.forEach((cfg, index) => {
      const prefix = index === config.length - 1 ? '     └─' : '     ├─';
      content += chalk.white(`${prefix} ${chalk.gray(cfg.name)}`);
      content += chalk.gray(`  ${cfg.desc}\n`);
    });
  }

  // 触发词
  if (workflow.triggers.length > 0) {
    content += '\n';
    content += chalk.yellow('  🎯 触发词：\n');
    content += chalk.gray(`  ${workflow.triggers.join('、')}\n`);
  }

  // 安装命令
  content += '\n';
  if (isInstalled) {
    content += chalk.white('  ✅ 已拉取，可使用以下命令部署到 AI 工具：\n');
    content += chalk.cyan('  bailu install\n');
  } else {
    content += chalk.white('  💡 拉取命令：\n');
    content += chalk.cyan(`  bailu pull ${key}\n`);
  }

  const borderColor = isInstalled ? 'green' : 'yellow';

  const card = boxen(content, {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    margin: { top: 0, bottom: 1, left: 0, right: 0 },
    borderStyle: 'round',
    borderColor: borderColor
  });

  console.log(card);
}

/**
 * 显示概览表格
 * @param {Object} installed - 已安装配置
 * @param {Object} registry - 工作流注册表
 */
function showOverviewTable(installed, registry = {}) {
  console.log(chalk.yellow.bold('📊 工作流概览'));
  console.log('');

  const table = new Table({
    head: [
      chalk.cyan('状态'),
      chalk.cyan('工作流'),
      chalk.cyan('类型'),
      chalk.cyan('核心流程'),
      chalk.cyan('组件数')
    ],
    ...createTableStyle()
  });

  for (const [key, workflow] of Object.entries(WORKFLOW_DETAILS)) {
    const isInstalled = !!installed.workflows[key];
    const status = isInstalled ? chalk.green('✅') : chalk.gray('⬜');
    const scope = workflow.scope === 'team' ? chalk.blue('团队') : 
                  chalk.white('通用');

    const componentCount = workflow.components.skills.length + 
                          workflow.components.commands.length + 
                          workflow.components.config.length;

    table.push([
      status,
      `${workflow.icon} ${chalk.white(workflow.name)}`,
      scope,
      chalk.gray(workflow.tagline.substring(0, 25) + '...'),
      chalk.yellow(`${componentCount} 个`)
    ]);
  }

  // 追加注册表中有但 WORKFLOW_DETAILS 中没有的工作流
  for (const [key, entry] of Object.entries(registry)) {
    if (!WORKFLOW_DETAILS[key]) {
      const desc = (entry.description || '').substring(0, 22);
      table.push([
        chalk.blue('📥'),
        `📥 ${chalk.white(entry.displayName || key)}`,
        chalk.gray('git'),
        chalk.gray(desc + (entry.description && entry.description.length > 22 ? '...' : '')),
        chalk.blue('可安装')
      ]);
    }
  }

  console.log(table.toString());
  console.log('');
}

/**
 * 显示使用指引
 */
function showUsageGuide() {
  console.log(chalk.yellow.bold('📖 使用指引'));
  console.log('');

  console.log(chalk.white('  1. 拉取工作流：'));
  console.log(chalk.cyan('     bailu pull dev                  ') + chalk.gray('# 开发工作流（团队）'));
  console.log(chalk.cyan('     bailu pull base                 ') + chalk.gray('# 基础配置（团队）'));
  console.log('');

  console.log(chalk.white('  2. 部署到 AI 工具：'));
  console.log(chalk.cyan('     bailu install                   ') + chalk.gray('# 部署到所有工具'));
  console.log(chalk.cyan('     bailu install qoder             ') + chalk.gray('# 部署到 Qoder'));
  console.log('');

  console.log(chalk.white('  3. 在 AI 工具中使用：'));
  console.log(chalk.gray('     输入触发词（如"开发"、"代码"）即可进入工作流'));
  console.log('');
}

/**
 * 执行工作流列表
 */
async function workflowList() {
  console.log('');
  console.log(chalk.cyan.bold('🦌 白鹿工作流 - 工作流列表'));
  console.log('');

  const [installed, registry] = await Promise.all([
    getInstalledWorkflows(),
    getRegistry()
  ]);

  // 概览表格（含注册表工作流）
  showOverviewTable(installed, registry);

  // 详细信息
  console.log(chalk.yellow.bold('📋 工作流详情'));
  console.log('');

  for (const [key, workflow] of Object.entries(WORKFLOW_DETAILS)) {
    const isInstalled = !!installed.workflows[key];
    showWorkflowDetail(key, workflow, isInstalled);
  }

  // 显示仅在注册表中的工作流（不在 WORKFLOW_DETAILS 中）
  const registryOnlyEntries = Object.entries(registry).filter(([key]) => !WORKFLOW_DETAILS[key]);
  if (registryOnlyEntries.length > 0) {
    console.log(chalk.yellow.bold('📥 注册表可安装工作流'));
    console.log('');
    for (const [key, entry] of registryOnlyEntries) {
      showRegistryCard(key, entry);
    }
  }

  // 使用指引
  showUsageGuide();
}

module.exports = workflowList;
