import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import fs from 'fs'
import * as sass from 'sass'
import { ViteEjsPlugin } from "vite-plugin-ejs";

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

function learningMapDevPlugin() {
    const mapDir = resolve(__dirname, 'third_part/brain_net_map')
    return {
        name: 'rbook-learning-map-dev',
        apply: 'serve',
        configureServer(server) {
            const { loadRelations } = require(resolve(mapDir, 'load_data.js'))
            server.middlewares.use(async (req, res, next) => {
                const pathname = new URL(req.url || '/', 'http://rbook.local').pathname
                if (!['/brain_net_map', '/brain_net_map/', '/brain_net_map/index.html'].includes(pathname)) return next()
                try {
                    const data = JSON.stringify(loadRelations()).replaceAll('<', '\\u003c')
                    const html = fs.readFileSync(resolve(mapDir, 'index.html'), 'utf8')
                        .replace('<meta charset="UTF-8">', charset => `${charset}<script src="/js/theme-controller.js"></script><script>globalThis.RELATION_DATA = ${data}</script>`)
                        .replace('src="./app.js"', `src="/@fs${resolve(mapDir, 'app.js')}"`)
                    res.setHeader('Content-Type', 'text/html; charset=utf-8')
                    res.end(await server.transformIndexHtml(pathname, html))
                }
                catch (error) {
                    next(error)
                }
            })
        },
    }
}

function videoAssetsPlugin() {
    const videoDir = resolve(__dirname, 'video')
    let outputDir
    return {
        name: 'rbook-video-assets',
        configResolved(config) {
            outputDir = resolve(config.root, config.build.outDir)
        },
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                if (req.url?.startsWith('/video/')) {
                    // 交给 Vite 的静态文件服务处理 MIME 和视频 Range 请求。
                    req.url = '/@fs' + videoDir + req.url.slice('/video'.length)
                }
                next()
            })
        },
        closeBundle() {
            if (fs.existsSync(videoDir)) {
                fs.cpSync(videoDir, resolve(outputDir, 'video'), { recursive: true })
            }
        },
    }
}

function collectAnimationEntries() {
    const bookDir = resolve(__dirname, 'book')
    const entries = {}

    function visit(dir) {
        if (!fs.existsSync(dir)) return
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const fullPath = resolve(dir, entry.name)
            if (entry.isDirectory()) visit(fullPath)
            else if (entry.name.endsWith('.animation.ts')) {
                const relative = fullPath
                    .slice(bookDir.length + 1)
                    .replace(/\\/g, '/')
                    .replace(/\.animation\.ts$/, '')
                entries[`animations/${relative}`] = fullPath
            }
        }
    }

    visit(bookDir)
    return entries
}

