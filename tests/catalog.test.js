const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

describe('Phase 2: Catalog 与元数据模型', () => {
    const PROJECT_ROOT = path.resolve(__dirname, '..')
    const { loadCatalog } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/catalog-loader.js'))
    const { normalizeMetadata } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/metadata-normalizer.js'))
    const { PathPolicy } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/path-policy.js'))
    const { resolveArticleSource } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/source-resolver.js'))
    const { flattenCatalog, joinCatalogPath } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/catalog.js'))
    const { MenuRenderer } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/menu-renderer.js'))

    const catalogPath = path.join(PROJECT_ROOT, 'book', 'catalog.yaml')

    it('catalog 加载无错误', () => {
        const diag = []
        const catalog = loadCatalog(catalogPath, diag)
        assert.ok(catalog.entries.length > 0, 'catalog 应有条目')
        const errors = diag.filter(d => d.level === 'error')
        assert.equal(errors.length, 0, `catalog 校验错误: ${JSON.stringify(errors)}`)
    })

    it('catalog 叶子路径已规范化（无空段/双斜杠）', () => {
        const catalog = loadCatalog(catalogPath)
        const leaves = flattenCatalog(catalog)
        assert.ok(leaves.length > 0, 'catalog 应有叶子文章')
        for (const leaf of leaves) {
            assert.ok(!leaf.startsWith('/'), `路径不应以斜杠开头: ${leaf}`)
            // 允许末尾单个斜杠（旧行为，例如 introducation/），但不得出现空段
            const segments = leaf.replace(/\/$/, '').split('/')
            assert.ok(!segments.includes(''), `路径出现空段: ${leaf}`)
        }
    })

    it('joinCatalogPath 规范化重复斜杠', () => {
        assert.equal(joinCatalogPath('', 'a'), 'a')
        assert.equal(joinCatalogPath('a/', 'b'), 'a/b')
        assert.equal(joinCatalogPath('a//', 'b'), 'a/b')
        assert.equal(joinCatalogPath('/a', 'b'), '/a/b')
        assert.equal(joinCatalogPath('a', ''), 'a')
        // 旧行为：末尾斜杠保留（对应 introducation/ 这类链接）
        assert.equal(joinCatalogPath('a', 'b/'), 'a/b/')
    })

    it('侧边栏由 catalog 派生，且每个叶子都有链接', () => {
        const catalog = loadCatalog(catalogPath)
        const html = new MenuRenderer({
            templateDir: path.join(PROJECT_ROOT, 'src', 'ejs'),
            root: path.join(PROJECT_ROOT, 'src'),
        }).render(catalog)

        for (const leaf of flattenCatalog(catalog)) {
            const href = leaf.endsWith('.md')
                ? `href="/${leaf.replace(/\.md$/, '.html')}"`
                : `href="/${leaf.replace(/\/$/, '')}/index.html"`
            assert.ok(html.includes(href), `侧边栏缺少叶子链接: ${href}`)
        }
        // 只检查链接，SVG 的 xmlns="http://..." 也含双斜杠
        assert.ok(!/href="#\/[^"]*\/\//.test(html), '侧边栏链接不应出现双斜杠')
    })

    it('每篇文章的 id 唯一（id 是跨文章链接与题库的契约）', () => {
        const policy = new PathPolicy(PROJECT_ROOT)
        const catalog = loadCatalog(catalogPath)
        const byId = new Map()

        for (const leaf of flattenCatalog(catalog)) {
            const id = resolveArticleSource(leaf, policy.book).metadata.id
            assert.ok(id, `文章缺少 id: ${leaf}`)
            if (!byId.has(id)) byId.set(id, [])
            byId.get(id).push(leaf)
        }

        const dups = [...byId.entries()].filter(([, leaves]) => leaves.length > 1)
        assert.equal(
            dups.length,
            0,
            `id 重复: ${dups.map(([id, l]) => `"${id}" -> ${l.join(', ')}`).join('; ')}`,
        )
    })

    it('idFromPath 对 index.md 使用目录名', () => {
        const md = normalizeMetadata({}, path.join(PROJECT_ROOT, 'book', 'base', 'two-pointer', 'index.md'))
        assert.equal(md.id, 'two-pointer')
        // 非 index.md 仍用文件名
        const md2 = normalizeMetadata({}, path.join(PROJECT_ROOT, 'book', 'utils', 'log.md'))
        assert.equal(md2.id, 'log')
    })

    it('PathPolicy 正确计算 href', () => {
        const policy = new PathPolicy(PROJECT_ROOT)
        const href = policy.publishHref(path.join(PROJECT_ROOT, 'book', 'base', 'presum', 'index.md'))
        assert.equal(href, '/base/presum/index.html')
    })

    it('PathPolicy 正确计算 outputPath', () => {
        const policy = new PathPolicy(PROJECT_ROOT)
        const out = policy.outputPath(path.join(PROJECT_ROOT, 'book', 'base', 'presum', 'index.md'))
        assert.ok(out.endsWith('/dist/base/presum/index.html'))
    })

    it('resolveArticleSource 解析目录 + config', () => {
        const resolved = resolveArticleSource('base/presum', path.join(PROJECT_ROOT, 'book'))
        assert.ok(resolved.metadata.id)
        assert.ok(resolved.metadata.title)
        assert.ok(resolved.source.raw.includes('前缀和'))
    })

    it('normalizeMetadata 处理 hiden_* 别名并发出 warning', () => {
        const diag = []
        const md = normalizeMetadata({ hiden_id: 'myid', hiden_title: '旧标题' }, '/path/to/file.md', diag)
        assert.equal(md.id, 'myid')
        assert.equal(md.title, '旧标题')
        assert.ok(diag.some(d => d.level === 'warning'), '应发出弃用警告')
    })

    it('旧 catalog 所有叶子均可解析，坏 config 仅产生诊断', () => {
        const policy = new PathPolicy(PROJECT_ROOT)
        const diag = []
        const catalog = loadCatalog(catalogPath, diag)
        const leaves = flattenCatalog(catalog)
        for (const leaf of leaves) {
            try {
                resolveArticleSource(leaf, policy.book, diag)
            }
            catch (e) {
                diag.push({ phase: 'catalog-validate', level: 'error', message: `${leaf}: ${e.message}` })
            }
        }
        const errors = diag.filter(d => d.level === 'error')
        assert.equal(errors.length, 0, `解析错误: ${errors.map(e => e.message).join('; ')}`)
        const warnings = diag.filter(d => d.level === 'warning')
        // 已知的坏 config 应产生 warning 而非 error
        // 旧代码（jsonc_parse 忽略 errors）容错通过，新代码保持兼容
        if (warnings.length > 0) {
            console.log(`[诊断] ${warnings.length} 个配置警告 (已容错):`)
            warnings.forEach(w => console.log(`  ${w.message}`))
        }
    })
})
