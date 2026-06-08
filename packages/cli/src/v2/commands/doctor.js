/**
 * @fileoverview 白鹿 CLI v2 doctor 命令
 * 
 * 环境诊断，检查依赖和配置
 * 
 * 检查项目（参考 Comet）：
 * 1. Node.js 版本
 * 2. Git 可用性
 * 3. 平台 CLI 可用性
 * 4. Skills 文件完整性
 * 5. 状态文件有效性
 */

const chalk = require('chalk');
const ora = require('ora');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { readState, isInitialized, getStateFilePath } = require('../state');
const { detectAllPlatforms, getPlatformDefinition } = require('../platforms');

/**
 * 检查结果
 * @typedef {Object} CheckResult
 * @property {string} name - 检查项名称
 * @property {boolean} passed - 是否通过
 * @property {string} message - 详细信息
 * @property {string} [fix] - 修复建议
 */

/**
 * 检查 Node.js 版本
 * @returns {CheckResult}
 */
function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0], 10);
  
  if (major >= 14) {
    return {
      name: 'Node.js',
      passed: true,
      message: `${version} (满足 >= 14.0.0 要求)`
    };
  }
  
  return {
    name: 'Node.js',
    passed: false,
    message: `${version} (需要 >= 14.0.0)`,
    fix: '请升级 Node.js: https://nodejs.org'
  };
}

/**
 * 检查 Git 可用性
 * @returns {CheckResult}
 */
function checkGit() {
  try {
    const version = execSync('git --version', { encoding: 'utf8' }).trim();
    return {
      name: 'Git',
      passed: true,
      message: version
    };
  } catch (error) {
    return {
      name: 'Git',
      passed: false,
      message: '未安装',
      fix: '请安装 Git: https://git-scm.com'
    };
  }
}

/**
 * 检查平台 CLI 可用性
 * @returns {Promise<CheckResult[]>}
 */
async function checkPlatformCLI() {
  const results = [];
  const platforms = await detectAllPlatforms();
  
  for (const platform of platforms) {
    if (platform.detected) {
      const versionStr = platform.version ? ` (v${platform.version})` : '';
      results.push({
        name: platform.name,
        passed: true,
        message: `已安装${versionStr}`
      });
    } else {
      results.push({
        name: platform.name,
        passed: false,
        message: '未检测到',
        fix: `请安装 ${platform.name}`
      });
    }
  }
  
  return results;
}

/**
 * 检查状态文件
 * @param {string} cwd - 工作目录
 * @returns {Promise<CheckResult>}
 */
async function checkStateFile(cwd) {
  const statePath = getStateFilePath(cwd);
  
  if (!(await fs.pathExists(statePath))) {
    return {
      name: '状态文件',
      passed: false,
      message: '.bailu.yaml 不存在',
      fix: '运行 bailu init 初始化'
    };
  }
  
  try {
    const state = await readState(cwd);
    
    if (!state || !state.version) {
      return {
        name: '状态文件',
        passed: false,
        message: '.bailu.yaml 格式无效',
        fix: '运行 bailu init 重新初始化'
      };
    }
    
    return {
      name: '状态文件',
      passed: true,
      message: `.bailu.yaml 有效 (v${state.version})`
    };
  } catch (error) {
    return {
      name: '状态文件',
      passed: false,
      message: `.bailu.yaml 解析失败: ${error.message}`,
      fix: '运行 bailu init 重新初始化'
    };
  }
}

/**
 * 检查 Skills 文件完整性
 * @param {Object} state - 状态对象
 * @param {string} cwd - 工作目录
 * @returns {Promise<CheckResult[]>}
 */
