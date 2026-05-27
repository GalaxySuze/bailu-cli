/**
 * @vickzhang/bailu-workflow-dev 入口文件
 *
 * 开发工作流包，包含：
 * - Skills: bailu-dev-workflow（开发流程）、bailu-init（初始化）
 * - Commands: /bailu-dev、/bailu-init
 * - Agents: architect、planner、frontend-developer、backend-developer、test-engineer、code-reviewer
 * - Rules: dev-workflow（工作流规则）、code-quality（代码质量）、git-conventions（Git规范）
 * - Hooks: pre-commit（提交前检查）、post-task（任务完成处理）
 */

const path = require('path');

module.exports = {
  name: 'dev',
  configDir: path.join(__dirname, 'config'),
  skills: ['bailu-dev-workflow', 'bailu-init'],
  commands: ['bailu-dev', 'bailu-init'],
  agents: ['architect', 'planner', 'frontend-developer', 'backend-developer', 'test-engineer', 'code-reviewer'],
  rules: ['dev-workflow', 'code-quality', 'git-conventions'],
  hooks: ['pre-commit', 'post-task']
};
