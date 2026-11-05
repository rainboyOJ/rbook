/**
 * dist/catalog.json 的约定：
 * 静态站没有 REST 接口，rbook_new_problem_solutions 靠这个文件把题解里的
 * `rbook1:<id>` 解析成文章标题与链接。所以「id 唯一」和「URL 是站内根相对路径」
 * 是这份清单的两条硬约束，破坏任何一条都会让链接静默指错。
 */
const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const build = name => require(path.join(PROJECT_ROOT, '.tsbuild/publishing', `${name}.js`))

const { PathPolicy } = build('content/path-policy')
const { loadCatalog } = build('content/catalog-loader')
const { flattenCatalog } = build('domain/catalog')
const { buildArticleIndex } = build('domain/index')
const { resolveArticleSource } = build('content/source-resolver')
const {
    SITE_ID,
    buildCatalogManifest,
    writeCatalogManifest,
} = build('pipeline/catalog-manifest')
const { prepareCatalog, emitCatalogManifest } = build('build/stages')

function entry(id, publishHref, extra = {}) {
    return {
        id,
        title: extra.title || id,
        sourcePath: extra.sourcePath || `/mock/book/${id}/index.md`,
        publishHref,
        metadata: {},
    }
}

/** 临时 root：book/src 指向真实书与模板（只读），dist 落在临时目录，避免污染仓库产物。 */
function makeTempRoot() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rbook-manifest-'))
    fs.symlinkSync(path.join(PROJECT_ROOT, 'book'), path.join(root, 'book'), 'dir')
    fs.symlinkSync(path.join(PROJECT_ROOT, 'src'), path.join(root, 'src'), 'dir')
    return root
}

function runPipeline(root, stages) {
    const ctx = {
        projectRoot: root,
        policy: new PathPolicy(root),
        diagnostics: [],
        stageResults: {},
    }
    for (const stage of stages) stage.run(ctx)
    return ctx
}

describe('catalog.json 清单生成', () => {
    it('站点短名是 rbook1（题解 frontmatter 用 rbook1:<id>）', () => {
        assert.equal(SITE_ID, 'rbook1')
        const manifest = buildCatalogManifest([entry('presum', '/base/presum/index.html')], {
            generatedAt: '2026-01-01T00:00:00.000Z',
        })
        assert.deepEqual(manifest, {
            site: 'rbook1',
            generatedAt: '2026-01-01T00:00:00.000Z',
            total: 1,
            items: [{ id: 'presum', title: 'presum', url: '/base/presum/index.html' }],
        })
    })

    it('重复 id 报 error，不让一个 id 指向两篇文章', () => {
        const diagnostics = []
        const manifest = buildCatalogManifest([
            entry('mst', '/graph/mst/index.html'),
            entry('mst', '/graph/MST/index.html'),
        ], { diagnostics })

        assert.equal(manifest.total, 1)
        assert.equal(manifest.items[0].url, '/graph/mst/index.html')
        const errors = diagnostics.filter(d => d.level === 'error')
        assert.equal(errors.length, 1)
        assert.match(errors[0].message, /重复的文章 id "mst"/)
    })

    it('URL 必须是站内根相对路径', () => {
        const diagnostics = []
        buildCatalogManifest([
            entry('a', 'https://rbook.roj.ac.cn/a/index.html'),
            entry('b', '//cdn.example.com/b.html'),
            entry('c', 'c/index.html'),
        ], { diagnostics })

        assert.equal(diagnostics.filter(d => d.level === 'error').length, 3)
        for (const d of diagnostics) assert.match(d.message, /站内根相对路径/)
    })

    it('缺标题的文章报 error：清单里不留没有文字可点的链接', () => {
        const diagnostics = []
        const manifest = buildCatalogManifest([{ ...entry('titled', '/x/index.html'), title: '' }], { diagnostics })
        assert.equal(manifest.total, 0)
        assert.match(diagnostics[0].message, /缺少标题/)
    })

    it('缺 id 的文章报 error 而不是写进清单', () => {
        const diagnostics = []
        const manifest = buildCatalogManifest([entry('', '/x/index.html')], { diagnostics })
        assert.equal(manifest.total, 0)
        assert.match(diagnostics[0].message, /缺少 id/)
    })

    it('写盘产物是带换行的 JSON，可被 JSON.parse 直接读', () => {
        const root = makeTempRoot()
        try {
            const raw = JSON.stringify({ site: 'rbook1', generatedAt: 'x', total: 0, items: [] }, null, 2)
            const target = writeCatalogManifest(path.join(root, 'dist'), JSON.parse(raw))
            const text = fs.readFileSync(target, 'utf8')
            assert.ok(text.endsWith('\n'))
            assert.equal(JSON.parse(text).site, 'rbook1')
        }
        finally {
            fs.rmSync(root, { recursive: true, force: true })
        }
    })
})

describe('emit-catalog-manifest 阶段跑真实书籍', () => {
    it('产出 catalog.json：id 唯一、URL 全是站内根相对路径', () => {
        const root = makeTempRoot()
        try {
            // 走真实阶段顺序：prepare-catalog 用 catalog 标题兜底，emit 再校验一次。
            const ctx = runPipeline(root, [prepareCatalog, emitCatalogManifest])

            const target = path.join(ctx.policy.dist, 'catalog.json')
            assert.ok(fs.existsSync(target), 'dist/catalog.json 应存在')
            const manifest = JSON.parse(fs.readFileSync(target, 'utf8'))

            assert.equal(manifest.site, 'rbook1')
            assert.ok(!Number.isNaN(Date.parse(manifest.generatedAt)))
            assert.equal(manifest.total, manifest.items.length)
            assert.equal(manifest.total, ctx.stageResults.leaves.length, '每个 catalog 叶子都应进入清单')

            const ids = new Set()
            for (const item of manifest.items) {
                assert.ok(item.id && typeof item.id === 'string')
                assert.ok(!ids.has(item.id), `id 重复: ${item.id}`)
                ids.add(item.id)
                assert.ok(item.url.startsWith('/'), `URL 必须以 / 开头: ${item.url}`)
                assert.ok(!item.url.startsWith('//'), `URL 不能是协议相对: ${item.url}`)
                assert.ok(item.url.endsWith('.html'), `URL 应是 .html 产物: ${item.url}`)
                assert.ok(item.title.trim().length > 0, `标题不能为空: ${item.id}`)
            }

            assert.ok(!ctx.diagnostics.some(d => d.level === 'error'), '不应产生 error 诊断')
        }
        finally {
            fs.rmSync(root, { recursive: true, force: true })
        }
    })

    it('重复 id 会让阶段抛错，构建不能带着脏清单发布', () => {
        const root = makeTempRoot()
        try {
            const policy = new PathPolicy(root)
            const ctx = {
                projectRoot: root,
                policy,
                diagnostics: [],
                stageResults: {
                    index: buildArticleIndex({ entries: [], source: '' }, [
                        entry('mst', '/graph/mst/index.html'),
                        entry('mst', '/graph/MST/index.html'),
                    ]),
                },
            }
            assert.throws(() => emitCatalogManifest.run(ctx), /无法进入 catalog\.json/)
            assert.ok(!fs.existsSync(path.join(policy.dist, 'catalog.json')))
        }
        finally {
            fs.rmSync(root, { recursive: true, force: true })
        }
    })
})
