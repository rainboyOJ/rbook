const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')
const sass = require('sass')

const PROJECT_ROOT = path.resolve(__dirname, '..')

describe('发布样式资源', () => {
    it('把伪代码样式内联到 markdown.css，不生成 source-only CSS 请求', () => {
        const result = sass.compile(path.join(PROJECT_ROOT, 'src/markdown-style/markdown.scss'))

        assert.match(result.css, /\.ps-root\s*\{/, 'markdown.css 应包含伪代码样式')
        assert.doesNotMatch(
            result.css,
            /@import\s+["']\.\/markdownPlugin\/pseudocode\.css["']/,
            'markdown.css 不应请求源码目录中的 pseudocode.css',
        )
    })
})

describe('正文排版变量与规则（typography）', () => {
    const shellSource = fs.readFileSync(
        path.join(PROJECT_ROOT, 'src/style/article-shell.scss'), 'utf8')
    const typographySource = fs.readFileSync(
        path.join(PROJECT_ROOT, 'src/markdown-style/typography.scss'), 'utf8')
    const markdownSource = fs.readFileSync(
        path.join(PROJECT_ROOT, 'src/markdown-style/markdown.scss'), 'utf8')
    const compiled = sass.compile(path.join(PROJECT_ROOT, 'src/markdown-style/markdown.scss')).css

    it('排版变量集中定义在 article-shell.scss 并提供浅色/暗色两套值', () => {
        for (const name of [
            '--rbook-font-body',
            '--rbook-font-heading',
            '--rbook-font-mono',
            '--rbook-body-size',
            '--rbook-body-lh',
            '--rbook-code-size',
            '--rbook-code-lh',
            '--rbook-inline-code-size',
            '--rbook-article-width',
            '--rbook-code-bg',
            '--rbook-code-border',
        ]) {
            assert.ok(shellSource.includes(`${name}:`), `缺少排版变量 ${name}`)
        }

        // 暗色主题块存在且重新定义了颜色变量。
        const darkBlock = shellSource.split('html[data-theme="dark"]')[1] || ''
        assert.ok(darkBlock.includes('--rbook-code-bg:'), '暗色主题应定义代码背景变量')
    })

    it('固定正文 16px/24px、代码 14px/22px、正文宽度 42em', () => {
        assert.match(shellSource, /--rbook-body-size:\s*16px/)
        assert.match(shellSource, /--rbook-body-lh:\s*24px/)
        assert.match(shellSource, /--rbook-code-size:\s*14px/)
        assert.match(shellSource, /--rbook-code-lh:\s*22px/)
        assert.match(shellSource, /--rbook-inline-code-size:\s*0\.875em/)
        assert.match(shellSource, /--rbook-article-width:\s*42em/)
    })

    it('正文规则限定在 .rbook-article .markdown-body 内', () => {
        // typography.scss 的每个顶级选择器都应锚定在 .rbook-article 上。
        const selectors = typographySource
            .split('\n')
            .filter(line => line.startsWith('.') || line.startsWith('html') || line.startsWith('@media'))
        const scoped = selectors.filter(s =>
            s.startsWith('.rbook-article') || s.startsWith('@media') || s.startsWith('html:'))
        assert.equal(selectors.length, scoped.length, '存在未限定 .rbook-article 的正文规则')
    })

    it('markdown.scss 不再设置 62.5% 根字号', () => {
        assert.doesNotMatch(markdownSource, /62\.5%/)
        assert.doesNotMatch(compiled, /font-size:\s*62\.5%/, '编译产物不应包含 62.5% 根字号')
    })

    it('markdown.scss 首先导入主题变量，再导入正文排版基础', () => {
        const shellIdx = markdownSource.indexOf('@import "../style/article-shell.scss"')
        const typoIdx = markdownSource.indexOf('@import "./typography.scss"')
        assert.ok(shellIdx !== -1, '应导入 article-shell.scss')
        assert.ok(typoIdx !== -1, '应导入 typography.scss')
        assert.ok(shellIdx < typoIdx, '主题变量应在正文排版基础之前导入')
    })

    it('编译产物包含正文节奏与行内代码统一规则', () => {
        assert.match(compiled, /\.rbook-article \.markdown-body \{/)
        assert.match(compiled, /max-width:\s*var\(--rbook-article-width\)/)
        assert.match(compiled, /\.rbook-article \.markdown-body :not\(pre\) > code \{/)
        assert.match(compiled, /font-size:\s*var\(--rbook-inline-code-size\)/)
    })

    it('行号列与代码列共享 --rbook-code-* 度量变量', () => {
        const lineNumbers = fs.readFileSync(
            path.join(PROJECT_ROOT, 'src/markdown-style/vendor/markdown-r.scss'), 'utf8')
        assert.match(lineNumbers, /font-size:\s*var\(--rbook-code-size\)/)
        assert.match(lineNumbers, /line-height:\s*var\(--rbook-code-lh\)/)
    })

    it('fence 插件不再输出内联定位样式（复制按钮样式收括到 scss）', () => {
        const fenceSource = fs.readFileSync(
            path.join(PROJECT_ROOT, 'src/publishing/markdown/plugins/fence.ts'), 'utf8')
        assert.doesNotMatch(fenceSource, /style="position:\s*relative"/)
        assert.doesNotMatch(fenceSource, /style="position:\s*absolute;\s*top:\s*10px/)
    })
})
