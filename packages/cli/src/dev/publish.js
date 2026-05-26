/**
 * 发布命令
 * 
 * 根据发布配置发布npm包
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const { execSync } = require('child_process');
const Table = require('cli-table3');
const boxen = require('boxen');
const ora = require('ora');

const BAILU_HOME = path.join(os.homedir(), '.bailu');
const MONOREPO_PATH = path.join(os.homedir(), 'Code', 'AIAgent', 'bailu-cli');
const PUBLISH_CONFIG_PATH = path.join(BAILU_HOME, 'publish.json');

/**
 * 读取发布配置
 */
async function getPublishConfig() {
  if (!await fs.pathExists(PUBLISH_CONFIG_PATH)) {
    throw new Error('发布配置不存在，请先创建 ~/.bailu/publish.json');
  }
  return await fs.readJson(PUBLISH_CONFIG_PATH);
}

/**
 * 获取包目录
 */
function getPackageDir(packageName) {
  // 从 @vickzhang/bailu-cli 提取目录名
  // @vickzhang/bailu-cli -> cli
  // @vickzhang/bailu-workflow-dev -> workflow-dev
  const dirName = packageName.replace('@vickzhang/bailu-', '');
  return path.join(MONOREPO_PATH, 'packages', dirName);
}

/**
 * 检查包是否存在
 */
async function isPackageExists(packageName) {
  const packageDir = getPackageDir(packageName);
  const packageJsonPath = path.join(packageDir, 'package.json');
  return await fs.pathExists(packageJsonPath);
}

/**
 * 获取包版本
 */
async function getPackageVersion(packageName) {
  const packageDir = getPackageDir(packageName);
  const packageJsonPath = path.join(packageDir, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);
  return packageJson.version;
}

/**
 * 发布单个包
 */
async function publishPackage(packageName, config) {
  const packageDir = getPackageDir(packageName);
  const registry = config.registry || 'https://registry.npmjs.org';
  const access = config.access || 'public';

  const spinner = ora({
    text: `正在发布 ${packageName}...`,
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    // 检查npm登录状态
    try {
      execSync(`npm whoami --registry ${registry}`, { stdio: 'ignore' });
    } catch (error) {
      spinner.fail(`${packageName} 发布失败：未登录npm`);
      console.log(chalk.yellow(`   请先运行：npm login --registry ${registry}`));
      return false;
    }

    // 发布包
    execSync(`npm publish --registry ${registry} --access ${access}`, {
      cwd: packageDir,
      stdio: 'ignore'
    });

    spinner.succeed(`${packageName} 发布成功`);
    return true;
  } catch (error) {
    spinner.fail(`${packageName} 发布失败：${error.message}`);
    return false;
  }
}

/**
 * 执行发布
 */
async function publish(options = {}) {
  const { dryRun = false, all = false } = options;

  console.log('');
  console.log(chalk.cyan('🦌 白鹿工作流 - 发布'));
  console.log('');

  try {
    // 读取发布配置
    const config = await getPublishConfig();
    const packages = config.packages || {};

    // 创建表格
    const table = new Table({
      head: [
        chalk.cyan('包名'),
        chalk.cyan('版本'),
        chalk.cyan('状态'),
        chalk.cyan('说明')
      ],
      style: {
        head: [],
        border: ['gray']
      },
      chars: {
        'top': '─',
        'top-mid': '┬',
        'top-left': '┌',
        'top-right': '┐',
        'bottom': '─',
        'bottom-mid': '┴',
        'bottom-left': '└',
        'bottom-right': '┘',
        'left': '│',
        'left-mid': '├',
        'mid': '─',
        'mid-mid': '┼',
        'right': '│',
        'right-mid': '┤'
      }
    });

    // 收集要发布的包
    const toPublish = [];
    const skipped = [];

    for (const [packageName, packageConfig] of Object.entries(packages)) {
      const exists = await isPackageExists(packageName);
      const version = exists ? await getPackageVersion(packageName) : '-';
      const shouldPublish = all || packageConfig.publish;

      if (!exists) {
        table.push([
          chalk.white(packageName),
          chalk.gray(version),
          chalk.red('❌ 不存在'),
          chalk.gray(packageConfig.description || '')
        ]);
        continue;
      }

      if (shouldPublish) {
        table.push([
          chalk.white(packageName),
          chalk.cyan(version),
          chalk.green('✅ 待发布'),
          chalk.gray(packageConfig.description || '')
        ]);
        toPublish.push({ name: packageName, config: packageConfig });
      } else {
        table.push([
          chalk.white(packageName),
          chalk.cyan(version),
          chalk.yellow('⏭️  跳过'),
          chalk.gray(packageConfig.description || '')
        ]);
        skipped.push({ name: packageName, reason: packageConfig.description });
      }
    }

    console.log(table.toString());
    console.log('');

    // 预览模式
    if (dryRun) {
      const dryRunBox = boxen(
        chalk.white('预览模式，不会实际发布\n\n') +
        chalk.green(`待发布：${toPublish.length} 个包\n`) +
        chalk.yellow(`跳过：${skipped.length} 个包`),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'yellow',
          title: '🔍 预览',
          titleAlignment: 'center'
        }
      );
      console.log(dryRunBox);
      return;
    }

    // 确认发布
    if (toPublish.length === 0) {
      console.log(chalk.yellow('没有需要发布的包'));
      return;
    }

    // 发布
    console.log(chalk.yellow(`📦 开始发布 ${toPublish.length} 个包...`));
    console.log('');

    let successCount = 0;
    let failCount = 0;

    for (const { name } of toPublish) {
      const result = await publishPackage(name, config);
      if (result) {
        successCount++;
      } else {
        failCount++;
      }
    }

    // 发布结果
    console.log('');
    const resultBox = boxen(
      chalk.white('发布完成！\n\n') +
      chalk.green(`✅ 成功：${successCount}\n`) +
      chalk.red(`❌ 失败：${failCount}\n`) +
      chalk.yellow(`⏭️  跳过：${skipped.length}`),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: successCount > 0 ? 'green' : 'red',
        title: '📊 发布结果',
        titleAlignment: 'center'
      }
    );
    console.log(resultBox);

  } catch (error) {
    console.error(chalk.red('发布失败：'), error.message);
    process.exit(1);
  }
}

module.exports = publish;
