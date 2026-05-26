/**
 * @bailu/workflow-ops 入口文件
 * 
 * 运营工作流，集成 baoyu-skills 内容创作工具集
 */

const path = require('path');

module.exports = {
  name: 'ops',
  configDir: path.join(__dirname, 'config'),
  skills: [
    // 白鹿运营工作流主流程
    'bailu-ops-workflow',
    
    // baoyu-skills 内容创作工具集
    'baoyu-xhs-images',          // 小红书图文卡片生成
    'baoyu-infographic',         // 信息图生成
    'baoyu-diagram',             // SVG 图表生成
    'baoyu-cover-image',         // 封面图生成
    'baoyu-slide-deck',          // 幻灯片生成
    'baoyu-imagine',             // AI 图像生成
    'baoyu-image-gen',           // 图像生成工具
    'baoyu-image-cards',         // 图片卡片
    'baoyu-article-illustrator', // 文章插图
    'baoyu-comic',               // 漫画生成
    'baoyu-markdown-to-html',    // Markdown 转 HTML
    'baoyu-format-markdown',     // Markdown 格式化
    'baoyu-translate',           // 翻译工具
    'baoyu-url-to-markdown',     // URL 转 Markdown
    'baoyu-youtube-transcript',  // YouTube 字幕提取
    'baoyu-wechat-summary',      // 微信文章摘要
    'baoyu-post-to-wechat',      // 发布到微信
    'baoyu-post-to-weibo',       // 发布到微博
    'baoyu-post-to-x',           // 发布到 X
    'baoyu-compress-image',      // 图片压缩
    'baoyu-danger-gemini-web',   // Gemini Web 工具
    'baoyu-danger-x-to-markdown' // X 转 Markdown
  ],
  commands: ['bailu-ops.md']
};