function articleDevPlugin(animationEntries, runtimeEntry, formulaEntry) {
    const animationUrls = new Map(Object.entries(animationEntries).map(([name, source]) => [`/${name}.js`, source]))
    animationUrls.set('/js/animation-runtime.js', runtimeEntry)
    animationUrls.set('/js/formula-tools.js', formulaEntry)

    return {
        name: 'rbook-article-dev',
        resolveId(id) {
            return animationUrls.get(id) || null
        },
        configureServer(server) {
            const policyEntry = resolve(__dirname, '.tsbuild/publishing/content/path-policy.js')
            const catalogEntry = resolve(__dirname, '.tsbuild/publishing/content/catalog-loader.js')
            const domainCatalogEntry = resolve(__dirname, '.tsbuild/publishing/domain/catalog.js')
            const sourceEntry = resolve(__dirname, '.tsbuild/publishing/content/source-resolver.js')
            const indexEntry = resolve(__dirname, '.tsbuild/publishing/domain/index.js')
            const templateEntry = resolve(__dirname, '.tsbuild/publishing/templates/page-template-renderer.js')
            const renderEntry = resolve(__dirname, '.tsbuild/publishing/pipeline/render-article.js')
            const { PathPolicy } = require(policyEntry)
            const { loadCatalog } = require(catalogEntry)
            const { flattenCatalogLeaves, findHomeLeaf } = require(domainCatalogEntry)
            const { resolveArticleSource } = require(sourceEntry)
            const { buildArticleIndex } = require(indexEntry)
            const { PageTemplateRenderer } = require(templateEntry)
            const { renderArticle } = require(renderEntry)

            const policy = new PathPolicy(__dirname)
            const catalogPath = resolve(policy.book, 'catalog.yaml')
            function readArticleCatalog() {
                const catalog = loadCatalog(catalogPath)
                const entries = flattenCatalogLeaves(catalog).map(leaf => {
                    const { metadata, source } = resolveArticleSource(leaf.path, policy.book, [])
                    return {
                        id: metadata.id,
                        title: metadata.title.trim() || leaf.title,
                        sourcePath: source.filePath,
                        publishHref: policy.publishHref(source.filePath),
                        metadata,
                        catalogTitle: leaf.title,
                        hidden: leaf.hidden,
                    }
                })
                return { index: buildArticleIndex(catalog, entries), homeLeaf: findHomeLeaf(catalog) }
            }
            let articleCatalog
            const templateRenderer = new PageTemplateRenderer({
                templateDir: resolve(__dirname, 'src/ejs'),
                root: __dirname,
                menuHtml: loadMenuHtml(),
            })

            server.watcher.add(resolve(__dirname, 'book'))
            server.watcher.on('change', changed => {
                if (inside(policy.book, changed) && (changed.endsWith('.md') || changed === catalogPath)) {
                    articleCatalog = undefined
                }
                if (/\.(md|animation\.ts)$/.test(changed) || changed === catalogPath) {
                    server.ws.send({ type: 'full-reload', path: '*' })
                }
            })

            server.middlewares.use(async (req, res, next) => {
                if (!req.url) return next()
                const pathname = decodeURIComponent(new URL(req.url, 'http://rbook.local').pathname)

                if (pathname === '/markdown.css') {
                    try {
                        const result = sass.compile(resolve(__dirname, 'src/markdown-style/markdown.scss'))
                        res.statusCode = 200
                        res.setHeader('Content-Type', 'text/css; charset=utf-8')
                        res.end(result.css)
                    }
                    catch (error) {
                        next(error)
                    }
                    return
                }

                // 站点根路径（/ 与 /index.html）渲染 catalog 的 home 文章，
                // 与构建产物 dist/index.html（alias-home 阶段）保持一致。
                const isHomeRequest = pathname === '/' || pathname === '/index.html'
                if (isHomeRequest || pathname.endsWith('.html')) {
                    try {
                        const { index, homeLeaf } = articleCatalog ??= readArticleCatalog()
                        const relative = isHomeRequest
                            ? homeLeaf
                            : pathname.replace(/^\//, '').replace(/\.html$/, '.md')
                        if (!relative) return next()
                        const sourcePath = resolve(policy.book, relative)
                        if (!inside(policy.book, sourcePath) || !fs.existsSync(sourcePath)) return next()
                        const result = renderArticle({
                            entryPath: relative,
                            policy,
                            index,
                            templateRenderer,
                            diagnostics: [],
                            debug: true,
                            includeLearningMap: true,
                        })
                        const html = await server.transformIndexHtml(pathname, result.html)
                        res.statusCode = 200
                        res.setHeader('Content-Type', 'text/html; charset=utf-8')
                        res.end(html)
                    }
                    catch (error) {
                        next(error)
                    }
                    return
                }

                const assetPath = resolve(policy.book, pathname.replace(/^\//, ''))
                if (inside(policy.book, assetPath) && fs.existsSync(assetPath) && fs.statSync(assetPath).isFile()) {
                    res.statusCode = 200
                    res.setHeader('Content-Type', contentType(assetPath))
                    fs.createReadStream(assetPath).pipe(res)
                    return
                }
                next()
            })
        },
    }
}

function inside(root, target) {
    return target === root || target.startsWith(root + '/')
}

function contentType(filePath) {
    const extension = filePath.slice(filePath.lastIndexOf('.')).toLowerCase()
    return ({
        '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
    })[extension] || 'application/octet-stream'
}

/**
 * 侧边栏 HTML 由 book/catalog.yaml 派生（唯一目录真相）。
 * 渲染逻辑编译在 .tsbuild 里，因此必须先执行 `npm run prepare`（或 build:core/build:full）。
 */
function loadMenuHtml() {
    const rendererEntry = resolve(__dirname, '.tsbuild/publishing/domain/menu-renderer.js')
    const catalogEntry = resolve(__dirname, '.tsbuild/publishing/content/catalog-loader.js')
    const catalogDomainEntry = resolve(__dirname, '.tsbuild/publishing/domain/catalog.js')
    const sourceEntry = resolve(__dirname, '.tsbuild/publishing/content/source-resolver.js')
    const policyEntry = resolve(__dirname, '.tsbuild/publishing/content/path-policy.js')

    if (!fs.existsSync(rendererEntry) || !fs.existsSync(catalogEntry)) {
        throw new Error(
            '缺少 .tsbuild 编译产物，无法从 catalog.yaml 生成侧边栏。\n' +
            '请先运行: npm run prepare',
        )
    }

    const { MenuRenderer } = require(rendererEntry)
    const { loadCatalog } = require(catalogEntry)
    const { flattenCatalog } = require(catalogDomainEntry)
    const { resolveArticleSource } = require(sourceEntry)
    const { PathPolicy } = require(policyEntry)
    const catalog = loadCatalog(resolve(__dirname, 'book/catalog.yaml'))
    const policy = new PathPolicy(__dirname)
    const sources = new Map(flattenCatalog(catalog).map(leaf => [leaf, resolveArticleSource(leaf, policy.book)]))

    return new MenuRenderer({
        templateDir: resolve(__dirname, 'src', 'ejs'),
        root: resolve(__dirname, 'src'),
        leafHref: leaf => sources.has(leaf) ? policy.publishHref(sources.get(leaf).source.filePath) : `/${leaf}`,
        leafMeta: leaf => ({ menuTitle: sources.get(leaf)?.metadata.menuTitle, articleId: sources.get(leaf)?.metadata.id }),
    }).render(catalog)
}

// https://vitejs.dev/config/
const animationEntries = collectAnimationEntries()
const runtimeEntry = resolve(__dirname, 'packages/animation/src/runtime.ts')
const formulaEntry = resolve(__dirname, 'src/formula-tools.js')

export default defineConfig({
    plugins: [
        videoAssetsPlugin(),
        learningMapDevPlugin(),
        articleDevPlugin(animationEntries, runtimeEntry, formulaEntry),
        ViteEjsPlugin({
            menu: {
                html: loadMenuHtml()
            }
        })
    ],
    root: resolve(__dirname, 'src'),
    build: {
        outDir: '../dist',
        emptyOutDir: false,
        rollupOptions: {
            preserveEntrySignatures: 'strict',
            input: {
                index: resolve(__dirname, 'src/home.html'),
                'js/animation-runtime': runtimeEntry,
                'js/formula-tools': formulaEntry,
                ...animationEntries,
            },
            output: {
                entryFileNames(chunk) {
                    return chunk.name.startsWith('animations/') || chunk.name.startsWith('js/')
                        ? '[name].js'
                        : 'assets/[name]-[hash].js'
                },
            },
        },
    }
})
