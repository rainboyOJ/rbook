const { describe, it, before } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const fs = require('fs')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const { PathPolicy } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/path-policy.js'))
const { loadCatalog } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/catalog-loader.js'))
const { flattenCatalog } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/catalog.js'))
const { buildArticleIndex } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/index.js'))
const { resolveArticleSource } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/source-resolver.js'))
const { PageTemplateRenderer } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/templates/page-template-renderer.js'))
const { ArtifactWriter } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/pipeline/artifact-writer.js'))
const { renderArticle } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/pipeline/render-article.js'))
const { renderMany } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/pipeline/render-many.js'))

describe('Phase 4: 文章渲染与模板写盘', () => {
    const policy = new PathPolicy(PROJECT_ROOT)
    const catalogPath = path.join(PROJECT_ROOT, 'book', 'catalog.yaml')
    const catalog = loadCatalog(catalogPath)
    const leaves = flattenCatalog(catalog)
    const diag = []
    const entries = leaves.map(leaf => {
        const resolved = resolveArticleSource(leaf, policy.book, diag)
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
        templateDir: path.join(PROJECT_ROOT, 'src', 'ejs'),
        root: PROJECT_ROOT,
    })

    const testOutputDir = path.join(PROJECT_ROOT, '.tsbuild', 'test-output')
    let testPolicy

    before(() => {
        // 创建临时输出目录
        if (fs.existsSync(testOutputDir)) {
            fs.rmSync(testOutputDir, { recursive: true })
        }
        fs.mkdirSync(testOutputDir, { recursive: true })

        // 创建一个用于测试的 PathPolicy，把 dist 指向 .tsbuild/test-output
        testPolicy = new PathPolicy(PROJECT_ROOT)
    })

    it('PageTemplateRenderer 渲染基本文章', () => {
        const resolved = resolveArticleSource('base/presum', policy.book, [])
        const view = {
            title: '前缀和',
            id: 'presum',
            href: '/base/presum/index.html',
            publishHref: '/base/presum/index.html',
            gitLocation: 'https://github.com/rainboyOJ/rbook/tree/master/book/base/presum/index.md',
            sourcePath: resolved.source.filePath,
            outputPath: path.join(testOutputDir, 'base/presum/index.html'),
            outputDir: path.join(testOutputDir, 'base/presum'),
            content: '<p>测试内容</p>',
            header: { title: '前缀和' },
            metadata: resolved.metadata,
        }
        const html = templateRenderer.render('article.html', view)
        assert.ok(html.includes('前缀和'), '标题应包含在输出中')
        assert.ok(html.includes('测试内容'), '内容应包含在输出中')
        assert.ok(html.includes('markdown-body'), '应包含 markdown-body 容器')
    })

    it('renderArticle 完整流程（无写盘）', () => {
        const result = renderArticle({
            entryPath: 'base/presum',
            policy,
            index,
            templateRenderer,
            blogUrl: 'https://rbook.roj.ac.cn',
            diagnostics: [],
        })
        assert.ok(result.view.title)
        assert.ok(result.html.includes('markdown-body'))
        assert.ok(result.html.includes('github.com'))
    })

    it('ArtifactWriter 写 HTML 文件', () => {
        const writer = new ArtifactWriter()
        const outPath = path.join(testOutputDir, 'test-write.html')
        writer.writeHtml(outPath, '<html><body>test</body></html>')
        assert.ok(fs.existsSync(outPath))
        const content = fs.readFileSync(outPath, 'utf8')
        assert.ok(content.includes('test'))
    })

    it('ArtifactWriter 复制附件', () => {
        const writer = new ArtifactWriter()
        const srcDir = path.join(testOutputDir, 'src-files')
        const destDir = path.join(testOutputDir, 'dest-files')
        fs.mkdirSync(srcDir, { recursive: true })
        fs.writeFileSync(path.join(srcDir, 'test.txt'), 'hello', 'utf8')

        writer.copyArtifacts(srcDir, destDir, ['test.txt'])
        assert.ok(fs.existsSync(path.join(destDir, 'test.txt')))
    })

    it('ArtifactWriter 缺失附件报告诊断', () => {
        const diags = []
        const writer = new ArtifactWriter({ diagnostics: diags })
        writer.copyArtifact('/nonexistent/file.txt', path.join(testOutputDir, 'nonexistent.txt'))
        assert.ok(diags.some(d => d.level === 'error'), '缺失附件应产生 error 诊断')
    })

    it('renderMany 批量渲染报告统计', () => {
        // 只渲染前 3 篇文章
        const testLeaves = leaves.slice(0, 3)
        const result = renderMany(testLeaves, {
            index,
            policy,
            templateRenderer,
            diagnostics: [],
            withRelated: true,
        })
        assert.equal(result.total, 3)
        assert.equal(result.succeeded, 3)
        assert.equal(result.failed, 0)
    })

    it('renderMany 把渲染期诊断回灌给调用方（不能静默丢弃）', () => {
        // 用一篇引用了不存在 include 的临时文章，触发渲染期诊断。
        // 注：include 现由 include 插件处理（比旧的 content-macros 更早、
        // 且是 error 级），所以这里只断言“诊断被回灌”，不绑定具体 phase。
        const tmpDir = path.join(PROJECT_ROOT, '.tsbuild', 'test-output', 'diag-article')
        fs.mkdirSync(tmpDir, { recursive: true })
        const mdPath = path.join(tmpDir, 'index.md')
        fs.writeFileSync(mdPath, '# 诊断测试\n\n<%- include("./definitely_missing.md") %>\n')

        const callerDiag = []
        const result = renderMany([mdPath], {
            index,
            policy,
            templateRenderer,
            diagnostics: callerDiag,
            withRelated: false,
        })

        // 关键：诊断必须出现在调用方数组里，否则 reportDiagnostics 看不到
        assert.ok(
            callerDiag.length > 0,
            '渲染期诊断应回灌到调用方传入的 diagnostics 数组',
        )
        assert.ok(
            callerDiag.some(d => /include|content-macros/.test(d.phase)),
            `应包含 include/content-macros 诊断，实际: ${callerDiag.map(d => d.phase).join(', ')}`,
        )
        assert.deepEqual(result.diagnostics, callerDiag, 'result.diagnostics 应与调用方数组一致')
    })

    it('renderPages 在有文章渲染失败时让构建失败', () => {
        const { renderPages } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/build/stages.js'))
        const ctx = {
            projectRoot: PROJECT_ROOT,
            policy,
            diagnostics: [],
            stageResults: {
                index,
                // 混入一篇不存在的文章，必然渲染失败
                leaves: [...leaves.slice(0, 2), 'definitely/not/a/real/article'],
            },
        }

        assert.throws(
            () => renderPages.run(ctx),
            /渲染失败/,
            '存在渲染失败的文章时 renderPages 必须抛错，否则 deploy.sh 会把残缺 dist 推上生产',
        )
    })

    it('bin/render_markdown.js 兼容 shim 正常渲染', () => {
        const render_md = require('../bin/render_markdown.js')
        const out = render_md('base/presum')
        assert.ok(out.html.includes('前缀和'))
    })
})

