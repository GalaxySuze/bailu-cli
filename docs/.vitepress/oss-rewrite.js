/**
 * OSS 构建后处理脚本
 * 将 HTML 中的页面导航链接从 OSS 绝对路径改为相对路径，
 * 保留静态资源（assets、vp-icons.css、logo.svg）的 OSS 路径。
 *
 * VitePress 构建时会将 https:// 压缩为 https:/，因此正则需兼容两种形式
 */
import { readdir, readFile, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

/** 当前脚本所在目录 */
const __dirname = dirname(fileURLToPath(import.meta.url))

/** OSS 域名标识（用于匹配，兼容 https:// 和 https:/ 两种写法） */
const OSS_MARKER = 'semir-front-end-static-hz.oss-cn-hangzhou.aliyuncs.com/daily/sup-ai-doc-web-client/'

/** 需要保留 OSS 路径的静态资源前缀/文件名 */
const ASSET_PREFIXES = ['assets/', 'Inter-']
const ASSET_FILES = ['vp-icons.css', 'logo.svg']

/**
 * 判断路径是否为静态资源（需要保留 OSS 前缀）
 * @param {string} path - 资源路径
 * @returns {boolean}
 */
function isStaticAsset(path) {
  return ASSET_PREFIXES.some(p => path.startsWith(p)) || ASSET_FILES.includes(path)
}

/**
 * 递归处理目录中的 HTML 文件
 * @param {string} dir - 目录路径
 */
async function processDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      await processDir(fullPath)
    } else if (entry.name.endsWith('.html')) {
      await processHtml(fullPath)
    }
  }
}

/**
 * 处理单个 HTML 文件：页面链接去 OSS 前缀，静态资源保留
 * @param {string} filePath - HTML 文件路径
 */
async function processHtml(filePath) {
  let content = await readFile(filePath, 'utf-8')
  let changed = false

  // 匹配 href/src 中包含 OSS_MARKER 的链接（兼容 https:// 和 https:/）
  const pattern = new RegExp(
    `(href|src)="https:/?/?${OSS_MARKER.replace(/\//g, '\\/')}([^"]*)"`,
    'g'
  )

  content = content.replace(pattern, (match, attr, path) => {
    if (isStaticAsset(path)) {
      return match // 静态资源保留 OSS 路径
    }
    changed = true
    return `${attr}="/${path}"` // 页面路由改为相对路径
  })

  if (changed) {
    await writeFile(filePath, content)
    console.log(`  ✓ ${filePath}`)
  }
}

const distDir = join(__dirname, 'dist')
console.log('OSS 后处理：替换页面导航链接...')
await processDir(distDir)
console.log('完成')
