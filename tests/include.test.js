const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const fs = require('fs')
const os = require('os')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const { createMarkdownRenderer, renderMarkdown } = require(
    path.join(PROJECT_ROOT, '.tsbuild/publishing/markdown/create-markdown-renderer.js'),
)
const { buildArticleIndex } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/index.js'))
const { IncludeResolver, parseFenceFileTarget, stripFenceFileAttr } = require(
    path.join(PROJECT_ROOT, '.tsbuild/publishing/markdown/plugins/include.js'),
)

/**
 * Phase 2: include 插件
 * 目标语法替代旧 EJS <%- include(...) %>，语义需与旧实现等价。
 */
describe('Phase 2: include 插件', () => {
    const index = buildArticleIndex({ entries: [], source: '' }, [])
    const zeroNumberDir = path.join(PROJECT_ROOT, 'book', 'base', 'zero_number')

    function renderNew(tpl, opts = {}) {
        const diag = []
        const md = createMarkdownRenderer({
            index,
            diagnostics: diag,
            projectRoot: PROJECT_ROOT,
            ...opts,
        })
        const env = {
            currentMdFilePath: path.join(zeroNumberDir, 'index.md'),
            root: PROJECT_ROOT,
            basePath: path.join(PROJECT_ROOT, 'book'),
        }
        return { html: renderMarkdown(tpl, md, env).content, diag }
    }

    function renderEjs(tpl) {
        const md = createMarkdownRenderer({ index, diagnostics: [], contentMacros: {} })
        const env = {
            currentMdFilePath: path.join(zeroNumberDir, 'index.md'),
            root: PROJECT_ROOT,
            basePath: path.join(PROJECT_ROOT, 'book'),
        }
        return renderMarkdown(tpl, md, env).content
    }

    it('fence 内 file= 读取代码文件并高亮', () => {
        const { html, diag } = renderNew('```cpp file=./sol.cpp\n```\n')
        assert.ok(html.includes('#include'), '应包含文件内容')
        assert.ok(html.includes('language-cpp'), '应按 cpp 高亮')
        assert.ok(!html.includes('file='), 'file= 属性不应泄漏到 class 里')
        assert.equal(diag.length, 0, `不应有诊断: ${JSON.stringify(diag)}`)
    })

    it('fence 内 file= 读取文件并高亮（不再依赖 EJS）', () => {
        const { html, diag } = renderNew('```cpp file=./sol.cpp\n```\n')
        assert.ok(html.includes('#include'), '应包含文件内容')
        assert.ok(html.includes('language-cpp'), '应按 cpp 高亮')
        assert.ok(!html.includes('file='), 'file= 不应泄漏到 class')
        assert.equal(diag.filter(d => d.level === 'error').length, 0)
    })

    it('fence 外 [[[include: ...]]] 内联片段并参与 markdown 解析', () => {
        const { html, diag } = renderNew('[[[include: ./problem.md]]]\n')
        // 片段里的 markdown 标题应被解析成 HTML
        assert.ok(html.includes('<h3>'), '片段内容应作为 markdown 解析')
        assert.ok(!html.includes('include-missing'), '不应有失败标记')
        assert.equal(diag.filter(d => d.level === 'error').length, 0)
    })

    it('绝对路径从项目根解析', () => {
        const { html, diag } = renderNew('[[[include: /algo_template/base/presum.cpp]]]\n')
        assert.ok(html.includes('int') || html.includes('include'), '应读到共享模板内容')
        assert.equal(diag.filter(d => d.level === 'error').length, 0)
    })

    it('支持嵌套 include（片段内含 include）', () => {
        // monotonic_stack/index.md -> luogu5788.md -> 5788.cpp
        const md = createMarkdownRenderer({ index, diagnostics: [], projectRoot: PROJECT_ROOT })
        const env = {
            currentMdFilePath: path.join(PROJECT_ROOT, 'book', 'data_structure', 'monotonic_stack', 'index.md'),
            root: PROJECT_ROOT,
        }
        const html = renderMarkdown('[[[include: ./luogu5788.md]]]\n', md, env).content
        assert.ok(html.length > 500, '嵌套内容应被展开')
        assert.ok(!html.includes('include-missing'), '不应有 include 失败标记')
        // 片段内的 fence（```c）里还有一次 include，应同样被展开
        assert.ok(html.includes('language-c'), '片段内的 fence include 也应生效')
        assert.ok(html.includes('stack'), '应含 5788.cpp 的内容')
    })

    it('目标不存在时产生 error 诊断并渲染可见标记（不静默）', () => {
        const { html, diag } = renderNew('[[[include: ./definitely_missing.md]]]\n')
        assert.ok(html.includes('include-missing'), '应有可见的失败标记')
        assert.ok(
            diag.some(d => d.level === 'error' && d.phase === 'include'),
            `应有 error 诊断，实际: ${JSON.stringify(diag)}`,
        )
    })

    it('被包含片段里的遗留 EJS 宏仍会被渲染（include 需先于 contentMacros）', () => {
        // zero_number/practice.md 里是 pid_to_url 宏，通过 include 引入。
        // pid_to_url 现走统一路由：luogu -> pcs2（不再是旧的 roj.ac.cn/{oj}/{id}）。
        const { html, diag } = renderNew('[[[include: ./practice.md]]]\n', { contentMacros: {} })
        assert.ok(html.includes('pcs2.roj.ac.cn/problems/luogu/P4552'), '片段里的 pid_to_url 应被渲染为 pcs2 链接')
        assert.ok(!html.includes('pid_to_url'), '不应泄漏宏原文')
        assert.ok(!html.includes('&lt;%'), '不应泄漏未渲染的 EJS 标记')
        assert.equal(diag.filter(d => d.level === 'error').length, 0)
    })

    it('fence 内目标不存在时也不静默', () => {
        const { html, diag } = renderNew('```cpp file=./nope.cpp\n```\n')
        assert.ok(html.includes('include-missing'), '应有可见的失败标记')
        assert.ok(diag.some(d => d.level === 'error'), '应有 error 诊断')
    })

    it('拒绝越界路径（路径沙箱）', () => {
        const { html, diag } = renderNew('[[[include: ../../../etc/passwd]]]\n')
        assert.ok(html.includes('include-missing'), '越界应失败')
        assert.ok(
            diag.some(d => d.message.includes('越界')),
            `应报路径越界，实际: ${JSON.stringify(diag)}`,
        )
    })

    it('拒绝绝对路径越界（不在允许根目录内）', () => {
        const { diag } = renderNew('[[[include: /etc/passwd]]]\n')
        assert.ok(diag.some(d => d.message.includes('越界')), '应报越界')
    })

    it('自包含不会死循环（深度上限）', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inc-'))
        const selfFile = path.join(dir, 'self.md')
        fs.writeFileSync(selfFile, 'A\n[[[include: ./self.md]]]\n')

        const diag = []
        const md = createMarkdownRenderer({
            index,
            diagnostics: diag,
            include: { roots: [dir], projectRoot: dir, diagnostics: diag, maxDepth: 3 },
        })
        const html = renderMarkdown('[[[include: ./self.md]]]\n', md, { currentMdFilePath: selfFile }).content

        assert.ok(html.length < 2000, '不应无限膨胀')
        assert.ok(diag.some(d => d.message.includes('嵌套')), '应报告嵌套过深')
        fs.rmSync(dir, { recursive: true, force: true })
    })

    it('parseFenceFileTarget / stripFenceFileAttr 处理各种写法', () => {
        assert.equal(parseFenceFileTarget('cpp file=./a.cpp'), './a.cpp')
        assert.equal(parseFenceFileTarget('cpp file="./a b.cpp"'), './a b.cpp')
        assert.equal(parseFenceFileTarget("cpp file='./a.cpp'"), './a.cpp')
        assert.equal(parseFenceFileTarget('cpp'), null)
        assert.equal(parseFenceFileTarget(''), null)

        assert.equal(stripFenceFileAttr('cpp file=./a.cpp'), 'cpp')
        assert.equal(stripFenceFileAttr('file=./a.cpp'), '')
        assert.equal(stripFenceFileAttr('cpp'), 'cpp')
    })

    it('IncludeResolver 尊重 roots 白名单', () => {
        const resolver = new IncludeResolver({ roots: [zeroNumberDir], projectRoot: PROJECT_ROOT })
        assert.ok(resolver.resolve('./sol.cpp', path.join(zeroNumberDir, 'index.md')), '同目录文件应可解析')
        assert.equal(resolver.resolve('/algo_template/base/presum.cpp'), null, 'root 外的绝对路径应被拒绝')
    })

    it('CRLF 源文件被规范化为 LF（与 CommonMark 一致）', () => {
        // 回归：file= 注入的内容会绕过 markdown-it 的 normalize 规则，
        // 若不显式规范化，产物里会残留 \r，与旧 EJS 路径行为不一致。
        const fs2 = require('fs')
        const os2 = require('os')
        const dir = fs2.mkdtempSync(path.join(os2.tmpdir(), 'crlf-'))
        fs2.writeFileSync(path.join(dir, 'crlf.cpp'), 'int a;\r\nint b;\r\n')

        const diag = []
        const md = createMarkdownRenderer({
            index,
            diagnostics: diag,
            include: { roots: [dir], projectRoot: dir, diagnostics: diag },
        })
        const html = renderMarkdown('```cpp file=./crlf.cpp\n```\n', md, {
            currentMdFilePath: path.join(dir, 'index.md'),
        }).content

        assert.ok(!html.includes('\r'), '不应残留 CR 字符')
        assert.ok(html.includes('int a;'), '应包含文件内容')
        fs2.rmSync(dir, { recursive: true, force: true })
    })
})
