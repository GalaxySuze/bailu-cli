import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '白鹿工作流',
  description: '在复杂的规则森林中，发现优雅的解决方案',
  base: process.env.BASE_PATH || '/',
  
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif+SC:wght@400;500;600;700&display=swap', rel: 'stylesheet' }],
  ],
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: '指南', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: '更新日志', link: '/changelog' },
      { text: 'GitHub', link: 'https://github.com/GalaxySuze/bailu-cli' }
    ],
    
    sidebar: {
      '/guide/': [
        {
          text: '入门',
          items: [
            { text: '项目简介', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装与配置', link: '/guide/installation' },
            { text: '分发架构', link: '/guide/distribution' },
          ]
        },
        {
          text: '核心概念',
          items: [
            { text: '工作流核心概念', link: '/guide/workflow-concepts' },
            { text: 'Rules 系统设计', link: '/guide/rules-system' },
            { text: 'TUI 仪表盘', link: '/guide/tui' },
            { text: 'WebUI 管理', link: '/guide/webui' },
          ]
        },
        {
          text: '功能指南',
          items: [
            { text: '工作流管理', link: '/guide/workflows' },
            { text: 'SDD 研发管理', link: '/guide/sdd-workflow' },
            { text: 'AI 工具管理', link: '/guide/ai-tools' },
            { text: '组件管理', link: '/guide/components' },
            { text: '组件详解', link: '/guide/components-detail' },
            { text: '推荐工具', link: '/guide/recommend' },
          ]
        },
        {
          text: '进阶',
          items: [
            { text: '最佳实践', link: '/guide/best-practices' },
            { text: '团队协作', link: '/guide/team' },
            { text: '插件系统', link: '/guide/plugins' },
            { text: '安全审计', link: '/guide/audit' },
            { text: '常见问题', link: '/guide/faq' },
          ]
        }
      ],
      '/api/': [
        {
          text: '命令参考',
          items: [
            { text: '概览', link: '/api/' },
            { text: 'bailu init', link: '/api/init' },
            { text: 'bailu workflow', link: '/api/workflow' },
            { text: 'bailu tool', link: '/api/tool' },
            { text: 'bailu mcp', link: '/api/mcp' },
            { text: 'bailu sync', link: '/api/sync' },
            { text: 'bailu status', link: '/api/status' },
            { text: 'bailu serve', link: '/api/serve' },
            { text: 'bailu recommend', link: '/api/recommend' },
            { text: 'bailu audit', link: '/api/audit' },
            { text: 'bailu plugin', link: '/api/plugin' },
          ]
        }
      ]
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/GalaxySuze/bailu-cli' }
    ],
    
    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2024 白鹿工作流'
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
