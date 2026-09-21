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

describe('交互动画 Markdown 扩展', () => {
    const index = buildArticleIndex({ entries: [], source: '' }, [])

    function fixture() {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rbook-animate-'))
        const articleDir = path.join(root, 'chapter')
        fs.mkdirSync(articleDir, { recursive: true })
        return { root, articleDir, article: path.join(articleDir, 'index.md') }
    }

    function render(source, setup) {
        const diagnostics = []
        const md = createMarkdownRenderer({
            index,
            diagnostics,
            animate: { root: setup.root, projectRoot: setup.root, diagnostics },
            include: {
                roots: [setup.root],
                projectRoot: setup.root,
                diagnostics,
            },
        })
        const content = renderMarkdown(source, md, { currentMdFilePath: setup.article }).content
        return { content, diagnostics }
    }

    it('把同目录 TS 引用渲染为稳定的动画模块 URL', t => {
        const setup = fixture()
        t.after(() => fs.rmSync(setup.root, { recursive: true, force: true }))
        fs.writeFileSync(path.join(setup.articleDir, 'demo.animation.ts'), 'export function mount() {}\n')

        const { content, diagnostics } = render('[[[animate: ./demo.animation.ts]]]', setup)

        assert.match(content, /class="rbook-animation"/)
        assert.match(content, /data-animation-module="\/animations\/chapter\/demo\.js"/)
        assert.equal(diagnostics.length, 0)
    })

    it('按 include 片段自身所在目录解析相对动画路径', t => {
        const setup = fixture()
        t.after(() => fs.rmSync(setup.root, { recursive: true, force: true }))
        const partialDir = path.join(setup.root, 'partials')
        fs.mkdirSync(partialDir)
        fs.writeFileSync(path.join(partialDir, 'demo.md'), '[[[animate: ./demo.animation.ts]]]\n')
        fs.writeFileSync(path.join(partialDir, 'demo.animation.ts'), 'export function mount() {}\n')

        const { content, diagnostics } = render('[[[include: ../partials/demo.md]]]', setup)

        assert.match(content, /data-animation-module="\/animations\/partials\/demo\.js"/)
        assert.equal(diagnostics.length, 0)
    })

    it('缺失、错误扩展名和越界引用都产生可见失败及 error 诊断', t => {
        const setup = fixture()
        t.after(() => fs.rmSync(setup.root, { recursive: true, force: true }))

        const cases = [
            '[[[animate: ./missing.animation.ts]]]',
            '[[[animate: ./demo.ts]]]',
            '[[[animate: ../../outside.animation.ts]]]',
        ]
        for (const source of cases) {
            const { content, diagnostics } = render(source, setup)
            assert.match(content, /rbook-animation--error/)
            assert.ok(diagnostics.some(item => item.phase === 'animate' && item.level === 'error'))
        }
    })
})
