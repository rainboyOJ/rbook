import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import fs from 'fs'
import * as sass from 'sass'
import { ViteEjsPlugin } from "vite-plugin-ejs";

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

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

function articleDevPlugin(animationEntries, runtimeEntry) {
    const animationUrls = new Map(Object.entries(animationEntries).map(([name, source]) => [`/${name}.js`, source]))
    animationUrls.set('/js/animation-runtime.js', runtimeEntry)

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
            const { flattenCatalog } = require(domainCatalogEntry)
            const { resolveArticleSource } = require(sourceEntry)
            const { buildArticleIndex } = require(indexEntry)
            const { PageTemplateRenderer } = require(templateEntry)
            const { renderArticle } = require(renderEntry)

            const policy = new PathPolicy(__dirname)
            const catalog = loadCatalog(resolve(__dirname, 'book/catalog.yaml'))
            const leaves = flattenCatalog(catalog)
            const entries = leaves.map(leaf => {
                const resolved = resolveArticleSource(leaf, policy.book, [])
                return {
                    id: resolved.metadata.id,
                    title: resolved.metadata.title,
                    sourcePath: resolved.source.filePath,
                    publishHref: policy.publishHref(resolved.source.filePath),
                    metadata: resolved.metadata,
                }
            })
            const index = buildArticleIndex(catalog, entries)
            const templateRenderer = new PageTemplateRenderer({
                templateDir: resolve(__dirname, 'src/ejs'),
                root: __dirname,
                menuHtml: loadMenuHtml(),
            })

            server.watcher.add(resolve(__dirname, 'book'))
            server.watcher.on('change', changed => {
                if (/\.(md|animation\.ts)$/.test(changed)) {
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

                if (pathname.endsWith('.html') && pathname !== '/index.html') {
                    const relative = pathname.replace(/^\//, '').replace(/\.html$/, '.md')
                    const sourcePath = resolve(policy.book, relative)
                    if (!inside(policy.book, sourcePath) || !fs.existsSync(sourcePath)) return next()
                    try {
                        const result = renderArticle({
                            entryPath: relative,
                            policy,
                            index,
                            templateRenderer,
                            diagnostics: [],
                            debug: true,
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
    const hrefByCatalogPath = new Map(flattenCatalog(catalog).map(leaf => {
        const source = resolveArticleSource(leaf, policy.book).source.filePath
        return [leaf, policy.publishHref(source)]
    }))

    return new MenuRenderer({
        templateDir: resolve(__dirname, 'src', 'ejs'),
        root: resolve(__dirname, 'src'),
        leafHref: leaf => hrefByCatalogPath.get(leaf) || `/${leaf}`,
    }).render(catalog)
}

// https://vitejs.dev/config/
const animationEntries = collectAnimationEntries()
const runtimeEntry = resolve(__dirname, 'packages/animation/src/runtime.ts')

export default defineConfig({
    plugins: [
        articleDevPlugin(animationEntries, runtimeEntry),
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
                index: resolve(__dirname, 'src/index.html'),
                'js/animation-runtime': runtimeEntry,
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
