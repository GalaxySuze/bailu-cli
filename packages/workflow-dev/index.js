/**
 * @bailu/workflow-dev 入口文件
 */

const path = require('path');

module.exports = {
  name: 'dev',
  configDir: path.join(__dirname, 'config'),
  skills: ['bailu-dev-workflow', 'bailu-init'],
  commands: ['bailu-dev.md', 'bailu-init.md']
};
