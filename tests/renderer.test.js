const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const fs = require('fs')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const { PathPolicy } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/path-policy.js'))
const { loadCatalog } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/catalog-loader.js'))
const { flattenCatalog } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/catalog.js'))
const { buildArticleIndex } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/index.js'))
const { resolveArticleSource } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/source-resolver.js'))
const { createMarkdownRenderer, renderMarkdown } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/markdown/create-markdown-renderer.js'))
const { normalizeSnapshot } = require('./helpers/snapshot-normalizer.js')

describe('Phase 3: 新 Markdown 渲染核心', () => {
    const policy = new PathPolicy(PROJECT_ROOT)
    const catalogPath = path.join(PROJECT_ROOT, 'book', 'catalog.yaml')
    const catalog = loadCatalog(catalogPath)
    const leaves = flattenCatalog(catalog)

    // 构建索引
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

    it('createMarkdownRenderer 创建无错误', () => {
        const md = createMarkdownRenderer({ index })
        assert.ok(md)
        assert.ok(typeof md.render === 'function')
    })

    it('渲染基础 markdown', () => {
        const md = createMarkdownRenderer({ index })
        const { content } = renderMarkdown('# Hello\n\nWorld', md)
        assert.ok(content.includes('<h1'))
        assert.ok(content.includes('Hello'))
    })

    it('渲染 frontmatter 提取标题', () => {
        const md = createMarkdownRenderer({ index })
        const { header, content } = renderMarkdown('---\ntitle: 我的标题\n---\n\n正文', md)
        assert.equal(header.title, '我的标题')
        assert.ok(content.includes('正文'))
    })

    it('渲染 oneWordAlgo 容器', () => {
        const md = createMarkdownRenderer({ index })
        const { content } = renderMarkdown('::: oneWordAlgo\n一句话内容\n:::', md)
        assert.ok(content.includes('oneWordAlgo'))
    })

    it('渲染 colorfulbox 容器', () => {
        const md = createMarkdownRenderer({ index })
        const { content } = renderMarkdown('::: colorfulbox\n彩色内容\n:::', md)
        assert.ok(content.includes('colorfulbox'))
    })

    it('渲染 blackboard 容器', () => {
        const md = createMarkdownRenderer({ index })
        const { content } = renderMarkdown('::: blackboard\n黑板内容\n:::', md)
        assert.ok(content.includes('blackboard'))
    })

    it('渲染 fold 容器', () => {
        const md = createMarkdownRenderer({ index })
        const { content } = renderMarkdown('::: fold\n折叠内容\n:::', md)
        assert.ok(content.includes('<details>'))
        assert.ok(content.includes('<summary>'))
    })

    it('渲染 warning 容器', () => {
        const md = createMarkdownRenderer({ index })
        const { content } = renderMarkdown('::: warning\n警告内容\n:::', md)
        assert.ok(content.includes('warning'))
    })

    it('渲染 info 容器', () => {
        const md = createMarkdownRenderer({ index })
        const { content } = renderMarkdown('::: info\n信息内容\n:::', md)
        assert.ok(content.includes('info'))
    })

    it('渲染 error 容器', () => {
        const md = createMarkdownRenderer({ index })
        const { content } = renderMarkdown('::: error\n错误内容\n:::', md)
        assert.ok(content.includes('error'))
    })

    it('[[[rbook:...]]] 链接渲染', () => {
        const md = createMarkdownRenderer({ index })
        const { content } = renderMarkdown('[[[rbook: presum]]]', md)
        assert.ok(content.includes('extra-link'))
        assert.ok(content.includes('sum'))
    })

    it('[[[rbook:notfound]]] 生成警告标记', () => {
        const diags = []
        const md = createMarkdownRenderer({ index, diagnostics: diags })
        const { content } = renderMarkdown('[[[rbook: notfound]]]', md)
        assert.ok(diags.some(d => d.level === 'warning'), '应产生 warning 诊断')
    })

    it('[[[p:...]]] with provider 生成链接', () => {
        const mockProvider = {
            name: 'mock',
            getProblemById(id) {
                return { id, oj: 'luogu', sid: 'P1000', title: '测试题', link: '/problem/P1000', hasSolution: true }
            },
            getProblemsForArticle() { return [] }
        }
        const md = createMarkdownRenderer({ index, problemProvider: mockProvider, diagnostics: [] })
        const { content } = renderMarkdown('[[[p: luogu-P1000]]]', md)
        assert.ok(content.includes('luogu'))
    })

    it('[[[p:...]]] 无 provider 生成错误标记', () => {
        const diags = []
        const md = createMarkdownRenderer({ index, diagnostics: diags })
        const { content } = renderMarkdown('[[[p: luogu-P1000]]]', md)
        assert.ok(diags.some(d => d.level === 'error'), '无 provider 应产生 error 诊断')
    })

    it('fixture 文件可通过新渲染器运行', () => {
        const fixtureDir = path.join(PROJECT_ROOT, 'tests', 'fixtures', 'markdown')
        for (const f of fs.readdirSync(fixtureDir).filter(f => f.endsWith('.md') && f !== 'contract-targets.md')) {
            const raw = fs.readFileSync(path.join(fixtureDir, f), 'utf8')
            const md = createMarkdownRenderer({ index })
            const { content } = renderMarkdown(raw, md)
            assert.ok(content.length > 0, `${f} 渲染为空`)
            const normalized = normalizeSnapshot(content)
            assert.ok(normalized.length > 0, `${f} 归一化后为空`)
        }
    })

    it('渲染器可安全连续渲染多篇文章（无全局状态泄漏）', () => {
        const md = createMarkdownRenderer({ index })
        const texts = ['# 第一篇', '# 第二篇']
        const results = texts.map(t => renderMarkdown(t, md))
        assert.equal(results[0].header.title, '')
        assert.ok(results[0].content.includes('第一篇'))
        assert.ok(results[1].content.includes('第二篇'))
    })

    it('mermaid fence 渲染', () => {
        const md = createMarkdownRenderer({ index })
        const { content } = renderMarkdown('```mermaid\ngraph TD;\nA-->B;\n```', md)
        assert.ok(content.includes('class="mermaid"'))
    })

    it('plantuml fence 渲染', () => {
        const md = createMarkdownRenderer({ index })
        const { content } = renderMarkdown('```plantuml\n@startuml\nAlice -> Bob\n@enduml\n```', md)
        assert.ok(content.includes('class="plantuml"'))
    })

    it('dot fence 渲染', () => {
        const md = createMarkdownRenderer({ index })
        const { content } = renderMarkdown('```dot\ndigraph G { A -> B }\n```', md)
        assert.ok(content.includes('class="dot"'))
    })

    it('pseudocode fence 渲染', () => {
        const md = createMarkdownRenderer({ index })
        const { content } = renderMarkdown('```pseudocode\n\\begin{algorithm}\n\\end{algorithm}\n```', md)
        assert.ok(content.includes('class="pseudocode"'))
    })

    it('普通代码块带复制按钮', () => {
        const md = createMarkdownRenderer({ index })
        const { content } = renderMarkdown('```cpp\nint main() {}\n```', md)
        assert.ok(content.includes('code-with-linenumber'))
        assert.ok(content.includes('markdown-it-code-copy'))
    })

    it('.excalidraw.svg 相对路径渲染', () => {
        const md = createMarkdownRenderer({ index, excalidraw: { basePath: policy.book } })
        const { content } = renderMarkdown('![图](./image.excalidraw.svg)', md)
        assert.ok(content.includes('image-wrapper'))
        assert.ok(content.includes('image-extension-badge'))
    })

    it('.excalidraw.svg 无 basePath 时回退', () => {
        const md = createMarkdownRenderer({ index })
        const { content } = renderMarkdown('![图](./image.excalidraw.svg)', md)
        assert.ok(content.includes('image-wrapper'))
    })
})