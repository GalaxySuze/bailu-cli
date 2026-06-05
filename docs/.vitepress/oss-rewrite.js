/**
 * OSS 构建后处理脚本
 * 1. 将 HTML 中的页面导航链接从 OSS 绝对路径改为相对路径
 * 2. 将 JS 中的 base 路径从 OSS URL 改为 /
 * 3. 保留静态资源（assets/、vp-icons.css、logo.svg）的 OSS 路径
 *
 * VitePress 构建时会将 https:// 压缩为 https:/，因此正则需兼容两种形式
 */
import { readdir, readFile, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** OSS 域名标识（兼容 https:// 和 https:/） */
const OSS_MARKER = 'semir-front-end-static-hz.oss-cn-hangzhou.aliyuncs.com/daily/sup-ai-doc-web-client/'

/** 需要保留 OSS 路径的静态资源前缀/文件名 */
const ASSET_PREFIXES = ['assets/', 'Inter-']
const ASSET_FILES = ['vp-icons.css', 'logo.svg']

/**
 * 判断路径是否为静态资源（需保留 OSS 前缀）
 * @param {string} path - 资源路径
 * @returns {boolean}
 */
function isStaticAsset(path) {
  return ASSET_PREFIXES.some(p => path.startsWith(p)) || ASSET_FILES.includes(path)
}

/**
 * 递归处理目录中的文件
 * @param {string} dir - 目录路径
 * @param {function} processor - 文件处理函数
 */
async function processDir(dir, processor) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      await processDir(fullPath, processor)
    } else {
      await processor(fullPath)
    }
  }
}

/**
 * 处理 HTML 文件：页面链接去 OSS 前缀，静态资源保留
 * @param {string} filePath - HTML 文件路径
 */
async function processHtml(filePath) {
  let content = await readFile(filePath, 'utf-8')
  let changed = false

  const pattern = new RegExp(
    `(href|src)="https:/?/?${OSS_MARKER.replace(/\//g, '\\/')}([^"]*)"`,
    'g'
  )

  content = content.replace(pattern, (match, attr, path) => {
    if (isStaticAsset(path)) {
      return match
    }
    changed = true
    return `${attr}="/${path}"`
  })

  if (changed) {
    await writeFile(filePath, content)
    console.log(`  ✓ HTML: ${filePath}`)
  }
}

/**
 * 处理 JS 文件：将 base 路径从 OSS URL 改为 /
 * VitePress 在 JS 中存储 base 路径用于客户端路由
 * @param {string} filePath - JS 文件路径
 */
async function processJs(filePath) {
  let content = await readFile(filePath, 'utf-8')
  let changed = false

  // 匹配 JS 中 OSS URL 字符串（含 https:// 和 https:/ 两种形式）
  const pattern = new RegExp(
    `https:/?/?${OSS_MARKER.replace(/\//g, '\\/').replace(/\./g, '\\.')}`,
    'g'
  )

  content = content.replace(pattern, () => {
    changed = true
    return '/'
  })

  if (changed) {
    await writeFile(filePath, content)
    console.log(`  ✓ JS: ${filePath}`)
  }
}

const distDir = join(__dirname, 'dist')
console.log('OSS 后处理：替换页面导航链接和 JS base 路径...')
await processDir(distDir, async (filePath) => {
  if (filePath.endsWith('.html')) {
    await processHtml(filePath)
  } else if (filePath.endsWith('.js')) {
    await processJs(filePath)
  }
})
console.log('完成')
