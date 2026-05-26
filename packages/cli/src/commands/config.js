/**
 * 配置命令
 */

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

const BAILU_HOME = path.join(os.homedir(), '.bailu');

function config() {
  console.log(chalk.cyan(`打开配置目录：${BAILU_HOME}`));
  
  try {
    // macOS
    execSync(`open "${BAILU_HOME}"`, { stdio: 'ignore' });
  } catch {
    try {
      // Linux
      execSync(`xdg-open "${BAILU_HOME}"`, { stdio: 'ignore' });
    } catch {
      console.log(chalk.yellow('请手动打开：' + BAILU_HOME));
    }
  }
}

module.exports = config;
