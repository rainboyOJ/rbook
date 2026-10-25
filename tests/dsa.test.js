const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const { createMarkdownRenderer, renderMarkdown } = require(
    path.join(PROJECT_ROOT, '.tsbuild/publishing/markdown/create-markdown-renderer.js'),
)
const { buildArticleIndex } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/index.js'))

/**
 * `[[[dsa: slug]]]` 卡片扩展。用临时目录 + 自定义 manifest，
 * 不依赖真实 book/demos.json 的具体条目（那张表会被重新抓取而变动）。
 */
describe('动画卡片 Markdown 扩展', () => {
    const index = buildArticleIndex({ entries: [], source: '' }, [])

    const MANIFEST = {
        sites: {
            anima1: { baseUrl: 'https://anima1.example', label: 'anima1', title: '站一' },
            dsa3: { baseUrl: 'https://dsa3.example', label: 'dsa3', title: '站二' },
        },
        demos: {
            plain: {
                site: 'anima1',
                path: '/plain/',
                title: '朴素演示',
                icon: 'icon-apple',
            },
            rich: {
                site: 'dsa3',
                path: '/Animate/rich/',
                title: '丰富演示',
                icon: 'string',
                description: '一句描述。',
                tags: ['标签甲', '标签乙'],
                accent: '#123456',
            },
            // 图标名不在插件的内联 SVG 表里：应回退到通用播放图标而不是崩溃
            unknownicon: {
                site: 'dsa3',
                path: '/Animate/unknownicon/',
                title: '未知图标',
                icon: 'not-a-real-icon',
            },
            // 站点不在 sites 表里：应渲染错误框
            orphansite: {
                site: 'ghost',
                path: '/ghost/',
                title: '幽灵站点',
            },
        },
    }

    function fixture() {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rbook-dsa-'))
        const articleDir = path.join(root, 'chapter')
        fs.mkdirSync(articleDir, { recursive: true })
        const manifestPath = path.join(root, 'demos.json')
        fs.writeFileSync(manifestPath, JSON.stringify(MANIFEST, null, 2))
        return { root, articleDir, article: path.join(articleDir, 'index.md'), manifestPath }
    }

    function render(source, setup, overrides = {}) {
        const diagnostics = []
        const md = createMarkdownRenderer({
            index,
            diagnostics,
            dsa: { manifestPath: setup.manifestPath, diagnostics, ...overrides },
            include: {
                roots: [setup.root],
                projectRoot: setup.root,
                diagnostics,
            },
        })
        const content = renderMarkdown(source, md, { currentMdFilePath: setup.article }).content
        return { content, diagnostics }
    }

    it('anima1 演示渲染成水果图标 + 站点徽章的外链卡片', t => {
        const setup = fixture()
        t.after(() => fs.rmSync(setup.root, { recursive: true, force: true }))

        const { content, diagnostics } = render('[[[dsa: plain]]]', setup)

        assert.match(content, /class="rbook-dsa-card"/)
        assert.match(content, /href="https:\/\/anima1\.example\/plain\/"/)
        assert.match(content, /target="_blank"/)
        assert.match(content, /rel="noopener"/)
        assert.match(content, /<i class="fruit-icon icon-apple"/)
        assert.match(content, /朴素演示/)
        assert.match(content, /class="rbook-dsa-card__badge">anima1</)
        assert.deepEqual(diagnostics, [])
    })

    it('dsa3 演示带描述、标签与 accent 色，图标为内联 SVG', t => {
        const setup = fixture()
        t.after(() => fs.rmSync(setup.root, { recursive: true, force: true }))

        const { content } = render('[[[dsa: rich]]]', setup)

        assert.match(content, /href="https:\/\/dsa3\.example\/Animate\/rich\/"/)
        assert.match(content, /<svg class="rbook-dsa-card__svg"/)
        assert.match(content, /--rbook-dsa-accent:#123456/)
        assert.match(content, /class="rbook-dsa-card__desc">一句描述。/)
        assert.match(content, /<li>标签甲<\/li><li>标签乙<\/li>/)
        assert.match(content, /class="rbook-dsa-card__badge">dsa3</)
    })

    it('标题覆盖生效但 slug 仍需在注册表中', t => {
        const setup = fixture()
        t.after(() => fs.rmSync(setup.root, { recursive: true, force: true }))

        const ok = render('[[[dsa: plain | 我改的标题]]]', setup)
        assert.match(ok.content, /我改的标题/)
        assert.match(ok.content, /class="rbook-dsa-card__badge">anima1</)
        assert.deepEqual(ok.diagnostics, [])

        // 覆盖了标题也必须校验 slug：写错一样是错误
        const bad = render('[[[dsa: not-registered | 我改的标题]]]', setup)
        assert.equal(bad.diagnostics.length, 1)
        assert.equal(bad.diagnostics[0].level, 'error')
    })

    it('未知 slug、空 slug、未知站点都报 error 并渲染占位框', t => {
        const setup = fixture()
        t.after(() => fs.rmSync(setup.root, { recursive: true, force: true }))

        const { content, diagnostics } = render(
            '[[[dsa: nope]]]\n\n[[[dsa: ]]]\n\n[[[dsa: orphansite]]]',
            setup,
        )

        assert.equal(diagnostics.length, 3)
        for (const d of diagnostics) {
            assert.equal(d.level, 'error')
            assert.equal(d.phase, 'dsa')
        }
        assert.equal((content.match(/rbook-dsa-card--error/g) || []).length, 3)
    })

    it('代码块与行内代码里的语法保持原文不展开', t => {
        const setup = fixture()
        t.after(() => fs.rmSync(setup.root, { recursive: true, force: true }))

        const { content, diagnostics } = render(
            '用 `[[[dsa: plain]]]` 这样写。\n\n```md\n[[[dsa: plain]]]\n```\n',
            setup,
        )

        // 两处都必须是原文，且不应产生任何诊断（围栏内容会同时出现在
        // <code> 和复制按钮的 data-clipboard-text 里，所以按行首锚点计数）
        assert.match(content, /<code[^>]*>\[\[\[dsa: plain\]\]\]/)
        assert.match(content, /<code>\[\[\[dsa: plain\]\]\]<\/code>/)
        assert.doesNotMatch(content, /class="rbook-dsa-card"/)
        assert.deepEqual(diagnostics, [])
    })

    it('被 include 的片段里的卡片同样展开', t => {
        const setup = fixture()
        t.after(() => fs.rmSync(setup.root, { recursive: true, force: true }))

        // include 相对文章所在目录解析，所以片段写在文章同目录
        const fragment = path.join(setup.articleDir, 'frag.md')
        fs.writeFileSync(fragment, '片段：\n\n[[[dsa: plain]]]\n')

        const { content, diagnostics } = render('[[[include: ./frag.md]]]\n', setup)

        assert.match(content, /class="rbook-dsa-card"/)
        assert.match(content, /href="https:\/\/anima1\.example\/plain\/"/)
        assert.deepEqual(diagnostics, [])
    })

    it('围栏里的多条指令都保持原文（不止第一条）', t => {
        const setup = fixture()
        t.after(() => fs.rmSync(setup.root, { recursive: true, force: true }))

        // 回归：早期实现会把围栏拆成首尾两个片段，
        // 导致围栏内部只剩第一条指令被保护，后面几条仍然被展开。
        const src = '```md\n[[[dsa: plain]]]\n\n[[[dsa: rich]]]\n```\n'
        const { content, diagnostics } = render(src, setup)

        assert.doesNotMatch(content, /class="rbook-dsa-card"/)
        // 围栏正文（含复制按钮的副本）里两条指令都应保持字面量
        const code = content.match(/<code[^>]*>([\s\S]*?)<\/code>/)
        assert.ok(code, '应渲染出代码块')
        assert.equal((code[1].match(/\[\[\[dsa:/g) || []).length, 2)
        assert.deepEqual(diagnostics, [])
    })

    it('围栏外的卡片不受相邻围栏影响，且未闭合围栏也不漏', t => {
        const setup = fixture()
        t.after(() => fs.rmSync(setup.root, { recursive: true, force: true }))

        // 卡片夹在两个围栏之间：仍应渲染成卡片
        const between = render('```cpp\nint x;\n```\n\n[[[dsa: plain]]]\n\n```cpp\nint y;\n```\n', setup)
        assert.equal((between.content.match(/class="rbook-dsa-card"/g) || []).length, 1)

        // 未闭合围栏：markdown-it 会吃到底，卡片不应被展开
        const unclosed = render('```md\n[[[dsa: plain]]]\n', setup)
        assert.doesNotMatch(unclosed.content, /class="rbook-dsa-card"/)
    })

    it('manifest 结构不正确时立即抛错而不是静默跳过', t => {
        const setup = fixture()
        t.after(() => fs.rmSync(setup.root, { recursive: true, force: true }))

        const broken = path.join(setup.root, 'broken.json')
        fs.writeFileSync(broken, JSON.stringify({ demos: {} }))

        assert.throws(
            () => render('[[[dsa: plain]]]', setup, { manifestPath: broken }),
            /book\/demos\.json 结构不正确/,
        )
    })
})
