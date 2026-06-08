#!/usr/bin/env node

/**
 * @fileoverview 白鹿 CLI v2 精简版入口
 * 
 * 设计原则：
 * - 最低心智成本：5个命令，1个交互式向导
 * - 状态驱动：用 .bailu.yaml 记录一切
 * - 做减法：暂停非核心功能
 */

const { createProgram } = require('../src/v2/index');

// 创建并运行程序
const program = createProgram();

program.parseAsync(process.argv).catch((error) => {
  // 忽略 Commander 的退出错误
  if (error.code === 'commander.helpDisplayed' || 
      error.code === 'commander.version' ||
      error.code === 'commander.help') {
    process.exit(0);
  }
  
  console.error(`\n  错误: ${error.message}\n`);
  process.exit(1);
});
