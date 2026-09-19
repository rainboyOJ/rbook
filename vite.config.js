import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import fs from 'fs'
import { ViteEjsPlugin } from "vite-plugin-ejs";

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

/**
 * 侧边栏 HTML 由 book/catalog.yaml 派生（唯一目录真相）。
 * 渲染逻辑编译在 .tsbuild 里，因此必须先执行 `npm run prepare`（或 build:core/build:full）。
 */
function loadMenuHtml() {
    const rendererEntry = resolve(__dirname, '.tsbuild/publishing/domain/menu-renderer.js')
    const catalogEntry = resolve(__dirname, '.tsbuild/publishing/content/catalog-loader.js')

    if (!fs.existsSync(rendererEntry) || !fs.existsSync(catalogEntry)) {
        throw new Error(
            '缺少 .tsbuild 编译产物，无法从 catalog.yaml 生成侧边栏。\n' +
            '请先运行: npm run prepare',
        )
    }

    const { MenuRenderer } = require(rendererEntry)
    const { loadCatalog } = require(catalogEntry)
    const catalog = loadCatalog(resolve(__dirname, 'book/catalog.yaml'))

    return new MenuRenderer({
        templateDir: resolve(__dirname, 'src', 'ejs'),
        root: resolve(__dirname, 'src'),
    }).render(catalog)
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        ViteEjsPlugin({
            menu: {
                html: loadMenuHtml()
            }
        })
    ],
    root: resolve(__dirname, 'src'),
    build: {
        outDir: '../dist'
    }
})
