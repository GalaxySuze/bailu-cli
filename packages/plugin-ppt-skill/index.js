/**
 * @vickzhang/bailu-plugin-ppt-skill
 * 
 * 白鹿工作流插件 - Guizang PPT 网页 PPT 生成器
 * 
 * 功能：
 * - 生成单文件 HTML 横向翻页 PPT
 * - 支持电子杂志风和瑞士国际主义风
 * - 生成配图和多平台封面
 * 
 * 使用方式：
 *   bailu plugin install ppt-skill
 *   在 AI 工具中说："帮我做一份瑞士风 PPT"
 */

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

/**
 * 插件元信息
 */
const PLUGIN_INFO = {
  name: 'ppt-skill',
  displayName: 'Guizang PPT 生成器',
  version: '1.0.0',
  description: '生成精美的网页 PPT，支持电子杂志风和瑞士国际主义风',
  category: '内容创作',
  icon: '🎨',
  
  // GitHub 仓库
  repo: 'https://github.com/op7418/guizang-ppt-skill',
  
  // 适用场景
  useCases: [
    '线下分享 / 行业内部讲话',
    'AI 产品发布 / demo day',
    '个人风格表达的演讲',
    '公众号头图 / 小红书封面'
  ],
  
  // 优缺点
  pros: [
    '双视觉系统：电子杂志风 + 瑞士风',
    '22 种锁定版式，开箱即用',
    '单文件 HTML，浏览器直接打开',
    '支持配图和多平台封面生成'
  ],
  
  cons: [
    '仅支持 Claude Code / Codex',
    '需要 AI 图片生成能力（GPT-Image）'
  ]
};

/**
 * Skill 内容
 */
const SKILL_CONTENT = `# Guizang PPT 生成技能

> 生成精美的网页 PPT，支持电子杂志风和瑞士国际主义风

## 触发条件

当用户需要以下操作时使用此技能：
- 生成演讲 PPT
- 制作产品介绍
- 生成公众号头图 / 小红书封面
- 制作风格化的内容展示

## 两种风格

### Style A: 电子杂志风
- 适合：叙事、观点、分享、个人风格表达
- 特点：像 Monocle 贴上了代码
- 布局：10 种布局骨架

### Style B: 瑞士国际主义风
- 适合：事实、产品、分析、方法论表达
- 特点：网格至上、单一高饱和锚点色
- 布局：22 种锁定版式

## 使用方式

### 生成 PPT

用户可以说：
- "帮我做一份瑞士风 PPT"
- "帮我做一份杂志风 PPT"
- "基于这篇文章做一份 8 页左右的 PPT"

### 生成封面

用户可以说：
- "基于这份 PPT 的核心观点，生成一张公众号 21:9 头图"
- "生成一张小红书 3:4 封面"

### 生成配图

用户可以说：
- "把这张产品截图重新设计成适合 PPT 的 16:10 配图"
- "生成一张信息图用于 PPT"

## 主题色预设

### Style A 电子杂志主题
- 墨水经典（默认）
- 靛蓝瓷（科技、AI）
- 森林墨（自然、文化）
- 牛皮纸（怀旧、人文）
- 沙丘（艺术、设计）

### Style B 瑞士主题
- 克莱因蓝 IKB（默认）
- 柠檬黄（年轻、运动）
- 柠檬绿（生态、健康）
- 安全橙（警示、新闻）

## 注意事项

- 输出为单文件 HTML，浏览器直接打开
- 不支持导出 PPTX
- 颜色只能从预设主题选择，不允许自定义
- 瑞士风必须遵守 22 种锁定版式
`;

/**
 * Command 内容
 */
const COMMAND_CONTENT = `/ppt $ARGUMENTS

生成网页 PPT。

使用方式：
- /ppt 帮我做一份瑞士风 PPT
- /ppt 帮我做一份杂志风 PPT
- /ppt 基于这篇文章做一份 8 页左右的 PPT
- /ppt 生成公众号 21:9 头图
`;

/**
 * 注册插件命令
 */
function registerCommands(program) {
  // 由于 PPT 生成是通过 AI 工具的 Skill 触发的
  // 这里只注册一个说明命令
  program
    .command('ppt')
    .description('PPT 生成（在 AI 工具中使用）')
    .action(() => {
      console.log('');
      console.log(chalk.cyan('🎨 Guizang PPT 生成器'));
      console.log('');
      console.log(chalk.white('PPT 生成是通过 AI 工具的 Skill 触发的，请在 AI 工具中使用：'));
      console.log('');
      console.log(chalk.yellow('  在 Hanako / Claude Code 中说：'));
      console.log(chalk.white('    "帮我做一份瑞士风 PPT"'));
      console.log(chalk.white('    "帮我做一份杂志风 PPT"'));
      console.log(chalk.white('    "基于这篇文章做一份 8 页左右的 PPT"'));
      console.log('');
      console.log(chalk.yellow('  生成封面：'));
      console.log(chalk.white('    "生成公众号 21:9 头图"'));
      console.log(chalk.white('    "生成小红书 3:4 封面"'));
      console.log('');
    });
}

module.exports = {
  PLUGIN_INFO,
  SKILL_CONTENT,
  COMMAND_CONTENT,
  registerCommands
};