async function checkSkillsIntegrity(state, cwd) {
  const results = [];
  
  if (!state || !state.platforms) {
    return results;
  }
  
  for (const [platformId, platformState] of Object.entries(state.platforms)) {
    if (!platformState.installed) {
      continue;
    }
    
    const platform = getPlatformDefinition(platformId);
    if (!platform) {
      continue;
    }
    
    const skillsDir = path.join(cwd, platform.skillsDir);
    
    if (!(await fs.pathExists(skillsDir))) {
      results.push({
        name: `${platform.name} Skills 目录`,
        passed: false,
        message: `${platform.skillsDir} 不存在`,
        fix: `运行 bailu init 重新安装`
      });
      continue;
    }
    
    // 检查是否有 bailu-* 前缀的 Skills
    const files = await fs.readdir(skillsDir);
    const bailuSkills = files.filter(f => f.startsWith('bailu-'));
    
    if (bailuSkills.length === 0) {
      results.push({
        name: `${platform.name} Skills`,
        passed: false,
        message: '未找到白鹿 Skills',
        fix: '运行 bailu init 重新安装'
      });
    } else {
      results.push({
        name: `${platform.name} Skills`,
        passed: true,
        message: `找到 ${bailuSkills.length} 个白鹿 Skills`
      });
    }
  }
  
  return results;
}

/**
 * 显示检查结果
 * @param {CheckResult[]} results - 检查结果列表
 */
function showResults(results) {
  console.log('');
  console.log(chalk.cyan('  诊断结果'));
  console.log(chalk.gray('  ────────'));
  console.log('');
  
  let allPassed = true;
  const failedChecks = [];
  
  for (const result of results) {
    if (result.passed) {
      console.log(chalk.green(`  ✔ ${result.name}: ${result.message}`));
    } else {
      console.log(chalk.red(`  ✖ ${result.name}: ${result.message}`));
      if (result.fix) {
        console.log(chalk.gray(`    → ${result.fix}`));
      }
      allPassed = false;
      failedChecks.push(result);
    }
  }
  
  console.log('');
  
  if (allPassed) {
    console.log(chalk.green('  ✅ 所有检查通过！环境正常。'));
  } else {
    console.log(chalk.yellow(`  ⚠ ${failedChecks.length} 项检查未通过，请按建议修复。`));
  }
  
  console.log('');
}

/**
 * 以 JSON 格式输出结果
 * @param {CheckResult[]} results - 检查结果列表
 */
function showResultsAsJson(results) {
  const output = {
    passed: results.every(r => r.passed),
    checks: results.map(r => ({
      name: r.name,
      passed: r.passed,
      message: r.message,
      fix: r.fix || null
    }))
  };
  
  console.log(JSON.stringify(output, null, 2));
}

/**
 * 主函数：运行 doctor 命令
 */
async function runDoctor() {
  const cwd = process.cwd();
  
  try {
    console.log('');
    console.log(chalk.cyan('  白鹿工作流诊断'));
    console.log(chalk.gray('  ─────────────'));
    console.log('');
    
    const spinner = ora('正在检查环境...').start();
    
    // 收集所有检查结果
    const results = [];
    
    // 1. Node.js 版本
    results.push(checkNodeVersion());
    
    // 2. Git 可用性
    results.push(checkGit());
    
    // 3. 平台 CLI 可用性
    const platformResults = await checkPlatformCLI();
    results.push(...platformResults);
    
    // 4. 状态文件
    const stateResult = await checkStateFile(cwd);
    results.push(stateResult);
    
    // 5. Skills 文件完整性（如果已初始化）
    const initialized = await isInitialized(cwd);
    if (initialized) {
      const state = await readState(cwd);
      const skillsResults = await checkSkillsIntegrity(state, cwd);
      results.push(...skillsResults);
    }
    
    spinner.stop();
    
    // 显示结果
    const isJson = process.argv.includes('--json');
    
    if (isJson) {
      showResultsAsJson(results);
    } else {
      showResults(results);
    }
    
  } catch (error) {
    console.error(chalk.red(`\n  诊断失败: ${error.message}`));
    process.exit(1);
  }
}

// 导出
module.exports = { runDoctor };
