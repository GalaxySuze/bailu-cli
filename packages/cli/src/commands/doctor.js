/**
 * bailu doctor — 环境诊断命令
 *
 * 检查白鹿工作流运行环境的健壮性，输出诊断报告和修复建议。
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const chalk = require('chalk');
const Table = require('cli-table3');
const boxen = require('boxen');
const figlet = require('figlet');
const gradient = require('../utils/gradient');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

/**
 * 诊断检查项定义
 * @typedef {Object} CheckResult
 * @property {string} name - 检查项名称
 * @property {'pass'|'warn'|'fail'|'info'} status - 状态
 * @property {string} detail - 详细信息
 * @property {string} [fix] - 修复建议
 */

/**
 * 检查 Node.js 版本
 * @returns {CheckResult}
 */
function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0], 10);
  if (major >= 18) {
    return { name: 'Node.js 版本', status: 'pass', detail: version };
  }
  return {
    name: 'Node.js 版本',
    status: 'fail',
    detail: `${version}（需要 >= 18.0.0）`,
    fix: '升级 Node.js：brew upgrade node 或 https://nodejs.org'
  };
}

/**
 * 检查 CLI 版本
 * @returns {Promise<CheckResult>}
 */
async function checkCliVersion() {
  try {
    const cliPkgPath = path.resolve(__dirname, '../../package.json');
    const current = require(cliPkgPath).version;
    try {
      const latest = execSync('npm view @vickzhang/bailu-cli version', {
        timeout: 8000,
        stdio: ['pipe', 'pipe', 'pipe']
      }).toString().trim();
      if (current === latest) {
        return { name: 'CLI 版本', status: 'pass', detail: `v${current}（最新）` };
      }
      return {
        name: 'CLI 版本',
        status: 'warn',
        detail: `v${current} → 最新 v${latest}`,
        fix: 'npm update -g @vickzhang/bailu-cli'
      };
    } catch {
      return { name: 'CLI 版本', status: 'info', detail: `v${current}（无法连接 npm registry）` };
    }
  } catch {
    return { name: 'CLI 版本', status: 'fail', detail: '无法读取 package.json' };
  }
}

/**
 * 检查 ~/.bailu 目录
 * @returns {CheckResult}
 */
function checkBailuHome() {
  if (!fs.existsSync(BAILU_HOME)) {
    return {
      name: '~/.bailu 目录',
      status: 'fail',
      detail: '目录不存在',
      fix: '运行 bailu init 初始化'
    };
  }
  try {
    fs.accessSync(BAILU_HOME, fs.constants.R_OK | fs.constants.W_OK);
    return { name: '~/.bailu 目录', status: 'pass', detail: '存在且可读写' };
  } catch {
    return {
      name: '~/.bailu 目录',
      status: 'fail',
      detail: '目录存在但无读写权限',
      fix: `chmod 755 ${BAILU_HOME}`
    };
  }
}

/**
 * 检查 Git 可用性
 * @returns {CheckResult}
 */
