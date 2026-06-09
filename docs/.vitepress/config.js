/**
 * @fileoverview 白鹿工作流文档站 VitePress 配置
 *
 * base 路径双模式：
 *   - 内部服务器部署（默认）：base='/ai_doc/'，配合 nginx location /ai_doc/ 代理到 OSS
 *   - 本地 dev / GitHub Pages：BAILU_DOCS_BASE='/' npx vitepress dev docs
 *
 * 默认 '/ai_doc/' 是因为 CI 管道的 build:oss 不传环境变量，
 * 和 nginx location /ai_doc/ { proxy_pass OSS/ } 的路径剥掉规则配合
 */
import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '白鹿工作流',
  description: '在复杂的规则森林中，发现优雅的解决方案',
  base: process.env.BAILU_DOCS_BASE || '/ai_doc/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${process.env.BAILU_DOCS_BASE || '/ai_doc/'}/logo.svg` }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif+SC:wght@400;500;600;700&display=swap', rel: 'stylesheet' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '指南', link: '/guide/' },
      { text: '命令', link: '/commands/' },
      { text: 'Goal', link: '/goal/' },
      { text: '更新日志', link: '/changelog' },
      { text: 'GitHub', link: 'https://github.com/vickzhang/bailu-cli' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '入门',
          items: [
            { text: '项目简介', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装与配置', link: '/guide/installation' },
          ]
        },
        {
          text: '核心概念',
          items: [
            { text: 'SDD 研发工作流', link: '/guide/sdd-workflow' },
            { text: 'Skills 与 Commands', link: '/guide/skills-commands' },
            { text: '支持的 AI 工具', link: '/guide/ai-tools' },
          ]
        },
        {
          text: '进阶',
          items: [
            { text: '团队协作', link: '/guide/team' },
            { text: '最佳实践', link: '/guide/best-practices' },
            { text: '常见问题', link: '/guide/faq' },
          ]
        }
      ],
      '/commands/': [
        {
          text: '命令参考',
          items: [
            { text: '概览', link: '/commands/' },
            { text: 'bailu init', link: '/commands/init' },
            { text: 'bailu status', link: '/commands/status' },
            { text: 'bailu update', link: '/commands/update' },
            { text: 'bailu doctor', link: '/commands/doctor' },
            { text: 'bailu reset', link: '/commands/reset' },
          ]
        },
        {
          text: 'Goal 子命令',
          items: [
            { text: 'bailu goal init', link: '/commands/goal-init' },
            { text: 'bailu goal status', link: '/commands/goal-status' },
            { text: 'bailu goal run', link: '/commands/goal-run' },
            { text: 'bailu goal install-launchd', link: '/commands/goal-install-launchd' },
            { text: 'bailu goal stop', link: '/commands/goal-stop' },
            { text: 'bailu goal logs', link: '/commands/goal-logs' },
          ]
        }
      ],
      '/goal/': [
        {
          text: '设计理念',
          items: [
            { text: '为什么是 Goal', link: '/goal/' },
            { text: '五层架构', link: '/goal/architecture' },
            { text: '状态机详解', link: '/goal/state-machine' },
          ]
        },
        {
          text: '使用指南',
          items: [
            { text: '快速上手', link: '/goal/quick-start' },
            { text: '.goal/ 目录契约', link: '/goal/file-contract' },
            { text: 'launchd 集成', link: '/goal/launchd' },
            { text: '多执行器策略', link: '/goal/multi-agent' },
          ]
        },
        {
          text: '安全与运维',
          items: [
            { text: '安全边界', link: '/goal/safety' },
            { text: '常见问题', link: '/goal/faq' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vickzhang/bailu-cli' }
    ],

    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2024-2026 白鹿工作流'
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换'
            }
          }
        }
      }
    },

    outline: {
      label: '页面导航',
      level: [2, 3]
    },

    lastUpdated: {
      text: '最后更新于'
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    }
  }
})
