/**
 * @vickzhang/bailu-workflow-dev 入口文件
 *
 * 开发工作流包 v2.0.0
 *
 * 互斥引擎架构：
 *   SDD 引擎（默认）— D1-D7 七阶段研发管理
 *   Comet 引擎（v3.0）— 五阶段状态机 + 脚本守卫
 *   白鹿原生（fallback）— 四阶段推荐式引导
 *
 * 共享基础层：Agents / Rules / Hooks
 *
 * 外部依赖：OpenSpec（可选，D2 阶段使用）
 */

const path = require('path');

module.exports = {
  name: 'dev',
  version: '2.0.0',
  configDir: path.join(__dirname, 'config'),

  /** 当前激活的流程引擎，通过 bailu install dev --engine 切换 */
  engine: 'sdd',  // sdd | comet（v3.0） | bare

  skills: [
    // 白鹿原有 Skills
    'bailu-dev-workflow',
    'bailu-init',
    // SDD Skills（v2.0 新增）
    'bailu-sdd-start',
    'bailu-sdd-d1-planning',
    'bailu-sdd-d2-tech-design',
    'bailu-sdd-d3-tech-review',
    'bailu-sdd-d4-coding',
    'bailu-sdd-d4-git-branch',
    'bailu-sdd-d5-code-review',
    'bailu-sdd-d6-test-closure',
    'bailu-sdd-d7-publish',
    'bailu-sdd-openspec-workflow'
  ],

  commands: [
    'bailu-dev',
    'bailu-init',
    'bailu-sdd-start'
  ],

  agents: [
    'architect',
    'planner',
    'frontend-developer',
    'backend-developer',
    'test-engineer',
    'code-reviewer'
  ],

  rules: ['dev-workflow', 'code-quality', 'git-conventions'],

  hooks: ['pre-commit', 'post-task'],

  dependencies: {
    external: [
      { name: 'openspec', package: '@fission-ai/openspec', required: false }
    ]
  }
};
