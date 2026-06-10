/**
 * @fileoverview 白鹿 CLI v2 reset 命令
 * 
 * 重置配置，清除已安装的工作流
 * 
 * 安全设计：
 * - 需要用户确认
 * - 备份重要文件
 * - 只删除白鹿相关文件
 */

const chalk = require('chalk');
const ora = require('ora');
const { confirm } = require('@inquirer/prompts');
const fs = require('fs-extra');
const path = require('path');
const { readState, clearState, isInitialized, getStateFilePath } = require('../state');
const { getPlatformDefinition } = require('../platforms');

/**
 * 备份目录名
 */
const BACKUP_DIR = '.bailu-backup';

/**
 * 获取备份目录路径
 * @param {string} cwd - 工作目录
 * @returns {string} 备份目录绝对路径
 */
function getBackupDir(cwd) {
  return path.join(cwd, BACKUP_DIR);
}

/**
 * 备份文件
 * @param {string[]} files - 要备份的文件列表
 * @param {string} cwd - 工作目录
 * @returns {Promise<boolean>} 是否成功
 */
async function backupFiles(files, cwd) {
  const backupDir = getBackupDir(cwd);
  
  try {
    await fs.ensureDir(backupDir);
    
    for (const file of files) {
      const src = path.join(cwd, file);
      const dest = path.join(backupDir, file);
      
      if (await fs.pathExists(src)) {
        await fs.ensureDir(path.dirname(dest));
        await fs.copy(src, dest);
      }
    }
    
    return true;
  } catch (error) {
    console.error(chalk.red(`  备份失败: ${error.message}`));
    return false;
  }
}

/**
 * 收集要删除的文件
 * @param {Object} state - 状态对象
 * @param {string} cwd - 工作目录
 * @returns {Promise<string[]>} 要删除的文件列表
 */
async function collectFilesToRemove(state, cwd) {
  const files = [];
  
  // 状态文件
  const statePath = getStateFilePath(cwd);
  if (await fs.pathExists(statePath)) {
    files.push('.bailu.yaml');
  }
  
  // 平台相关文件
  if (state && state.platforms) {
    for (const [platformId, platformState] of Object.entries(state.platforms)) {
      if (!platformState.installed) {
        continue;
      }
      
      const platform = getPlatformDefinition(platformId);
      if (!platform) {
        continue;
      }
      
      // Skills 目录
      const skillsDir = path.join(cwd, platform.skillsDir);
      if (await fs.pathExists(skillsDir)) {
        const entries = await fs.readdir(skillsDir);
        const bailuEntries = entries.filter(e => e.startsWith('bailu-'));
        
        for (const entry of bailuEntries) {
          files.push(path.join(platform.skillsDir, entry));
        }
      }
      
      // Agents 目录（始终扫描全局 ~/.claude/agents/，和 installer.js 保持一致）
      const globalBase = platform.globalSkillsDir.replace('~', require('os').homedir()).replace('/skills', '');
      const agentsDir = path.join(globalBase, 'agents');
      if (await fs.pathExists(agentsDir)) {
        const entries = await fs.readdir(agentsDir);
        const bailuEntries = entries.filter(e => e.startsWith('bailu-'));
        
        for (const entry of bailuEntries) {
          // 全局 agents 用绝对路径，不受 cwd 影响
          files.push(path.join(agentsDir, entry));
        }
      }
      
      // Commands 目录
      const commandsDir = path.join(cwd, platform.skillsDir.replace('skills', 'commands'));
      if (await fs.pathExists(commandsDir)) {
        const entries = await fs.readdir(commandsDir);
        const bailuEntries = entries.filter(e => e.startsWith('bailu-'));
        
        for (const entry of bailuEntries) {
          files.push(path.join(platform.skillsDir.replace('skills', 'commands'), entry));
        }
      }
    }
  }
  
  return files;
}

