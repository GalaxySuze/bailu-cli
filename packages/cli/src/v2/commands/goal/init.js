/**
 * @fileoverview bailu goal init
 *
 * 在当前项目根目录创建 .goal/ 目录骨架。
 * 注意：故意不动 .gitignore，由用户自己决定哪些 .goal/* 文件入库。
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { confirm } = require('@inquirer/prompts');
const { getGoalPaths, getAssetsGoalDir } = require('../../goal/paths');
const { createInitialState, writeState } = require('../../goal/state');

/**
 * 从 assets/goal/templates/ 复制一份给项目
 * @param {string} cwd
 * @param {boolean} overwrite
 */
async function copyTemplates(cwd, overwrite) {
  const tmplDir = path.join(getAssetsGoalDir(), 'templates');
  const goalPaths = getGoalPaths(cwd);

  await fs.ensureDir(goalPaths.dir);
  await fs.ensureDir(goalPaths.snapshots);

  const files = [
    ['current.md', goalPaths.current],
    ['progress.md', goalPaths.progress],
    ['blockers.md', goalPaths.blockers],
    ['verification.log', goalPaths.verification],
    ['handoff.md', goalPaths.handoff]
  ];

  for (const [src, dest] of files) {
    const srcPath = path.join(tmplDir, src);
    if (await fs.pathExists(dest)) {
      if (!overwrite) {
        console.log(chalk.gray(`  · 已存在，跳过：${path.relative(cwd, dest)}`));
        continue;
      }
    }
    await fs.copy(srcPath, dest, { overwrite: true });
    console.log(chalk.green(`  ✔ 写入：${path.relative(cwd, dest)}`));
  }

  // state.json 单独走（带 updatedAt 实时戳）
  if ((await fs.pathExists(goalPaths.state)) && !overwrite) {
    console.log(chalk.gray(`  · 已存在，跳过：${path.relative(cwd, goalPaths.state)}`));
  } else {
    await writeState(createInitialState({ agent: 'claude' }), cwd);
    console.log(chalk.green(`  ✔ 写入：${path.relative(cwd, goalPaths.state)}`));
  }
}

/**
 * 入口：bailu goal init
 * @param {Object} options
 */
async function runGoalInit(options = {}) {
  const cwd = process.cwd();
  const goalPaths = getGoalPaths(cwd);

  console.log('');
  console.log(chalk.cyan('  白鹿 Goal · 初始化无人值守任务'));
  console.log(chalk.gray(`  目标目录：${goalPaths.dir}`));
  console.log('');

  // 已存在 .goal/ 时确认是否覆盖
  let overwrite = false;
  if (await fs.pathExists(goalPaths.dir)) {
    if (options.force || options.yes) {
      overwrite = true;
    } else {
      console.log(chalk.yellow('  ⚠ .goal/ 已存在，默认保留现有文件，只补齐缺失项。'));
      const useForce = await confirm({
        message: '是否用模板覆盖现有 .goal/ 文件？（会丢失已有目标内容）',
        default: false
      });
      overwrite = useForce;
    }
  }

  await copyTemplates(cwd, overwrite);

  console.log('');
  console.log(chalk.cyan('  下一步：'));
  console.log(chalk.cyan('    1. 编辑 .goal/current.md，填好「目标」「范围」「完成条件」。'));
  console.log(chalk.cyan('    2. bailu goal status            查看当前状态'));
  console.log(chalk.cyan('    3. bailu goal run               手动跑一轮（验证协议可用）'));
  console.log(chalk.cyan('    4. bailu goal install-launchd   进入无人值守'));
  console.log('');
  console.log(chalk.gray('  提示：.goal/ 是否提交到 git 由你决定，默认不会修改 .gitignore。'));
  console.log('');
}

module.exports = { runGoalInit };
