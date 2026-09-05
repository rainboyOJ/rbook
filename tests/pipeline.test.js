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
})