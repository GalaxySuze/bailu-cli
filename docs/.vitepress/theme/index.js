import DefaultTheme from 'vitepress/theme'
import './custom.css'

/**
 * 白鹿工作流文档主题
 * 基于 VitePress 默认主题扩展
 * 设计风格：Claude (Anthropic) 编辑杂志感 — 紧凑、复古、时尚
 */
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 注册全局组件或指令
  }
}
