const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const { createMarkdownRenderer, renderMarkdown } = require(
    path.join(PROJECT_ROOT, '.tsbuild/publishing/markdown/create-markdown-renderer.js'),
)
const { buildArticleIndex } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/index.js'))
const { cleanKatexMessage } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/markdown/plugins/math.js'))

/**
 * LaTeX 诊断：KaTeX 的 strict 警告原本只走 console.warn、不带文件信息，
 * 现在必须转成带 sourcePath 的 Diagnostic，能定位到具体 md。
 */
describe('LaTeX 诊断归因', () => {
    const index = buildArticleIndex({ entries: [], source: '' }, [])
    const fakeFile = path.join(PROJECT_ROOT, 'book', 'base', 'presum', 'index.md')

    function renderWithDiag(md) {
        const diag = []
        const renderer = createMarkdownRenderer({ index, diagnostics: diag, projectRoot: PROJECT_ROOT })
        const { content } = renderMarkdown(md, renderer, { currentMdFilePath: fakeFile, root: PROJECT_ROOT })
        return { content, diag }
    }

    it('KaTeX strict 警告带 sourcePath 归因（不是裸 console.warn）', () => {
        // {cc} 声明两列却用三列 -> KaTeX 发 textEnv strict 警告
        const { diag } = renderWithDiag('$$\\begin{array}{cc} a & b & c \\end{array}$$')
        const latex = diag.filter(d => d.phase === 'latex')
        assert.ok(latex.length > 0, `应产生 latex 诊断，实际: ${JSON.stringify(diag)}`)
        assert.equal(latex[0].sourcePath, fakeFile, '诊断应指向当前渲染的文件')
        assert.match(latex[0].message, /columns/i)
        assert.ok(latex[0].suggestion && latex[0].suggestion.includes('公式'), '应附带出错公式片段')
    })

    it('cleanKatexMessage 去掉 KaTeX 前缀与 ruleId', () => {
        const raw = "LaTeX-incompatible input and strict mode is set to 'warn': Too few columns specified in the {array} column argument. [textEnv]"
        assert.equal(cleanKatexMessage(raw), 'Too few columns specified in the {array} column argument.')
    })

    it('合法公式不产生 latex 诊断', () => {
        const { diag } = renderWithDiag('$$a^2 + b^2 = c^2$$')
        assert.equal(diag.filter(d => d.phase === 'latex').length, 0)
    })

    it('未转义的 & 产生可见错误（不被静默吞掉）', () => {
        const { content } = renderWithDiag('$$x = x & y$$')
        assert.ok(content.includes('katex-error'), '未转义的 & 应渲染成可见错误')
    })
})

/**
 * 静默丢内容防线：markdown-it-texmath 的 $$ 块级规则在
 * "$$ 内部还有 $" 时不匹配，且不抛异常，只会把 $$ 当正文输出。
 * 必须转成带文件+行号的诊断，不能静默。
 */
describe('显示公式 $$ 漏解析检测', () => {
    const index = buildArticleIndex({ entries: [], source: '' }, [])
    const fakeFile = path.join(PROJECT_ROOT, 'book', 'base', 'presum', 'index.md')

    function render(md) {
        const diag = []
        const renderer = createMarkdownRenderer({ index, diagnostics: diag, projectRoot: PROJECT_ROOT })
        const { content } = renderMarkdown(md, renderer, { currentMdFilePath: fakeFile, root: PROJECT_ROOT })
        return { content, latex: diag.filter(d => d.phase === 'latex') }
    }

    it('$$ 内部嵌套 $ 时报错并指出文件与行号', () => {
        const { content, latex } = render('前言\n\n$$\nf(x) = \\text{没有选$a$}\n$$\n')
        assert.ok(content.includes('$$'), '此场景 $$ 会漏成正文')
        assert.equal(latex.length, 1, '应恰好报一次')
        assert.equal(latex[0].sourcePath, fakeFile)
        assert.equal(latex[0].line, 3, '应指向公式起始行')
        assert.match(latex[0].message, /显示公式/)
    })

    it('正常的 $$ 公式不误报', () => {
        const { content, latex } = render('前言\n\n$$\nf(x) = x^2 + 1\n$$\n')
        assert.ok(!content.includes('$$'), '正常公式不应残留 $$')
        assert.equal(latex.length, 0)
    })

    it('行内 $x$ 不受影响', () => {
        const { content, latex } = render('设 $f(n)$ 表示方案数。\n')
        assert.ok(content.includes('katex'))
        assert.equal(latex.length, 0)
    })
})
