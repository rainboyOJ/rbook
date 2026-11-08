const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const { runFixture, assertMarkers } = require('./helpers/fixture-runner.js')

const FIXTURES = path.join(__dirname, 'fixtures', 'markdown')

describe('发布契约 fixtures', () => {
    it('basic-syntax.md 渲染出标题/列表/表格/代码及KaTeX数学公式', () => {
        const { html } = runFixture(path.join(FIXTURES, 'basic-syntax.md'))
        assertMarkers(html, ['<h2', '<ul>', '<table>', '<pre', 'class="katex"'], assert)
    })

    it('containers.md 渲染容器', () => {
        const { html } = runFixture(path.join(FIXTURES, 'containers.md'))
        assertMarkers(html, [
            'class="oneWordAlgo"',
            'class="colorfulbox bg-light"',
            'class="warning"',
            'class="info"',
            'class="error"',
            'class="blackboard"',
            '<details>',
            'class="rbook-callout-label">说明',
            'class="rbook-callout-label">注意',
            'class="rbook-callout-label">错误',
        ], assert)
    })

    it('fences.md 渲染各种代码块及伪代码', () => {
        const { html } = runFixture(path.join(FIXTURES, 'fences.md'))
        assertMarkers(html, [
            'class="mermaid"',
            'class="plantuml"',
            'class="rbook-graphviz"',
            '<svg role="img"',
            'class="pseudocode"',
            'markdown-it-code-copy',
        ], assert)
    })

    it('typography.md 渲染正文排版检查点（行号列/行内代码/公式/容器）', () => {
        const { html, diagnostics } = runFixture(path.join(FIXTURES, 'typography.md'))

        // 渲染阶段无诊断错误（公式、容器、代码块全部被识别）。
        const errors = diagnostics.filter(d => d.level === 'error')
        assert.deepEqual(errors, [])

        // 代码块：带行号列（fence 插件构建期生成）+ 复制按钮。
        assertMarkers(html, [
            'class="code-with-linenumber line-numbers-mode"',
            'class="line-numbers-pre"',
            'markdown-it-code-copy',
        ], assert)

        // 行号列与代码行数一致。
        const numberBlocks = [...html.matchAll(/line-numbers-wrapper" aria-hidden="true">([\s\S]*?)<\/span>/g)]
        assert.ok(numberBlocks.length >= 4, '应存在多个带行号的代码块')
        for (const m of numberBlocks) {
            assert.ok(m[1].trim().length > 0, '行号列不应为空')
        }

        // 缩进代码块没有行号容器，需独立验证其排版。
        assert.ok(html.includes('<pre><code>'), '应包含缩进代码块')

        // 行内代码在正文里出现。
        assert.equal((html.match(/<code>/g) || []).length > 0, true, '应包含行内代码')

        // 数学公式（行内 + 块级）。
        assertMarkers(html, ['class="katex"', 'katex-display'], assert)

        // 标题层级 H1～H6。
        for (const level of [1, 2, 3, 4, 5, 6]) {
            assert.ok(html.includes(`<h${level}`), `应包含 h${level}`)
        }

        // 列表、引用、表格。
        assertMarkers(html, ['<ul>', '<ol>', '<blockquote>', '<table>'], assert)

        // 容器组件。
        assertMarkers(html, ['class="oneWordAlgo"', 'class="info"', 'class="colorfulbox bg-light"'], assert)
    })

    it('excalidraw.md 渲染相对路径图片及交互按钮', () => {
        const { html } = runFixture(path.join(FIXTURES, 'excalidraw.md'))
        assertMarkers(html, ['<img', 'class="image-wrapper"', 'image-extension-badge'], assert)
    })

    it('triple-brackets.md 渲染文章链接与题解链接', () => {
        const { html } = runFixture(path.join(FIXTURES, 'triple-brackets.md'))
        assertMarkers(html, [
            // 两种引用各自的类名，以及 1em 描边标记（不再有 favicon 位图）。
            'class="extra-link extra-link--article"',
            'class="extra-link extra-link--problem"',
            'class="extra-link__mark"',
            '/base/presum/index.html',
            // 找不到目标时保留灰色方括号标记。
            'class="extra-link missing"',
        ], assert)
        assert.ok(!html.includes('favicon-32x32.png'), '不应再输出 rbook favicon 位图')
        assert.ok(!html.includes('<img'), '交叉引用不应包含任何 <img>')
        assert.ok(!html.includes('Rbook:'), '不再输出 Rbook: 前缀')
    })

    it('ejs-macros.md 渲染常用宏 (video, dvideo, iframe, pid_to_url)', () => {
        const { html } = runFixture(path.join(FIXTURES, 'ejs-macros.md'))
        assertMarkers(html, [
            '<video',
            '/video/test_video.mp4',
            'https://d.roj.ac.cn/d/RainboyVideo/test_video.mp4',
            '<iframe',
            '<a href="https://roj.ac.cn/luogu/8218"',
        ], assert)
    })
})