/**
 * 删除文件
 * @param {string[]} files - 要删除的文件列表
 * @param {string} cwd - 工作目录
 * @returns {Promise<boolean>} 是否成功
 */
async function removeFiles(files, cwd) {
  for (const file of files) {
    // 全局路径（如 ~/.claude/agents/xxx）直接用，不拼 cwd
    const fullPath = path.isAbsolute(file) ? file : path.join(cwd, file);
    
    try {
      if (await fs.pathExists(fullPath)) {
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          await fs.remove(fullPath);
        } else {
          await fs.remove(fullPath);
        }
      }
    } catch (error) {
      console.error(chalk.red(`  删除失败 ${file}: ${error.message}`));
      return false;
    }
  }
  
  return true;
}

/**
 * 显示要删除的文件列表
 * @param {string[]} files - 文件列表
 */
function showFilesToRemove(files) {
  if (files.length === 0) {
    console.log(chalk.yellow('  没有找到需要删除的白鹿工作流文件'));
    return;
  }
  
  console.log(chalk.yellow('  以下文件将被删除：'));
  console.log('');
  
  files.forEach(file => {
    console.log(chalk.yellow(`    • ${file}`));
  });
  
  console.log('');
  console.log(chalk.gray('  删除前将备份到 .bailu-backup/ 目录'));
  console.log('');
}

/**
 * 主函数：运行 reset 命令
 * @param {Object} options - 命令选项
 */
async function runReset(options = {}) {
  const cwd = process.cwd();
  
  try {
    console.log('');
    console.log(chalk.cyan('  白鹿工作流重置'));
    console.log(chalk.gray('  ─────────────'));
    console.log('');
    
    // 检查是否已初始化
    const initialized = await isInitialized(cwd);
    
    if (!initialized) {
      console.log(chalk.yellow('  尚未初始化白鹿工作流'));
      console.log(chalk.white('  运行 bailu init 开始'));
      console.log('');
      return;
    }
    
    // 读取状态
    const state = await readState(cwd);
    
    // 收集要删除的文件
    const filesToRemove = await collectFilesToRemove(state, cwd);
    
    // 显示文件列表
    showFilesToRemove(filesToRemove);
    
    if (filesToRemove.length === 0) {
      return;
    }
    
    // 确认删除
    if (!options.confirm && !options.yes) {
      const confirmed = await confirm({
        message: '确定要重置吗？此操作不可逆。',
        default: false
      });
      
      if (!confirmed) {
        console.log(chalk.gray('  已取消重置'));
        return;
      }
    }
    
    console.log('');
    
    // 备份文件
    const spinner = ora('正在备份文件...').start();
    const backupSuccess = await backupFiles(filesToRemove, cwd);
    
    if (backupSuccess) {
      spinner.succeed('文件已备份到 .bailu-backup/');
    } else {
      spinner.fail('备份失败');
      console.log(chalk.red('  为安全起见，重置已取消'));
      return;
    }
    
    // 删除文件
    spinner.start('正在删除文件...');
    const removeSuccess = await removeFiles(filesToRemove, cwd);
    
    if (removeSuccess) {
      spinner.succeed('文件已删除');
    } else {
      spinner.fail('部分文件删除失败');
      console.log(chalk.yellow('  备份文件保留在 .bailu-backup/'));
      return;
    }
    
    // 清除状态文件
    await clearState(cwd);
    
    // 显示完成信息
    console.log('');
    console.log(chalk.green('  ✅ 重置完成！'));
    console.log('');
    console.log(chalk.white('  白鹿工作流已从当前项目移除'));
    console.log(chalk.white('  备份文件保留在 .bailu-backup/'));
    console.log('');
    console.log(chalk.cyan('  运行 bailu init 重新安装'));
    console.log('');
    
  } catch (error) {
    console.error(chalk.red(`\n  重置失败: ${error.message}`));
    process.exit(1);
  }
}

// 导出
module.exports = { runReset };