function checkGit() {
  try {
    const version = execSync('git --version', { stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
    return { name: 'Git', status: 'pass', detail: version };
  } catch {
    return {
      name: 'Git',
      status: 'fail',
      detail: '未安装',
      fix: 'macOS: brew install git / Linux: apt install git'
    };
  }
}

/**
 * 检查 Git 用户名
 * @returns {CheckResult}
 */
function checkGitUser() {
  try {
    const name = execSync('git config user.name', { stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
    if (name) {
      return { name: 'Git 用户名', status: 'pass', detail: name };
    }
    return {
      name: 'Git 用户名',
      status: 'warn',
      detail: '未配置',
      fix: 'git config --global user.name "你的姓名"'
    };
  } catch {
    return {
      name: 'Git 用户名',
      status: 'warn',
      detail: '未配置',
      fix: 'git config --global user.name "你的姓名"'
    };
  }
}

/**
 * 检查 Git 凭据
 * @returns {Promise<CheckResult>}
 */
async function checkCredentials() {
  try {
    const { loadCredentials } = require('../utils/credentials');
    const creds = await loadCredentials();
    if (creds && creds.username) {
      return { name: 'Git 凭据', status: 'pass', detail: `已配置 (${creds.username})` };
    }
    return { name: 'Git 凭据', status: 'info', detail: '未配置（按需输入）' };
  } catch {
    return { name: 'Git 凭据', status: 'info', detail: '未配置（按需输入）' };
  }
}

/**
 * 检查已安装工作流
 * @returns {Promise<CheckResult>}
 */
async function checkWorkflows() {
  const installedPath = path.join(BAILU_HOME, 'installed.json');
  if (!fs.existsSync(installedPath)) {
    return { name: '已安装工作流', status: 'warn', detail: '无安装记录', fix: '运行 bailu install dev' };
  }
  try {
    const installed = await fs.readJson(installedPath);
    const names = Object.keys(installed);
    if (names.length === 0) {
      return { name: '已安装工作流', status: 'warn', detail: '无安装记录', fix: '运行 bailu install dev' };
    }
    const summary = names.map(n => {
      const v = installed[n].version || '未知';
      const targets = (installed[n].target_agents || []).join(', ');
      return `${n}@${v} → ${targets || '未记录'}`;
    }).join('; ');
    return { name: '已安装工作流', status: 'pass', detail: summary };
  } catch {
    return {
      name: '已安装工作流',
      status: 'warn',
      detail: 'installed.json 格式异常',
      fix: '删除 ~/.bailu/installed.json 后重新安装'
    };
  }
}

/**
 * 检查 AI 工具
 * @returns {CheckResult}
 */
function checkTools() {
  const { getToolsStatusList } = require('../config/tools');
  const tools = Object.values(getToolsStatusList());
  const installed = tools.filter(t => t.installed);
  if (installed.length === 0) {
    return { name: 'AI 工具', status: 'warn', detail: '未检测到已安装的 AI 工具', fix: '安装 Claude Code / Qoder / Trae 等工具' };
  }
  const detail = installed.map(t => `${t.emoji} ${t.name}`).join(', ');
  return { name: 'AI 工具', status: 'pass', detail: `${installed.length} 个: ${detail}` };
}

/**
 * 检查组件完整性
 * @returns {Promise<CheckResult>}
 */
async function checkComponentIntegrity() {
  const { getAllTools, getToolConfig } = require('../config/tools');
  const issues = [];

  for (const [key, tool] of Object.entries(getAllTools())) {
    if (!tool.installed) continue;
    const userDir = tool.getUserDir(os.homedir());
    const componentDirs = ['skills', 'commands', 'agents', 'hooks'];
    for (const dir of componentDirs) {
      const fullPath = path.join(userDir, dir);
      if (fs.existsSync(fullPath)) {
        try {
          const items = fs.readdirSync(fullPath);
          if (items.length === 0) {
            issues.push(`${tool.name}/${dir} 为空`);
          }
        } catch {
          issues.push(`${tool.name}/${dir} 无法读取`);
        }
      }
    }
  }

  if (issues.length === 0) {
    return { name: '组件完整性', status: 'pass', detail: '所有已安装工具的组件目录正常' };
  }
  return {
    name: '组件完整性',
    status: 'warn',
    detail: issues.join('; '),
    fix: '运行 bailu install dev 重新安装'
  };
}

/**
 * 检查 OpenSpec CLI
 * @returns {CheckResult}
 */
function checkOpenSpec() {
  try {
    const version = execSync('openspec --version', { stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
    return { name: 'OpenSpec CLI', status: 'pass', detail: version };
  } catch {
    return { name: 'OpenSpec CLI', status: 'info', detail: '未安装（D2 将使用 AI 模式，效果一致）' };
  }
}

/**
 * 主入口
 */
async function doctor() {
  const banner = figlet.textSync('Bailu Doctor', { font: 'Small' });
  console.log(gradient.pastel.multiline(banner));
  console.log('');

  /** @type {CheckResult[]} */
  const results = [];

  // 串行执行检查项（部分有异步操作）
  results.push(checkNodeVersion());
  results.push(await checkCliVersion());
  results.push(checkBailuHome());
  results.push(checkGit());
  results.push(checkGitUser());
  results.push(await checkCredentials());
  results.push(await checkWorkflows());
  results.push(checkTools());
  results.push(await checkComponentIntegrity());
  results.push(checkOpenSpec());

  // 构建结果表格
  const table = new Table({
    head: [
      chalk.bold('检查项'),
      chalk.bold('状态'),
      chalk.bold('详情'),
      chalk.bold('修复建议')
    ],
    colWidths: [18, 8, 42, 36],
    wordWrap: true
  });

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;
  let infoCount = 0;

  for (const r of results) {
    let statusStr;
    switch (r.status) {
      case 'pass':
        statusStr = chalk.green('✓ 通过');
        passCount++;
        break;
      case 'warn':
        statusStr = chalk.yellow('⚠ 警告');
        warnCount++;
        break;
      case 'fail':
        statusStr = chalk.red('✗ 失败');
        failCount++;
        break;
      case 'info':
        statusStr = chalk.cyan('ℹ 信息');
        infoCount++;
        break;
    }
    table.push([r.name, statusStr, r.detail, r.fix || '—']);
  }

  console.log(table.toString());
  console.log('');

  // 汇总
  const summaryParts = [];
  if (passCount > 0) summaryParts.push(chalk.green(`${passCount} 通过`));
  if (warnCount > 0) summaryParts.push(chalk.yellow(`${warnCount} 警告`));
  if (failCount > 0) summaryParts.push(chalk.red(`${failCount} 失败`));
  if (infoCount > 0) summaryParts.push(chalk.cyan(`${infoCount} 信息`));

  const summary = `诊断完成: ${summaryParts.join(' / ')}`;
  const borderColor = failCount > 0 ? '#e74c3c' : warnCount > 0 ? '#f39c12' : '#2ecc71';

  console.log(boxen(summary, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor
  }));

  // 退出码
  if (failCount > 0) {
    process.exitCode = 1;
  }
}

module.exports = doctor;
