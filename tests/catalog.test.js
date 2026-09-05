const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

describe('Phase 2: Catalog 与元数据模型', () => {
    const PROJECT_ROOT = path.resolve(__dirname, '..')
    const { loadCatalog } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/catalog-loader.js'))
    const { normalizeMetadata } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/metadata-normalizer.js'))
    const { PathPolicy } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/path-policy.js'))
    const { resolveArticleSource } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/source-resolver.js'))
    const { flattenCatalog } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/catalog.js'))

    const catalogPath = path.join(PROJECT_ROOT, 'book', 'catalog.yaml')
    const oldMenu = require(path.join(PROJECT_ROOT, 'src', 'menu.js'))

    it('catalog 加载无错误', () => {
        const diag = []
        const catalog = loadCatalog(catalogPath, diag)
        assert.ok(catalog.entries.length > 0, 'catalog 应有条目')
        const errors = diag.filter(d => d.level === 'error')
        assert.equal(errors.length, 0, `catalog 校验错误: ${JSON.stringify(errors)}`)
    })

    it('catalog 叶子文章数与旧 flatten_menu 一致', () => {
        const catalog = loadCatalog(catalogPath)
        const newLeaves = flattenCatalog(catalog)
        assert.equal(newLeaves.length, oldMenu.flatten_menu.length,
            `叶子数不匹配: 新=${newLeaves.length} 旧=${oldMenu.flatten_menu.length}`)
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