describe('站点首页别名 (alias-home)', () => {
    const os = require('os')
    const { aliasHome } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/build/stages.js'))
    const bookDir = path.join(PROJECT_ROOT, 'book')
    const catalogPath = path.join(bookDir, 'catalog.yaml')

    function stubPolicy(distDir) {
        return {
            root: PROJECT_ROOT,
            book: bookDir,
            dist: distDir,
            publishHref(sourcePath) {
                return '/' + path.relative(bookDir, sourcePath).replace(/\.md$/i, '.html').replace(/\\/g, '/')
            },
            outputPath(sourcePath) {
                return path.join(distDir, path.relative(bookDir, sourcePath).replace(/\.md$/i, '.html'))
            },
        }
    }

    function stubContext({ distDir, catalog, diagnostics = [] }) {
        return {
            projectRoot: PROJECT_ROOT,
            policy: stubPolicy(distDir),
            diagnostics,
            stageResults: { catalog },
        }
    }

    function tempDist(name) {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), `rbook-${name}-`))
        fs.mkdirSync(path.join(dir, 'introducation'), { recursive: true })
        fs.writeFileSync(path.join(dir, 'introducation', 'index.html'), '<html>前言首页</html>', 'utf8')
        return dir
    }

    it('把 home 文章的产物复制为 dist/index.html', () => {
        const distDir = tempDist('alias')
        const ctx = stubContext({ distDir, catalog: loadCatalog(catalogPath) })

        aliasHome.run(ctx)

        const indexHtml = path.join(distDir, 'index.html')
        assert.ok(fs.existsSync(indexHtml), 'dist/index.html 应被生成')
        assert.equal(fs.readFileSync(indexHtml, 'utf8'), '<html>前言首页</html>')
    })

    it('home 文章未渲染时让构建失败', () => {
        const distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rbook-alias-empty-'))
        const ctx = stubContext({ distDir, catalog: loadCatalog(catalogPath) })

        assert.throws(() => aliasHome.run(ctx), /首页文章未渲染/)
    })

    it('catalog 缺少 home 标记时让构建失败', () => {
        const distDir = tempDist('alias-nohome')
        const catalog = loadCatalog(path.join(PROJECT_ROOT, 'book', 'catalog.yaml'))
        // 模拟未标记任何首页的 catalog
        const noHome = { ...catalog, entries: catalog.entries.map(e => ({ ...e, home: false })) }
        const ctx = stubContext({ distDir, catalog: noHome })

        assert.throws(() => aliasHome.run(ctx), /没有 home: true/)
    })

    it('产出的是文章正文而不是占位首页', () => {
        const distDir = tempDist('alias-content')
        const ctx = stubContext({ distDir, catalog: loadCatalog(catalogPath) })
        aliasHome.run(ctx)

        const html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8')
        assert.ok(!html.includes('从左侧目录选择一篇文章开始阅读'), '不应是占位首页')
    })
})