# @bailu/workflow-ops

白鹿运营工作流 - 适用于个人运营，集成 baoyu-skills 内容创作工具集

## 安装

```bash
npm install -g @bailu/workflow-ops
```

## 使用

```bash
# 安装工作流到配置中心
bailu workflow install ops

# 安装到AI工具
bailu tool install
```

## 包含内容

### Skills

#### 白鹿运营工作流
- `bailu-ops-workflow` - 运营工作流主流程

#### baoyu-skills 内容创作工具集

**内容生成类**
| Skill | 说明 |
|-------|------|
| `baoyu-xhs-images` | 小红书图文卡片生成，支持 12 种风格 × 6 种布局 |
| `baoyu-infographic` | 信息图生成，21 种布局 × 17 种视觉风格 |
| `baoyu-diagram` | SVG 图表生成，支持流程图、时序图、架构图等 |
| `baoyu-cover-image` | 封面图生成，5 维度系统：类型×调色板×渲染×文字×情绪 |
| `baoyu-slide-deck` | 幻灯片生成，支持多种风格和受众 |
| `baoyu-imagine` | AI 图像生成 |
| `baoyu-image-gen` | 图像生成工具 |
| `baoyu-image-cards` | 图片卡片生成 |
| `baoyu-article-illustrator` | 文章插图生成 |
| `baoyu-comic` | 漫画生成 |

**内容处理类**
| Skill | 说明 |
|-------|------|
| `baoyu-markdown-to-html` | Markdown 转 HTML |
| `baoyu-format-markdown` | Markdown 格式化 |
| `baoyu-translate` | 翻译工具 |
| `baoyu-url-to-markdown` | URL 转 Markdown |
| `baoyu-youtube-transcript` | YouTube 字幕提取 |
| `baoyu-wechat-summary` | 微信文章摘要 |
| `baoyu-compress-image` | 图片压缩 |

**发布分发类**
| Skill | 说明 |
|-------|------|
| `baoyu-post-to-wechat` | 发布到微信公众号 |
| `baoyu-post-to-weibo` | 发布到微博 |
| `baoyu-post-to-x` | 发布到 X (Twitter) |

**实验性工具**
| Skill | 说明 |
|-------|------|
| `baoyu-danger-gemini-web` | Gemini Web 工具 |
| `baoyu-danger-x-to-markdown` | X 转 Markdown |

### Commands

- `/bailu-ops` - 进入运营工作流

## 触发词

- 运营、小红书、图文、视频、内容、发布、涨粉、封面、脚本、公众号

## 适用场景

- 个人内容创作
- 自媒体运营
- 社交媒体管理
- 小红书图文制作
- 信息图和图表生成
- 多平台内容分发

## 致谢

本工作流集成了 [baoyu-skills](https://github.com/JimLiu/baoyu-skills) 的内容创作工具集，感谢 Baoyu 的开源贡献。

## 许可证

MIT
